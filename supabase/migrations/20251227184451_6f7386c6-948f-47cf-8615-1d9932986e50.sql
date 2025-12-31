-- Create public bucket for food images
insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do nothing;

-- Allow public read access to food images
create policy "Public access to food images"
  on storage.objects
  for select
  using (bucket_id = 'food-images');

-- Allow authenticated users to upload images into their own folder
create policy "Users can upload their own food images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'food-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update images in their own folder
create policy "Users can update their own food images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'food-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );