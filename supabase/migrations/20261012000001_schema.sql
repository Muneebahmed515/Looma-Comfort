-- Looma Comfort: core schema
-- Prices are whole PKR integers. Image fields are jsonb "image assets":
--   { "ref": "products/<id>/<image>.webp", "alt": "...", "w": 1600, "h": 1067, "blur": "data:..." }

create extension if not exists citext with schema extensions;

do $$ begin
  create type public.stock_status as enum ('in_stock', 'out_of_stock', 'made_to_order');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.discount_type as enum ('percent', 'fixed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.offer_scope as enum ('all', 'categories', 'collections', 'products');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'hidden');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.message_status as enum ('new', 'read', 'replied', 'archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.admin_role as enum ('owner', 'editor');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------ admins
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.admin_role not null default 'editor',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ settings (single row)
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  brand_name text not null default 'Looma Comfort',
  tagline text,
  whatsapp_number text,
  whatsapp_order_template text not null default '',
  whatsapp_general_message text not null default '',
  whatsapp_custom_message text not null default '',
  whatsapp_reply_note text,
  phone text,
  email text,
  address text,
  city text,
  map_embed_url text,
  map_link_url text,
  business_hours text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  logo jsonb,
  default_seo_title text,
  default_seo_description text,
  og_image jsonb,
  ga4_id text check (ga4_id is null or ga4_id ~ '^G-[A-Z0-9]{4,16}$'),
  meta_pixel_id text check (meta_pixel_id is null or meta_pixel_id ~ '^[0-9]{6,20}$'),
  gsc_verification text,
  default_delivery_html text,
  default_care_html text,
  search_synonyms jsonb not null default '{}'::jsonb,
  popular_searches text[] not null default '{}',
  intro_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ------------------------------------------------------------------ catalogue
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image jsonb,
  banner jsonb,
  sort_order integer not null default 0,
  show_in_menu boolean not null default true,
  is_visible boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text unique,
  category_id uuid references public.categories (id) on delete set null,
  short_description text,
  description_html text,
  price integer not null check (price >= 0),
  sale_price integer check (sale_price is null or sale_price >= 0),
  price_on_request boolean not null default false,
  stock_status public.stock_status not null default 'in_stock',
  lead_time text,
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  specifications jsonb not null default '[]'::jsonb check (jsonb_typeof(specifications) = 'array'),
  care_html text,
  delivery_html text,
  material_ids uuid[] not null default '{}',
  collection_ids uuid[] not null default '{}',
  related_ids uuid[] not null default '{}',
  tags text[] not null default '{}',
  is_best_seller boolean not null default false,
  is_new_arrival boolean not null default false,
  is_featured boolean not null default false,
  is_visible boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_visible_idx on public.products (is_visible, sort_order);
create index if not exists products_collections_idx on public.products using gin (collection_ids);

-- WhatsApp order clicks per product (kept apart so counting never touches the product row).
create table if not exists public.product_stats (
  product_id uuid primary key references public.products (id) on delete cascade,
  order_clicks integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  badge text check (badge is null or char_length(badge) <= 30),
  discount_type public.discount_type not null default 'percent',
  discount_value integer not null check (discount_value > 0),
  scope public.offer_scope not null default 'all',
  category_ids uuid[] not null default '{}',
  collection_ids uuid[] not null default '{}',
  product_ids uuid[] not null default '{}',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 95),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- ------------------------------------------------------------------ marketing
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 160),
  link_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  heading text not null check (char_length(heading) between 1 and 140),
  subheading text,
  button_label text,
  button_url text,
  desktop_image jsonb,
  mobile_image jsonb,
  text_align text not null default 'left' check (text_align in ('left', 'center', 'right')),
  text_tone text not null default 'light' check (text_tone in ('light', 'dark')),
  overlay smallint not null default 35 check (overlay between 0 and 80),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null default 'home' check (placement in ('home', 'shop', 'sale')),
  layout text not null default 'split' check (layout in ('full', 'split')),
  eyebrow text,
  heading text not null check (char_length(heading) between 1 and 160),
  body text,
  button_label text,
  button_url text,
  desktop_image jsonb,
  mobile_image jsonb,
  offer_id uuid references public.offers (id) on delete set null,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hero', 'categories', 'products', 'promo', 'collection', 'usps', 'testimonials', 'story')),
  eyebrow text,
  title text,
  subtitle text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ content
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  city text check (city is null or char_length(city) <= 60),
  rating smallint not null default 5 check (rating between 1 and 5),
  title text,
  body text not null check (char_length(body) between 1 and 2000),
  source text not null default 'website',
  status public.review_status not null default 'pending',
  is_featured boolean not null default false,
  review_date date default current_date,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews (product_id) where status = 'approved';

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  intro text,
  body_html text,
  blocks jsonb not null default '{}'::jsonb,
  hero_image jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 300),
  answer_html text not null,
  group_name text not null default 'Orders',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  show_on_customize boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ inbox + tracking
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'contact' check (type in ('contact', 'custom_order')),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 7 and 20),
  email text check (email is null or char_length(email) <= 200),
  city text,
  subject text,
  message text not null check (char_length(message) between 1 and 4000),
  product_id uuid references public.products (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  status public.message_status not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null unique check (char_length(email) between 5 and 200),
  source text,
  ip_hash text,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists public.whatsapp_clicks (
  id bigint generated always as identity primary key,
  product_id uuid references public.products (id) on delete cascade,
  context text not null check (context in ('product', 'question', 'wishlist', 'floating', 'header', 'contact', 'customize', 'banner', 'other')),
  page_path text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists whatsapp_clicks_created_idx on public.whatsapp_clicks (created_at desc);
create index if not exists whatsapp_clicks_product_idx on public.whatsapp_clicks (product_id, created_at desc);

create table if not exists public.slug_redirects (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('product', 'category', 'collection')),
  old_slug text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (entity_type, old_slug)
);

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  user_email text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  created_at timestamptz not null default now()
);
create index if not exists activity_log_created_idx on public.activity_log (created_at desc);

