-- ============================================================================
-- Brightpath — full Supabase setup (schema + RLS + storage + RPCs)
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Every table/type/function/index/bucket is prefixed bp_ so this can safely
-- coexist with other apps in a shared Supabase project.
-- (Equivalent to running 0001..0004 in supabase/migrations/ in order —
--  kept separately there for anyone using the Supabase CLI / db push.)
-- ============================================================================

-- ============================================================================
-- 0001_schema.sql — core schema
-- ============================================================================
-- ============================================================================
-- Brightpath / dyslexia learning support platform — core schema
-- Every table, type, function, and index is prefixed with `bp_` so this app
-- can safely coexist in a shared Supabase project alongside other apps.
-- ============================================================================

create extension if not exists "pgcrypto";

create type bp_user_role as enum ('student', 'parent', 'teacher', 'school_admin');
create type bp_membership_status as enum ('pending', 'approved', 'rejected');
create type bp_resource_status as enum ('uploading', 'processing', 'ready', 'failed');
create type bp_adaptation_type as enum ('accessible', 'explain', 'vocabulary', 'breakdown', 'audio', 'practice', 'revision');
create type bp_submission_status as enum ('not_started', 'in_progress', 'submitted', 'reviewed');
create type bp_highlight_mode as enum ('none', 'paragraph', 'sentence', 'word');

-- ---------------------------------------------------------------------------
-- bp_profiles: one row per authenticated user, mirrors auth.users
-- ---------------------------------------------------------------------------
create table bp_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role bp_user_role not null,
  first_name text not null,
  last_name text not null,
  avatar_url text,
  student_code text unique,
  created_at timestamptz not null default now()
);

create index bp_profiles_auth_user_id_idx on bp_profiles(auth_user_id);

-- security-definer helpers avoid RLS recursion ------------------------------
create function bp_my_profile_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from bp_profiles where auth_user_id = auth.uid();
$$;

create function bp_my_role() returns bp_user_role
language sql stable security definer set search_path = public as $$
  select role from bp_profiles where auth_user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- bp_schools
-- ---------------------------------------------------------------------------
create table bp_schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table bp_school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references bp_schools(id) on delete cascade,
  user_id uuid not null references bp_profiles(id) on delete cascade,
  role bp_user_role not null,
  status bp_membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create function bp_is_school_admin(p_school_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bp_school_members
    where school_id = p_school_id and user_id = bp_my_profile_id()
      and role = 'school_admin' and status = 'approved'
  );
$$;

create function bp_my_school_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select school_id from bp_school_members where user_id = bp_my_profile_id() and status = 'approved';
$$;

-- ---------------------------------------------------------------------------
-- bp_classes / bp_class_members
-- ---------------------------------------------------------------------------
create table bp_classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references bp_schools(id) on delete cascade,
  teacher_id uuid not null references bp_profiles(id) on delete cascade,
  name text not null,
  grade text,
  subject text,
  join_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table bp_class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references bp_classes(id) on delete cascade,
  student_id uuid not null references bp_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create function bp_is_teacher_of_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bp_classes where id = p_class_id and teacher_id = bp_my_profile_id());
$$;

create function bp_is_student_in_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bp_class_members where class_id = p_class_id and student_id = bp_my_profile_id()
  );
$$;

create function bp_is_student_of_teacher(p_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bp_class_members cm
    join bp_classes c on c.id = cm.class_id
    where cm.student_id = p_student_id and c.teacher_id = bp_my_profile_id()
  );
$$;

-- ---------------------------------------------------------------------------
-- bp_parent_student_links
-- ---------------------------------------------------------------------------
create table bp_parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references bp_profiles(id) on delete cascade,
  student_id uuid not null references bp_profiles(id) on delete cascade,
  relationship text,
  status bp_membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

create function bp_is_parent_of_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bp_parent_student_links
    where student_id = p_student_id and parent_id = bp_my_profile_id() and status = 'approved'
  );
$$;

-- ---------------------------------------------------------------------------
-- bp_resources / bp_resource_adaptations
-- ---------------------------------------------------------------------------
create table bp_resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references bp_profiles(id) on delete cascade,
  school_id uuid references bp_schools(id) on delete set null,
  title text not null,
  subject text,
  grade text,
  original_file_url text,
  original_file_type text,
  extracted_text text,
  extracted_structure jsonb,
  status bp_resource_status not null default 'uploading',
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);

create table bp_resource_adaptations (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references bp_resources(id) on delete cascade,
  type bp_adaptation_type not null,
  content jsonb not null,
  created_by uuid not null references bp_profiles(id) on delete cascade,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create function bp_owns_resource(p_resource_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bp_resources where id = p_resource_id and owner_id = bp_my_profile_id());
$$;

-- ---------------------------------------------------------------------------
-- bp_assignments / bp_submissions
-- ---------------------------------------------------------------------------
create table bp_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references bp_profiles(id) on delete cascade,
  class_id uuid not null references bp_classes(id) on delete cascade,
  resource_id uuid references bp_resources(id) on delete set null,
  title text not null,
  description text,
  instructions text,
  subject text,
  accessibility_support jsonb,
  due_date timestamptz,
  created_at timestamptz not null default now()
);

