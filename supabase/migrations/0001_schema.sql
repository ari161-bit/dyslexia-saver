-- ============================================================================
-- Brightpath / dyslexia learning support platform — core schema
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
