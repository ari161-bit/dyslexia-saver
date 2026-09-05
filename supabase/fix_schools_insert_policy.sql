-- One-off fix: bp_schools had RLS enabled with no INSERT policy, so creating a
-- brand-new school during school-admin signup was silently rejected. Run this
-- once in the SQL Editor.

create policy "bp_schools: authenticated users can create" on bp_schools for insert
  to authenticated
  with check (true);