create table bp_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references bp_assignments(id) on delete cascade,
  student_id uuid not null references bp_profiles(id) on delete cascade,
  content jsonb,
  status bp_submission_status not null default 'not_started',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create function bp_is_own_assignment_class(p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bp_assignments a
    where a.id = p_assignment_id and bp_is_student_in_class(a.class_id)
  );
$$;

create function bp_teaches_assignment(p_assignment_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bp_assignments where id = p_assignment_id and teacher_id = bp_my_profile_id());
$$;

-- ---------------------------------------------------------------------------
-- bp_reading_preferences / bp_notes / bp_progress_events
-- ---------------------------------------------------------------------------
create table bp_reading_preferences (
  user_id uuid primary key references bp_profiles(id) on delete cascade,
  font_size int not null default 18,
  line_spacing numeric not null default 1.6,
  letter_spacing numeric not null default 0.02,
  word_spacing numeric not null default 0.05,
  content_width text not null default 'comfortable',
  alignment text not null default 'left',
  background text not null default 'cream',
  reading_speed numeric not null default 1.0,
  highlight_mode bp_highlight_mode not null default 'sentence',
  dyslexia_font boolean not null default true,
  updated_at timestamptz not null default now()
);

create table bp_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references bp_profiles(id) on delete cascade,
  resource_id uuid not null references bp_resources(id) on delete cascade,
  content text not null,
  position jsonb,
  created_at timestamptz not null default now()
);

create table bp_progress_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references bp_profiles(id) on delete cascade,
  resource_id uuid references bp_resources(id) on delete set null,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- bp_messages / bp_notifications
-- ---------------------------------------------------------------------------
create table bp_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references bp_profiles(id) on delete cascade,
  recipient_id uuid not null references bp_profiles(id) on delete cascade,
  content text not null,
  attachment_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table bp_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references bp_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- indexes
-- ---------------------------------------------------------------------------
create index bp_classes_school_idx on bp_classes(school_id);
create index bp_classes_teacher_idx on bp_classes(teacher_id);
create index bp_class_members_student_idx on bp_class_members(student_id);
create index bp_resources_owner_idx on bp_resources(owner_id);
create index bp_resource_adaptations_resource_idx on bp_resource_adaptations(resource_id);
create index bp_assignments_class_idx on bp_assignments(class_id);
create index bp_submissions_student_idx on bp_submissions(student_id);
create index bp_notes_resource_idx on bp_notes(resource_id);
create index bp_progress_events_student_idx on bp_progress_events(student_id);
create index bp_messages_recipient_idx on bp_messages(recipient_id, read_at);
create index bp_notifications_user_idx on bp_notifications(user_id, read);

-- ============================================================================
-- 0002_rls.sql — Row Level Security policies
-- ============================================================================
-- ============================================================================
-- Row Level Security policies
-- ============================================================================

alter table bp_profiles enable row level security;
alter table bp_schools enable row level security;
alter table bp_school_members enable row level security;
alter table bp_classes enable row level security;
alter table bp_class_members enable row level security;
alter table bp_parent_student_links enable row level security;
alter table bp_resources enable row level security;
alter table bp_resource_adaptations enable row level security;
alter table bp_assignments enable row level security;
alter table bp_submissions enable row level security;
alter table bp_reading_preferences enable row level security;
alter table bp_notes enable row level security;
alter table bp_progress_events enable row level security;
alter table bp_messages enable row level security;
alter table bp_notifications enable row level security;

-- bp_profiles -------------------------------------------------------------------
create policy "bp_profiles: self select" on bp_profiles for select
  using (auth_user_id = auth.uid());

create policy "bp_profiles: self insert" on bp_profiles for insert
  with check (auth_user_id = auth.uid());

create policy "bp_profiles: self update" on bp_profiles for update
  using (auth_user_id = auth.uid());

-- a teacher can see basic profile info of their own students
create policy "bp_profiles: teacher sees students" on bp_profiles for select
  using (bp_is_student_of_teacher(id));

-- a parent can see linked children's profile
create policy "bp_profiles: parent sees linked child" on bp_profiles for select
  using (bp_is_parent_of_student(id));

-- classmates / school staff visibility handled via views in app layer, kept minimal here
create policy "bp_profiles: school admin sees school members" on bp_profiles for select
  using (
    exists (
      select 1 from bp_school_members sm
      where sm.user_id = bp_profiles.id
        and sm.school_id in (select bp_my_school_ids())
        and bp_is_school_admin(sm.school_id)
    )
  );

