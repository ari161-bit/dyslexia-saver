-- Every new signup has been failing with "Database error saving new user" /
-- "Database error creating new user" — confirmed by testing both
-- supabase.auth.signUp() and supabase.auth.admin.createUser() directly with
-- a brand-new random email, so it isn't specific to one account or path.
-- That only happens if something fires on every insert into auth.users and
-- throws.
--
-- Brightpath never needed a trigger there: profile provisioning (bp_profiles,
-- bp_school_members, bp_class_members, etc.) is handled entirely in
-- application code, after the auth user is created — see provisionProfile()
-- in src/lib/actions/auth.ts, acceptInviteSignUpAction() in
-- src/lib/actions/invites.ts, and createStudentAccountAction() in
-- src/lib/actions/students.ts. None of these tracked migrations (0001-0007)
-- ever created a trigger on auth.users, so whatever is attached there was
-- added directly against the live database, outside version control —
-- most likely a leftover from an old Supabase starter template's default
-- "create a profile row" trigger, now erroring against a schema it doesn't
-- match.
--
-- Run this whole block in the Supabase SQL Editor. The SELECT first shows
-- you exactly what's attached (read-only, so you have a record of it)
-- before the DO block removes every non-internal trigger on auth.users.
-- This only touches auth.users — no other table is affected.

select tgname as trigger_name, pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

do $$
declare
  trig record;
begin
  for trig in
    select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users', trig.tgname);
  end loop;
end $$;
