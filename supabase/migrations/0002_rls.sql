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

-- Any authenticated user can propose a brand-new school (equivalent to starting a
-- new workspace); joining an *existing* school as staff still requires approval
-- via bp_school_members.status, enforced in application code (see auth actions).
create policy "bp_schools: authenticated users can create" on bp_schools for insert
  to authenticated
  with check (true);

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
