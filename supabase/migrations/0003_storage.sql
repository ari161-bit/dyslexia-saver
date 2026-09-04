-- Storage buckets for uploaded material and avatars.
-- Bucket ids are prefixed with bp_ since storage.buckets.id is a global
-- registry shared by every app in this Supabase project.
insert into storage.buckets (id, name, public)
values ('bp_resources', 'bp_resources', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('bp_avatars', 'bp_avatars', true)
on conflict (id) do nothing;

-- bp_resources bucket: only the uploader (path prefixed with their profile id) may read/write
create policy "bp_resources bucket: owner read"
  on storage.objects for select
  using (bucket_id = 'bp_resources' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

create policy "bp_resources bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'bp_resources' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

create policy "bp_resources bucket: owner delete"
  on storage.objects for delete
  using (bucket_id = 'bp_resources' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

-- students assigned a resource can read the original file via a server-side signed URL
-- issued through a server action that checks resources/assignments RLS before calling
-- the storage API with the service role, so no broad public policy is needed here.

-- bp_avatars bucket: public read, owner write
create policy "bp_avatars bucket: public read"
  on storage.objects for select
  using (bucket_id = 'bp_avatars');

create policy "bp_avatars bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'bp_avatars' and (storage.foldername(name))[1] = bp_my_profile_id()::text);

create policy "bp_avatars bucket: owner update"
  on storage.objects for update
  using (bucket_id = 'bp_avatars' and (storage.foldername(name))[1] = bp_my_profile_id()::text);
