-- ============================================================================
-- Brightpath — full Supabase setup (schema + RLS + storage + RPCs)
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- (Equivalent to running 0001_schema.sql, 0002_rls.sql, 0003_storage.sql,
--  0004_public_rpcs.sql in order — kept separately in supabase/migrations/
--  for anyone using the Supabase CLI / `supabase db push`.)
-- ============================================================================

-- ============================================================================
-- 0001_schema.sql — core schema
-- ============================================================================

create extension if not exists "pgcrypto";

create type user_role as enum ('student', 'parent', 'teacher', 'school_admin');
create type membership_status as enum ('pending', 'approved', 'rejected');
create type resource_status as enum ('uploading', 'processing', 'ready', 'failed');
create type adaptation_type as enum ('accessible', 'explain', 'vocabulary', 'breakdown', 'audio', 'practice', 'revision');
create type submission_status as enum ('not_started', 'in_progress', 'submitted', 'reviewed');
create type highlight_mode as enum ('none', 'paragraph', 'sentence', 'word');

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, mirrors auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role user_role not null,
  first_name text not null,
  last_name text not null,
  avatar_url text,
  student_code text unique,
  created_at timestamptz not null default now()
);

create index profiles_auth_user_id_idx on profiles(auth_user_id);

-- security-definer helpers avoid RLS recursion ------------------------------
create function my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from profiles where auth_user_id = auth.uid();
$$;

create function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where auth_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- schools
-- ---------------------------------------------------------------------------
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  status membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create function is_school_admin(p_school_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from school_members
    where school_id = p_school_id and user_id = my_profile_id()
      and role = 'school_admin' and status = 'approved'
  );
$$;

create function my_school_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from school_members where user_id = my_profile_id() and status = 'approved';
$$;

-- ---------------------------------------------------------------------------
-- classes / class_members
-- ---------------------------------------------------------------------------
create table classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  teacher_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  grade text,
  subject text,
  join_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create function is_teacher_of_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from classes where id = p_class_id and teacher_id = my_profile_id());
$$;

create function is_student_in_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from class_members where class_id = p_class_id and student_id = my_profile_id()
  );
$$;

create function is_student_of_teacher(p_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from class_members cm
    join classes c on c.id = cm.class_id
    where cm.student_id = p_student_id and c.teacher_id = my_profile_id()
  );
$$;

-- ---------------------------------------------------------------------------
-- parent_student_links
-- ---------------------------------------------------------------------------
create table parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  relationship text,
  status membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create function is_parent_of_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from parent_student_links
    where student_id = p_student_id and parent_id = my_profile_id() and status = 'approved'
  );
$$;

-- ---------------------------------------------------------------------------
-- resources / resource_adaptations
-- ---------------------------------------------------------------------------
create table resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  school_id uuid references schools(id) on delete set null,
  title text not null,
  subject text,
  grade text,
  original_file_url text,
  original_file_type text,
  extracted_text text,
  extracted_structure jsonb,
  status resource_status not null default 'uploading',
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table resource_adaptations (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  type adaptation_type not null,
  content jsonb not null,
  created_by uuid not null references profiles(id) on delete cascade,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create function owns_resource(p_resource_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from resources where id = p_resource_id and owner_id = my_profile_id());
$$;

-- ---------------------------------------------------------------------------
-- assignments / submissions
-- ---------------------------------------------------------------------------
create table assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  resource_id uuid references resources(id) on delete set null,
  title text not null,
  description text,
  instructions text,
  subject text,
  accessibility_support jsonb,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  content jsonb,
  status submission_status not null default 'not_started',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create function is_own_assignment_class(p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from assignments a
    where a.id = p_assignment_id and is_student_in_class(a.class_id)
  );
$$;

create function teaches_assignment(p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from assignments where id = p_assignment_id and teacher_id = my_profile_id());
$$;

-- ---------------------------------------------------------------------------
-- reading_preferences / notes / progress_events
-- ---------------------------------------------------------------------------
create table reading_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  font_size int not null default 18,
  line_spacing numeric not null default 1.6,
  letter_spacing numeric not null default 0.02,
  word_spacing numeric not null default 0.05,
  content_width text not null default 'comfortable',
  alignment text not null default 'left',
  background text not null default 'cream',
  reading_speed numeric not null default 1.0,
  highlight_mode highlight_mode not null default 'sentence',
  dyslexia_font boolean not null default true,
  updated_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  content text not null,
  position jsonb,
  created_at timestamptz not null default now()
);

