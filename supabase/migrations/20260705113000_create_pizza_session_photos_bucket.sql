insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pizza-session-photos',
  'pizza-session-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Users can read their own pizza session photos" on storage.objects;
create policy "Users can read their own pizza session photos"
  on storage.objects
  for select
  using (
    bucket_id = 'pizza-session-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can upload their own pizza session photos" on storage.objects;
create policy "Users can upload their own pizza session photos"
  on storage.objects
  for insert
  with check (
    bucket_id = 'pizza-session-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can replace their own pizza session photos" on storage.objects;
create policy "Users can replace their own pizza session photos"
  on storage.objects
  for update
  using (
    bucket_id = 'pizza-session-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'pizza-session-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own pizza session photos" on storage.objects;
create policy "Users can delete their own pizza session photos"
  on storage.objects
  for delete
  using (
    bucket_id = 'pizza-session-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
