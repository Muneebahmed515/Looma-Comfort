-- Looma Comfort: Row Level Security
-- Visitors (anon) can only read published content. Every write requires an admin
-- (a row in admin_users). Public form submissions are inserted by the server with the
-- secret key after spam checks, so visitors have no direct write access at all.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'owner');
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_owner() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;

-- Enable RLS everywhere.
do $$
declare t text;
begin
  foreach t in array array[
    'admin_users', 'site_settings', 'categories', 'materials', 'collections', 'products', 'product_stats',
    'offers', 'announcements', 'hero_slides', 'promo_banners', 'home_sections', 'reviews', 'pages', 'faqs',
    'contact_messages', 'newsletter_subscribers', 'whatsapp_clicks', 'slug_redirects', 'activity_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ------------------------------------------------------------------ public content
-- Readable by everyone when published; admins read and manage everything.
drop policy if exists "read visible categories" on public.categories;
create policy "read visible categories" on public.categories for select to anon, authenticated using (is_visible or public.is_admin());
drop policy if exists "read visible collections" on public.collections;
create policy "read visible collections" on public.collections for select to anon, authenticated using (is_visible or public.is_admin());
drop policy if exists "read visible products" on public.products;
create policy "read visible products" on public.products for select to anon, authenticated using (is_visible or public.is_admin());
drop policy if exists "read visible sections" on public.home_sections;
create policy "read visible sections" on public.home_sections for select to anon, authenticated using (is_visible or public.is_admin());
drop policy if exists "read visible faqs" on public.faqs;
create policy "read visible faqs" on public.faqs for select to anon, authenticated using (is_visible or public.is_admin());
drop policy if exists "read active offers" on public.offers;
create policy "read active offers" on public.offers for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "read active announcements" on public.announcements;
create policy "read active announcements" on public.announcements for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "read active slides" on public.hero_slides;
create policy "read active slides" on public.hero_slides for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "read active promos" on public.promo_banners;
create policy "read active promos" on public.promo_banners for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "read approved reviews" on public.reviews;
create policy "read approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved' or public.is_admin());
drop policy if exists "read materials" on public.materials;
create policy "read materials" on public.materials for select to anon, authenticated using (true);
drop policy if exists "read pages" on public.pages;
create policy "read pages" on public.pages for select to anon, authenticated using (true);
drop policy if exists "read settings" on public.site_settings;
create policy "read settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "read product stats" on public.product_stats;
create policy "read product stats" on public.product_stats for select to anon, authenticated using (true);

-- Admin writes.
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'materials', 'collections', 'products', 'offers', 'announcements', 'hero_slides',
    'promo_banners', 'home_sections', 'reviews', 'pages', 'faqs'
  ] loop
    execute format('drop policy if exists "admins insert" on public.%I', t);
    execute format('drop policy if exists "admins update" on public.%I', t);
    execute format('drop policy if exists "admins delete" on public.%I', t);
    execute format('create policy "admins insert" on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Settings: only the owner can change them (WhatsApp number, analytics IDs, etc.).
drop policy if exists "owner updates settings" on public.site_settings;
create policy "owner updates settings" on public.site_settings for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- ------------------------------------------------------------------ private data (admins only)
do $$
declare t text;
begin
  foreach t in array array['contact_messages', 'newsletter_subscribers', 'whatsapp_clicks', 'activity_log', 'slug_redirects'] loop
    execute format('drop policy if exists "admins read" on public.%I', t);
    execute format('create policy "admins read" on public.%I for select to authenticated using (public.is_admin())', t);
  end loop;
  foreach t in array array['contact_messages', 'newsletter_subscribers'] loop
    execute format('drop policy if exists "admins update" on public.%I', t);
    execute format('drop policy if exists "admins delete" on public.%I', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- ------------------------------------------------------------------ admin users
drop policy if exists "admins read team" on public.admin_users;
create policy "admins read team" on public.admin_users for select to authenticated using (public.is_admin());
drop policy if exists "owner adds team" on public.admin_users;
create policy "owner adds team" on public.admin_users for insert to authenticated with check (public.is_owner());
drop policy if exists "owner updates team" on public.admin_users;
create policy "owner updates team" on public.admin_users for update to authenticated using (public.is_owner()) with check (public.is_owner());
drop policy if exists "owner removes team" on public.admin_users;
create policy "owner removes team" on public.admin_users for delete to authenticated using (public.is_owner() and user_id <> auth.uid());

-- ------------------------------------------------------------------ RPC: slug redirects
-- Returns the current slug for an old slug, only if the target is published.
create or replace function public.resolve_slug_redirect(p_entity text, p_old_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case r.entity_type
    when 'product' then (select p.slug from public.products p where p.id = r.entity_id and p.is_visible)
    when 'category' then (select c.slug from public.categories c where c.id = r.entity_id and c.is_visible)
    when 'collection' then (select c.slug from public.collections c where c.id = r.entity_id and c.is_visible)
  end
  from public.slug_redirects r
  where r.entity_type = p_entity and r.old_slug = p_old_slug
  limit 1;
$$;
revoke all on function public.resolve_slug_redirect(text, text) from public;
grant execute on function public.resolve_slug_redirect(text, text) to anon, authenticated;

-- Trigger-only functions must not be callable through the API.
revoke all on function public.log_activity() from public, anon, authenticated;
revoke all on function public.record_slug_change() from public, anon, authenticated;
revoke all on function public.count_whatsapp_click() from public, anon, authenticated;

-- ------------------------------------------------------------------ explicit API grants
-- Newer Supabase projects can be set to not expose new tables automatically. These grants make
-- the tables reachable through the API; Row Level Security above still decides what each role
-- can actually see or change.
grant usage on schema public to anon, authenticated, service_role;
grant select on
  public.site_settings, public.categories, public.materials, public.collections, public.products,
  public.product_stats, public.offers, public.announcements, public.hero_slides, public.promo_banners,
  public.home_sections, public.reviews, public.pages, public.faqs
to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