create table progress_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  resource_id uuid references resources(id) on delete set null,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- messages / notifications
-- ---------------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  attachment_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index classes_school_idx on classes(school_id);
create index classes_teacher_idx on classes(teacher_id);
create index class_members_student_idx on class_members(student_id);
create index resources_owner_idx on resources(owner_id);
create index resource_adaptations_resource_idx on resource_adaptations(resource_id);
create index assignments_class_idx on assignments(class_id);
create index submissions_student_idx on submissions(student_id);
create index notes_resource_idx on notes(resource_id);
create index progress_events_student_idx on progress_events(student_id);
create index messages_recipient_idx on messages(recipient_id, read_at);
create index notifications_user_idx on notifications(user_id, read);

-- ============================================================================
-- 0002_rls.sql — Row Level Security policies
-- ============================================================================

alter table profiles enable row level security;
alter table schools enable row level security;
alter table school_members enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table parent_student_links enable row level security;
alter table resources enable row level security;
alter table resource_adaptations enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table reading_preferences enable row level security;
alter table notes enable row level security;
alter table progress_events enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- profiles -------------------------------------------------------------------
create policy "profiles: self select" on profiles for select
  using (auth_user_id = auth.uid());

create policy "profiles: self insert" on profiles for insert
  with check (auth_user_id = auth.uid());

create policy "profiles: self update" on profiles for update
  using (auth_user_id = auth.uid());

-- a teacher can see basic profile info of their own students
create policy "profiles: teacher sees students" on profiles for select
  using (is_student_of_teacher(id));

-- a parent can see linked children's profile
create policy "profiles: parent sees linked child" on profiles for select
  using (is_parent_of_student(id));

-- classmates / school staff visibility handled via views in app layer, kept minimal here
create policy "profiles: school admin sees school members" on profiles for select
  using (
    exists (
      select 1 from school_members sm
      where sm.user_id = profiles.id
        and sm.school_id in (select my_school_ids())
        and is_school_admin(sm.school_id)
    )
  );

-- schools ----------------------------------------------------------------------
create policy "schools: members can view" on schools for select
  using (id in (select my_school_ids()));

create policy "schools: admin can update" on schools for update
  using (is_school_admin(id));

-- school_members -----------------------------------------------------------
create policy "school_members: self select" on school_members for select
  using (user_id = my_profile_id() or is_school_admin(school_id));

create policy "school_members: admin manages" on school_members for insert
  with check (is_school_admin(school_id));

create policy "school_members: admin updates" on school_members for update
  using (is_school_admin(school_id));

create policy "school_members: self requests join" on school_members for insert
  with check (user_id = my_profile_id());

-- classes ------------------------------------------------------------------
create policy "classes: teacher manages own" on classes for all
  using (teacher_id = my_profile_id())
  with check (teacher_id = my_profile_id());

create policy "classes: student views own class" on classes for select
  using (is_student_in_class(id));

create policy "classes: school admin views" on classes for select
  using (is_school_admin(school_id));

-- class_members --------------------------------------------------------------
create policy "class_members: teacher manages" on class_members for all
  using (is_teacher_of_class(class_id))
  with check (is_teacher_of_class(class_id));

create policy "class_members: student views own membership" on class_members for select
  using (student_id = my_profile_id());

create policy "class_members: student self-enrolls" on class_members for insert
  with check (student_id = my_profile_id());

create policy "class_members: parent views child membership" on class_members for select
  using (is_parent_of_student(student_id));

-- parent_student_links -------------------------------------------------------
create policy "psl: parent views own links" on parent_student_links for select
  using (parent_id = my_profile_id());

create policy "psl: student views own links" on parent_student_links for select
  using (student_id = my_profile_id());

create policy "psl: parent creates request" on parent_student_links for insert
  with check (parent_id = my_profile_id());

create policy "psl: teacher/school approves" on parent_student_links for update
  using (is_student_of_teacher(student_id) or my_role() = 'school_admin');

-- resources --------------------------------------------------------------------
create policy "resources: owner manages" on resources for all
  using (owner_id = my_profile_id())
  with check (owner_id = my_profile_id());

create policy "resources: student views assigned" on resources for select
  using (
    exists (
      select 1 from assignments a
      where a.resource_id = resources.id and is_student_in_class(a.class_id)
    )
  );

create policy "resources: school admin views school resources" on resources for select
  using (school_id in (select my_school_ids()) and is_school_admin(school_id));

create policy "resources: parent views child's assigned resources" on resources for select
  using (
    exists (
      select 1 from assignments a
      join class_members cm on cm.class_id = a.class_id
      where a.resource_id = resources.id and is_parent_of_student(cm.student_id)
    )
  );

-- resource_adaptations -----------------------------------------------------
create policy "adaptations: resource owner manages" on resource_adaptations for all
  using (owns_resource(resource_id))
  with check (owns_resource(resource_id));

