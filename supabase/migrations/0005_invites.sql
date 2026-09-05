-- ============================================================================
-- Email invites — lets a school admin invite a teacher, or a teacher invite a
-- student, by email instead of relying only on self-service signup / join
-- codes. Accepting an invite auto-approves the resulting membership: the
-- invite itself is the vouching. Self-service signup (picking a school from
-- a dropdown with no invite) is untouched and still requires manual approval
-- — see provisionProfile() in src/lib/actions/auth.ts.
-- ============================================================================

create type bp_invite_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table bp_invites (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  school_id uuid not null references bp_schools(id) on delete cascade,
  class_id uuid references bp_classes(id) on delete cascade,
  inviter_id uuid not null references bp_profiles(id) on delete cascade,
  email text not null,
  role bp_user_role not null,
  status bp_invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);

create index bp_invites_school_idx on bp_invites(school_id);
create index bp_invites_email_idx on bp_invites(lower(email));

alter table bp_invites enable row level security;

-- Anyone who belongs to the school can see invites sent for it (teachers
-- need to see their own class invites in the list too).
create policy "bp_invites: school members view" on bp_invites for select
  using (school_id in (select bp_my_school_ids()));

-- A school admin can invite a teacher/admin to their own (approved) school;
-- a teacher can invite a student to a class they own. Both require the
-- inviter to already be an approved member — an invite can't be used to
-- bootstrap trust that doesn't exist yet.
create policy "bp_invites: authorized inviters create" on bp_invites for insert
  with check (
    inviter_id = bp_my_profile_id()
    and (
      (role in ('teacher', 'school_admin') and bp_is_school_admin(school_id))
      or (role = 'student' and class_id is not null and bp_is_teacher_of_class(class_id))
    )
  );

create policy "bp_invites: inviter can revoke" on bp_invites for update
  using (inviter_id = bp_my_profile_id());

-- Tighten a pre-existing gap: this policy's `with check` never constrained
-- the `status` column, so a signed-in user could previously self-insert a
-- bp_school_members row with status='approved' directly (bypassing the
-- pending-approval flow entirely) without going through provisionProfile()
-- at all — the app code always set 'pending', but nothing at the RLS layer
-- enforced that. Now it does.
drop policy if exists "bp_school_members: self requests join" on bp_school_members;
create policy "bp_school_members: self requests join" on bp_school_members for insert
  with check (user_id = bp_my_profile_id() and status = 'pending');

-- ---------------------------------------------------------------------------
-- Minimal-exposure lookup: renders the accept-invite page for someone who
-- isn't a school member yet (may not even have an account). Only what's
-- needed to show "you're invited to join X as a Y" — never the inviter's
-- identity or any other invite's data.
-- ---------------------------------------------------------------------------
create function bp_get_invite_by_token(p_token uuid)
returns table (email text, role bp_user_role, school_id uuid, school_name text, class_id uuid, class_name text, status bp_invite_status, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.email, i.role, i.school_id, s.name, i.class_id, c.name, i.status, i.expires_at
  from bp_invites i
  join bp_schools s on s.id = i.school_id
  left join bp_classes c on c.id = i.class_id
  where i.token = p_token;
$$;

grant execute on function bp_get_invite_by_token(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Accepting an invite: must run as the now-authenticated invitee (their
-- session email must match the invite's email exactly). Auto-approves the
-- resulting school/class membership — this function IS the approval, which
-- is why it's only reachable via a valid, unexpired, unused invite token
-- rather than being something a client can trigger arbitrarily.
-- ---------------------------------------------------------------------------
create function bp_accept_invite(p_token uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_invite bp_invites%rowtype;
  v_my_email text;
  v_profile_id uuid;
begin
  select * into v_invite from bp_invites where token = p_token for update;
  if not found then
    raise exception 'Invite not found.';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'This invite has already been used or revoked.';
  end if;
  if v_invite.expires_at < now() then
    update bp_invites set status = 'expired' where id = v_invite.id;
    raise exception 'This invite has expired.';
  end if;

  select email into v_my_email from auth.users where id = auth.uid();
  if v_my_email is null or lower(v_my_email) <> lower(v_invite.email) then
    raise exception 'This invite was sent to a different email address than the one you''re signed in with.';
  end if;

  v_profile_id := bp_my_profile_id();
  if v_profile_id is null then
    raise exception 'Finish creating your account first.';
  end if;

  if v_invite.role = 'student' then
    if v_invite.class_id is not null then
      insert into bp_class_members (class_id, student_id)
        values (v_invite.class_id, v_profile_id)
        on conflict (class_id, student_id) do nothing;
    end if;
  else
    insert into bp_school_members (school_id, user_id, role, status)
      values (v_invite.school_id, v_profile_id, v_invite.role, 'approved')
      on conflict (school_id, user_id) do update set status = 'approved';
  end if;

  update bp_invites set status = 'accepted', accepted_at = now() where id = v_invite.id;
end;
$$;

grant execute on function bp_accept_invite(uuid) to authenticated;
