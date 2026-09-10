-- Students created directly by a school admin (email + password set by the
-- admin, no class picked yet) have no bp_class_members row and therefore no
-- other link back to a school — bp_profiles otherwise only connects a
-- student to a school indirectly, through class membership. This column
-- lets a school admin's own newly-created, not-yet-assigned students still
-- show up as "belonging to my school" before they're placed in any class.
alter table bp_profiles add column school_id uuid references bp_schools(id) on delete set null;
