-- ============================================================================
-- Row Level Security policies
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
