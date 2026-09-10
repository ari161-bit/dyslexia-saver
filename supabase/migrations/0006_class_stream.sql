-- ============================================================================
-- Class stream — a shared, per-class feed the teacher (or their school's
-- admin) posts to, with every student in the class able to reply. This is
-- deliberately NOT private 1:1 teacher-student messaging (bp_messages stays
-- teacher<->parent only) — a stream everyone in the class can see is both
-- closer to how Google Classroom actually works and avoids the child-safety
-- questions private teacher-student DMs would raise. Posts can carry a link
-- and/or an image URL; there's no new storage bucket here, images are
-- pasted URLs rather than uploads, to avoid needing another storage policy
-- migration on top of this one.
-- ============================================================================

create table bp_class_posts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references bp_classes(id) on delete cascade,
  author_id uuid not null references bp_profiles(id) on delete cascade,
  body text not null,
  link_url text,
  image_url text,
  created_at timestamptz not null default now()
);

create table bp_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references bp_class_posts(id) on delete cascade,
  author_id uuid not null references bp_profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index bp_class_posts_class_idx on bp_class_posts(class_id, created_at desc);
create index bp_post_comments_post_idx on bp_post_comments(post_id, created_at asc);

alter table bp_class_posts enable row level security;
alter table bp_post_comments enable row level security;

-- A school admin doesn't automatically teach every class, so give them the
-- same "does this class belong to my school" check the rest of the app
-- uses for admin-level access, rather than inlining the join everywhere.
create function bp_is_school_admin_of_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bp_classes c
    where c.id = p_class_id and bp_is_school_admin(c.school_id)
  );
$$;

create policy "bp_class_posts: class members view" on bp_class_posts for select
  using (bp_is_teacher_of_class(class_id) or bp_is_student_in_class(class_id) or bp_is_school_admin_of_class(class_id));

-- Only the teacher or the school admin starts a new stream post — students
-- participate by commenting, same as Google Classroom's stream vs. comments
-- split.
create policy "bp_class_posts: teacher or admin posts" on bp_class_posts for insert
  with check (
    author_id = bp_my_profile_id()
    and (bp_is_teacher_of_class(class_id) or bp_is_school_admin_of_class(class_id))
  );

create policy "bp_class_posts: author deletes own" on bp_class_posts for delete
  using (author_id = bp_my_profile_id());

create policy "bp_post_comments: class members view" on bp_post_comments for select
  using (
    exists (
      select 1 from bp_class_posts p
      where p.id = post_id
        and (bp_is_teacher_of_class(p.class_id) or bp_is_student_in_class(p.class_id) or bp_is_school_admin_of_class(p.class_id))
    )
  );

-- Anyone who can see the post can reply to it — teacher, every student in
-- the class, and the school admin.
create policy "bp_post_comments: class members reply" on bp_post_comments for insert
  with check (
    author_id = bp_my_profile_id()
    and exists (
      select 1 from bp_class_posts p
      where p.id = post_id
        and (bp_is_teacher_of_class(p.class_id) or bp_is_student_in_class(p.class_id) or bp_is_school_admin_of_class(p.class_id))
    )
  );

create policy "bp_post_comments: author deletes own" on bp_post_comments for delete
  using (author_id = bp_my_profile_id());