-- bp_schools ----------------------------------------------------------------------
create policy "bp_schools: members can view" on bp_schools for select
  using (id in (select bp_my_school_ids()));

create policy "bp_schools: admin can update" on bp_schools for update
  using (bp_is_school_admin(id));

-- bp_school_members -----------------------------------------------------------
create policy "bp_school_members: self select" on bp_school_members for select
  using (user_id = bp_my_profile_id() or bp_is_school_admin(school_id));

create policy "bp_school_members: admin manages" on bp_school_members for insert
  with check (bp_is_school_admin(school_id));

create policy "bp_school_members: admin updates" on bp_school_members for update
  using (bp_is_school_admin(school_id));

create policy "bp_school_members: self requests join" on bp_school_members for insert
  with check (user_id = bp_my_profile_id());

-- bp_classes ------------------------------------------------------------------
create policy "bp_classes: teacher manages own" on bp_classes for all
  using (teacher_id = bp_my_profile_id())
  with check (teacher_id = bp_my_profile_id());

create policy "bp_classes: student views own class" on bp_classes for select
  using (bp_is_student_in_class(id));

create policy "bp_classes: school admin views" on bp_classes for select
  using (bp_is_school_admin(school_id));

-- bp_class_members --------------------------------------------------------------
create policy "bp_class_members: teacher manages" on bp_class_members for all
  using (bp_is_teacher_of_class(class_id))
  with check (bp_is_teacher_of_class(class_id));

create policy "bp_class_members: student views own membership" on bp_class_members for select
  using (student_id = bp_my_profile_id());

create policy "bp_class_members: student self-enrolls" on bp_class_members for insert
  with check (student_id = bp_my_profile_id());

create policy "bp_class_members: parent views child membership" on bp_class_members for select
  using (bp_is_parent_of_student(student_id));

-- bp_parent_student_links -------------------------------------------------------
create policy "bp_psl: parent views own links" on bp_parent_student_links for select
  using (parent_id = bp_my_profile_id());

create policy "bp_psl: student views own links" on bp_parent_student_links for select
  using (student_id = bp_my_profile_id());

create policy "bp_psl: parent creates request" on bp_parent_student_links for insert
  with check (parent_id = bp_my_profile_id());

create policy "bp_psl: teacher/school approves" on bp_parent_student_links for update
  using (bp_is_student_of_teacher(student_id) or bp_my_role() = 'school_admin');

-- bp_resources --------------------------------------------------------------------
create policy "bp_resources: owner manages" on bp_resources for all
  using (owner_id = bp_my_profile_id())
  with check (owner_id = bp_my_profile_id());

create policy "bp_resources: student views assigned" on bp_resources for select
  using (
    exists (
      select 1 from bp_assignments a
      where a.resource_id = bp_resources.id and bp_is_student_in_class(a.class_id)
    )
  );

create policy "bp_resources: school admin views school resources" on bp_resources for select
  using (school_id in (select bp_my_school_ids()) and bp_is_school_admin(school_id));

create policy "bp_resources: parent views child's assigned resources" on bp_resources for select
  using (
    exists (
      select 1 from bp_assignments a
      join bp_class_members cm on cm.class_id = a.class_id
      where a.resource_id = bp_resources.id and bp_is_parent_of_student(cm.student_id)
    )
  );

-- bp_resource_adaptations -----------------------------------------------------
create policy "bp_adaptations: resource owner manages" on bp_resource_adaptations for all
  using (bp_owns_resource(resource_id))
  with check (bp_owns_resource(resource_id));

create policy "bp_adaptations: student views approved on assigned resource" on bp_resource_adaptations for select
  using (
    approved = true
    and exists (
      select 1 from bp_assignments a
      where a.resource_id = bp_resource_adaptations.resource_id and bp_is_student_in_class(a.class_id)
    )
  );

-- bp_assignments -----------------------------------------------------------------
create policy "bp_assignments: teacher manages own" on bp_assignments for all
  using (teacher_id = bp_my_profile_id())
  with check (teacher_id = bp_my_profile_id());

create policy "bp_assignments: student views own class assignments" on bp_assignments for select
  using (bp_is_student_in_class(class_id));

create policy "bp_assignments: parent views child's assignments" on bp_assignments for select
  using (
    exists (
      select 1 from bp_class_members cm
      where cm.class_id = bp_assignments.class_id and bp_is_parent_of_student(cm.student_id)
    )
  );

-- bp_submissions -------------------------------------------------------------------
create policy "bp_submissions: student manages own" on bp_submissions for all
  using (student_id = bp_my_profile_id())
  with check (student_id = bp_my_profile_id());

create policy "bp_submissions: teacher views/grades own class" on bp_submissions for select
  using (bp_teaches_assignment(assignment_id));