-- ------------------------------------------------------------------ triggers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'site_settings', 'categories', 'materials', 'collections', 'products', 'offers', 'announcements',
    'hero_slides', 'promo_banners', 'home_sections', 'reviews', 'pages', 'faqs'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Old slugs keep working after a rename (permanent redirect to the new URL).
create or replace function public.record_slug_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare kind text := case tg_table_name when 'products' then 'product' when 'categories' then 'category' else 'collection' end;
begin
  if tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    insert into public.slug_redirects (entity_type, old_slug, entity_id)
    values (kind, old.slug, new.id)
    on conflict (entity_type, old_slug) do update set entity_id = excluded.entity_id, created_at = now();
  end if;
  -- A slug that is in use again must not redirect anywhere.
  delete from public.slug_redirects where entity_type = kind and old_slug = new.slug;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['products', 'categories', 'collections'] loop
    execute format('drop trigger if exists record_slug_change on public.%I', t);
    execute format('create trigger record_slug_change after insert or update of slug on public.%I for each row execute function public.record_slug_change()', t);
  end loop;
end $$;

-- Activity feed for the admin dashboard (only changes made by signed-in admins).
create or replace function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
  uid uuid := auth.uid();
begin
  if uid is null then
    return coalesce(new, old);
  end if;
  insert into public.activity_log (user_id, user_email, action, entity_type, entity_id, entity_label)
  values (
    uid,
    auth.jwt() ->> 'email',
    lower(tg_op),
    tg_table_name,
    case when rec ? 'id' and jsonb_typeof(rec -> 'id') = 'string' then (rec ->> 'id')::uuid end,
    left(coalesce(rec ->> 'name', rec ->> 'title', rec ->> 'heading', rec ->> 'question', rec ->> 'message', rec ->> 'customer_name', rec ->> 'slug', initcap(replace(tg_table_name, '_', ' '))), 160)
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'site_settings', 'categories', 'materials', 'collections', 'products', 'offers', 'announcements',
    'hero_slides', 'promo_banners', 'home_sections', 'reviews', 'pages', 'faqs'
  ] loop
    execute format('drop trigger if exists log_activity on public.%I', t);
    execute format('create trigger log_activity after insert or update or delete on public.%I for each row execute function public.log_activity()', t);
  end loop;
end $$;

-- Each WhatsApp order click bumps the product's counter (used for "best sellers" sorting).
create or replace function public.count_whatsapp_click()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.product_id is not null and new.context = 'product' then
    insert into public.product_stats (product_id, order_clicks, updated_at)
    values (new.product_id, 1, now())
    on conflict (product_id) do update set order_clicks = public.product_stats.order_clicks + 1, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists count_whatsapp_click on public.whatsapp_clicks;
create trigger count_whatsapp_click after insert on public.whatsapp_clicks
for each row execute function public.count_whatsapp_click();
