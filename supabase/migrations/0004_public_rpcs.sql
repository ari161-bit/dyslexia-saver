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