create policy "adaptations: student views approved on assigned resource" on resource_adaptations for select
  using (
    approved = true
    and exists (
      select 1 from assignments a
      where a.resource_id = resource_adaptations.resource_id and is_student_in_class(a.class_id)
    )
  );

-- assignments -----------------------------------------------------------------
create policy "assignments: teacher manages own" on assignments for all
  using (teacher_id = my_profile_id())
  with check (teacher_id = my_profile_id());

create policy "assignments: student views own class assignments" on assignments for select
  using (is_student_in_class(class_id));

create policy "assignments: parent views child's assignments" on assignments for select
  using (
    exists (
      select 1 from class_members cm
      where cm.class_id = assignments.class_id and is_parent_of_student(cm.student_id)
    )
  );

-- submissions -------------------------------------------------------------------
create policy "submissions: student manages own" on submissions for all
  using (student_id = my_profile_id())
  with check (student_id = my_profile_id());

create policy "submissions: teacher views/grades own class" on submissions for select
  using (teaches_assignment(assignment_id));

create policy "submissions: teacher updates own class" on submissions for update
  using (teaches_assignment(assignment_id));

create policy "submissions: parent views child" on submissions for select
  using (is_parent_of_student(student_id));

-- reading_preferences -----------------------------------------------------------
create policy "reading_preferences: self manages" on reading_preferences for all
  using (user_id = my_profile_id())
  with check (user_id = my_profile_id());

-- notes ---------------------------------------------------------------------------
create policy "notes: self manages" on notes for all
  using (user_id = my_profile_id())
  with check (user_id = my_profile_id());

-- progress_events -------------------------------------------------------------
create policy "progress_events: student inserts own" on progress_events for insert
  with check (student_id = my_profile_id());

create policy "progress_events: student views own" on progress_events for select
  using (student_id = my_profile_id());

create policy "progress_events: teacher views students" on progress_events for select
  using (is_student_of_teacher(student_id));

create policy "progress_events: parent views child" on progress_events for select
  using (is_parent_of_student(student_id));

-- messages -----------------------------------------------------------------------
create policy "messages: participants view" on messages for select
  using (sender_id = my_profile_id() or recipient_id = my_profile_id());

create policy "messages: sender sends" on messages for insert
  with check (sender_id = my_profile_id());

create policy "messages: recipient marks read" on messages for update
  using (recipient_id = my_profile_id());

-- notifications -------------------------------------------------------------------
create policy "notifications: self manages" on notifications for all
  using (user_id = my_profile_id())
  with check (user_id = my_profile_id());

-- ============================================================================
-- 0003_storage.sql — storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- resources bucket: only the uploader (path prefixed with their profile id) may read/write
create policy "resources bucket: owner read"
  on storage.objects for select
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = my_profile_id()::text);

create policy "resources bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = my_profile_id()::text);

create policy "resources bucket: owner delete"
  on storage.objects for delete
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = my_profile_id()::text);

-- students assigned a resource can read the original file via a server-side signed URL
-- issued through a server action that checks resources/assignments RLS before calling
-- the storage API with the service role, so no broad public policy is needed here.

-- avatars bucket: public read, owner write
create policy "avatars bucket: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = my_profile_id()::text);

create policy "avatars bucket: owner update"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = my_profile_id()::text);

-- ============================================================================
-- 0004_public_rpcs.sql — minimal-exposure lookup/action functions
-- ============================================================================

-- Safe, minimal-exposure lookups needed before a user has any school membership
-- (e.g. picking a school on the signup form). Only id + name are exposed.

create function schools_directory() returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select id, name from schools order by name;
$$;

grant execute on function schools_directory() to anon, authenticated;

-- Lets a student join a class by the short code their teacher shares, without
-- exposing the whole classes table to unauthenticated/unrelated users.
create function find_class_by_code(p_code text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from classes where join_code = upper(p_code);
$$;

grant execute on function find_class_by_code(text) to authenticated;

-- Lets a parent request a link to their child using the child's student code,
-- without exposing the full student directory.
create function find_student_by_code(p_code text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from profiles where student_code = upper(p_code) and role = 'student';
$$;

grant execute on function find_student_by_code(text) to authenticated;

-- Lets a verified school admin broadcast a notification to every approved
-- member of their own school, without granting broad notification-insert access.
create function create_school_announcement(p_school_id uuid, p_title text, p_body text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_school_admin(p_school_id) then
    raise exception 'Only an approved school admin can send announcements for this school';
  end if;

  insert into notifications (user_id, type, title, body)
  select user_id, 'announcement', p_title, p_body
  from school_members
  where school_id = p_school_id and status = 'approved';
end;
$$;

grant execute on function create_school_announcement(uuid, text, text) to authenticated;
