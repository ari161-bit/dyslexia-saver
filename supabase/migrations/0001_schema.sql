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