create policy "bp_submissions: teacher updates own class" on bp_submissions for update
  using (bp_teaches_assignment(assignment_id));

create policy "bp_submissions: parent views child" on bp_submissions for select
  using (bp_is_parent_of_student(student_id));

-- bp_reading_preferences -----------------------------------------------------------
create policy "bp_reading_preferences: self manages" on bp_reading_preferences for all
  using (user_id = bp_my_profile_id())
  with check (user_id = bp_my_profile_id());

-- bp_notes ---------------------------------------------------------------------------
create policy "bp_notes: self manages" on bp_notes for all
  using (user_id = bp_my_profile_id())
  with check (user_id = bp_my_profile_id());

-- bp_progress_events -------------------------------------------------------------
create policy "bp_progress_events: student inserts own" on bp_progress_events for insert
  with check (student_id = bp_my_profile_id());

create policy "bp_progress_events: student views own" on bp_progress_events for select
  using (student_id = bp_my_profile_id());

create policy "bp_progress_events: teacher views students" on bp_progress_events for select
  using (bp_is_student_of_teacher(student_id));

create policy "bp_progress_events: parent views child" on bp_progress_events for select
  using (bp_is_parent_of_student(student_id));

-- bp_messages -----------------------------------------------------------------------
create policy "bp_messages: participants view" on bp_messages for select
  using (sender_id = bp_my_profile_id() or recipient_id = bp_my_profile_id());

create policy "bp_messages: sender sends" on bp_messages for insert
  with check (sender_id = bp_my_profile_id());

create policy "bp_messages: recipient marks read" on bp_messages for update
  using (recipient_id = bp_my_profile_id());

-- bp_notifications -------------------------------------------------------------------
create policy "bp_notifications: self manages" on bp_notifications for all
  using (user_id = bp_my_profile_id())
  with check (user_id = bp_my_profile_id());

-- ============================================================================
-- 0003_storage.sql — storage buckets
-- ============================================================================
-- Storage buckets for uploaded material and avatars.
-- Bucket ids are prefixed with bp_ since storage.buckets.id is a global
-- registry shared by every app in this Supabase project.
insert into storage.buckets (id, name, public)
values ('bp_resources', 'bp_resources', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('bp_avatars', 'bp_avatars', true)
on conflict (id) do nothing;

-- bp_resources bucket: only the uploader (path prefixed with their profile id) may read/write
create policy "bp_resources bucket: owner read"
  on storage.objects for select
  using (bucket_id = 'bp_resources' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

create policy "bp_resources bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'bp_resources' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

create policy "bp_resources bucket: owner delete"
  on storage.objects for delete
  using (bucket_id = 'bp_resources' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

-- students assigned a resource can read the original file via a server-side signed URL
-- issued through a server action that checks resources/assignments RLS before calling
-- the storage API with the service role, so no broad public policy is needed here.

-- bp_avatars bucket: public read, owner write
create policy "bp_avatars bucket: public read"
  on storage.objects for select
  using (bucket_id = 'bp_avatars');

create policy "bp_avatars bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'bp_avatars' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

create policy "bp_avatars bucket: owner update"
  on storage.objects for update
  using (bucket_id = 'bp_avatars' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

-- ============================================================================
-- 0004_public_rpcs.sql — minimal-exposure lookup/action functions
-- ============================================================================
-- Safe, minimal-exposure lookups needed before a user has any school membership
-- (e.g. picking a school on the signup form). Only id + name are exposed.

create function bp_schools_directory() returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select id, name from bp_schools order by name;
$$;

grant execute on function bp_schools_directory() to anon, authenticated;

-- Lets a student join a class by the short code their teacher shares, without
-- exposing the whole classes table to unauthenticated/unrelated users.
create function bp_find_class_by_code(p_code text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from bp_classes where join_code = upper(p_code);
$$;

grant execute on function bp_find_class_by_code(text) to authenticated;

-- Lets a parent request a link to their child using the child's student code,
-- without exposing the full student directory.
create function bp_find_student_by_code(p_code text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from bp_profiles where student_code = upper(p_code) and role = 'student';
$$;

grant execute on function bp_find_student_by_code(text) to authenticated;

-- Lets a verified school admin broadcast a notification to every approved
-- member of their own school, without granting broad notification-insert access.
create function bp_create_school_announcement(p_school_id uuid, p_title text, p_body text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not bp_is_school_admin(p_school_id) then
    raise exception 'Only an approved school admin can send announcements for this school';
  end if;

  insert into bp_notifications (user_id, type, title, body)
  select user_id, 'announcement', p_title, p_body
  from bp_school_members
  where school_id = p_school_id and status = 'approved';
end;
$$;

grant execute on function bp_create_school_announcement(uuid, text, text) to authenticated;
