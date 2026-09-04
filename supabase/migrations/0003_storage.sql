-- Storage buckets for uploaded material and avatars
insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- resources bucket: only the uploader (path prefixed with their profile id) may read/write
create policy "resources bucket: owner read"
  on storage.objects for select
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = my_profile_id()::text);

create policy "resources bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = my_profile_id()::text);

create policy "resources bucket: owner delete"
  on storage.objects for delete
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = my_profile_id()::text);

-- students assigned a resource can read the original file via a server-side signed URL
-- issued through a server action that checks resources/assignments RLS before calling
-- the storage API with the service role, so no broad public policy is needed here.

-- avatars bucket: public read, owner write
create policy "avatars bucket: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars bucket: owner write"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = my_profile_id()::text);

create policy "avatars bucket: owner update"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = my_profile_id()::text);
