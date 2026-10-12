-- Looma Comfort: Storage
-- Public-read buckets for site images. Images are compressed in the browser into
-- three WebP widths (<id>-480.webp, <id>-960.webp, <id>-1600.webp) before upload.
-- Only admins can upload, replace or delete. SVG is not allowed (XSS risk).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 3145728, array['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('categories', 'categories', true, 3145728, array['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('banners', 'banners', true, 3145728, array['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('content', 'content', true, 3145728, array['image/webp', 'image/jpeg', 'image/png', 'image/avif']),
  ('brand', 'brand', true, 3145728, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "looma admins read media" on storage.objects;
create policy "looma admins read media" on storage.objects for select to authenticated
  using (bucket_id in ('products', 'categories', 'banners', 'content', 'brand') and public.is_admin());

drop policy if exists "looma admins upload media" on storage.objects;
create policy "looma admins upload media" on storage.objects for insert to authenticated
  with check (bucket_id in ('products', 'categories', 'banners', 'content', 'brand') and public.is_admin());

drop policy if exists "looma admins update media" on storage.objects;
create policy "looma admins update media" on storage.objects for update to authenticated
  using (bucket_id in ('products', 'categories', 'banners', 'content', 'brand') and public.is_admin())
  with check (bucket_id in ('products', 'categories', 'banners', 'content', 'brand') and public.is_admin());

drop policy if exists "looma admins delete media" on storage.objects;
create policy "looma admins delete media" on storage.objects for delete to authenticated
  using (bucket_id in ('products', 'categories', 'banners', 'content', 'brand') and public.is_admin());

-- Storage usage for the dashboard meter (admins only).
create or replace function public.storage_usage_bytes()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_admin()
    then coalesce(sum((o.metadata ->> 'size')::bigint), 0)
    else 0 end
  from storage.objects o
  where o.bucket_id in ('products', 'categories', 'banners', 'content', 'brand');
$$;
revoke all on function public.storage_usage_bytes() from public, anon;
grant execute on function public.storage_usage_bytes() to authenticated;
