// Runs all migrations + seed in an in-process Postgres (PGlite) with small stand-ins for
// Supabase's auth/storage/vault/cron schemas, then checks the Row Level Security rules.
// Run: npx tsx scripts/check-db.ts
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { readdirSync, readFileSync } from 'node:fs'

const STUBS = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;
create schema if not exists vault;
create schema if not exists cron;
create schema if not exists net;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, metadata jsonb);
alter table storage.objects enable row level security;
create table vault.secrets (name text, secret text);
create view vault.decrypted_secrets as select name, secret as decrypted_secret from vault.secrets;
create table cron.job (jobid bigserial primary key, jobname text, schedule text, command text);
create function cron.schedule(p_name text, p_schedule text, p_command text) returns bigint language sql as $$ insert into cron.job (jobname, schedule, command) values (p_name, p_schedule, p_command) returning jobid $$;
create function cron.unschedule(p_id bigint) returns boolean language sql as $$ delete from cron.job where jobid = p_id returning true $$;
create table net.requests (id bigserial primary key, url text, headers jsonb, body jsonb);
create function net.http_post(url text, headers jsonb, body jsonb) returns bigint language sql as $$ insert into net.requests (url, headers, body) values (url, headers, body) returning id $$;
grant usage on schema public, auth, extensions, storage to anon, authenticated;
`

const GRANTS = `
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
`

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name} ${detail}`)
  }
}

async function main() {
  const db = new PGlite({ extensions: { citext } })
  await db.exec(STUBS)

  const dir = 'supabase/migrations'
  for (const file of readdirSync(dir).sort()) {
    let sql = readFileSync(`${dir}/${file}`, 'utf8')
    sql = sql.replace(/create extension if not exists (pg_cron|pg_net)[^;]*;/g, '')
    try {
      await db.exec(sql)
      console.log(`migrated ${file}`)
    } catch (e) {
      console.error(`migration failed: ${file}\n`, e)
      process.exit(1)
    }
  }
  await db.exec(GRANTS)
  try {
    await db.exec(readFileSync('supabase/seed.sql', 'utf8'))
    console.log('seeded')
  } catch (e) {
    console.error('seed failed\n', e)
    process.exit(1)
  }

  const count = async (sql: string) => Number(((await db.query<{ n: number }>(sql)).rows[0] as { n: number }).n)
  const asRole = async (role: string, sub: string | null) => {
    await db.exec('reset role')
    await db.exec(`select set_config('request.jwt.claim.sub', '${sub ?? ''}', false)`)
    await db.exec(`select set_config('request.jwt.claims', '${sub ? JSON.stringify({ sub, email: 'admin@example.com' }) : ''}', false)`)
    await db.exec(`set role ${role}`)
  }
  const fails = async (sql: string) => {
    try {
      await db.exec(sql)
      return false
    } catch {
      return true
    }
  }

  console.log('\ncontent')
  const products = await count('select count(*)::int as n from public.products')
  check('products seeded', products > 20, String(products))
  check('settings row exists', (await count('select count(*)::int as n from public.site_settings')) === 1)
  check('cron jobs scheduled', (await count('select count(*)::int as n from cron.job')) === 2)
  check('product stats seeded', (await count('select count(*)::int as n from public.product_stats')) === products)

  // Hide one product to test visibility.
  await db.exec(`update public.products set is_visible = false where slug = 'oak-wall-desk'`)

  console.log('\nvisitor (anon)')
  await asRole('anon', null)
  check('sees only visible products', (await count('select count(*)::int as n from public.products')) === products - 1)
  check('cannot insert products', await fails(`insert into public.products (name, slug, price) values ('x', 'x', 1)`))
  check('cannot update settings', (await count(`with u as (update public.site_settings set brand_name = 'x' returning 1) select count(*)::int as n from u`)) === 0)
  check('cannot read contact messages', (await count('select count(*)::int as n from public.contact_messages')) === 0)
  check('cannot insert contact messages', await fails(`insert into public.contact_messages (name, phone, message) values ('a', '03001234567', 'hi')`))
  check('cannot subscribe directly', await fails(`insert into public.newsletter_subscribers (email) values ('a@b.co')`))
  check('cannot insert reviews directly', await fails(`insert into public.reviews (customer_name, body) values ('a', 'b')`))
  check('sees only approved reviews', (await count(`select count(*)::int as n from public.reviews where status <> 'approved'`)) === 0)
  check('cannot read admin users', (await count('select count(*)::int as n from public.admin_users')) === 0)
  check('cannot upload images', await fails(`insert into storage.objects (bucket_id, name) values ('products', 'x.webp')`))

  console.log('\nsigned-in non-admin')
  await db.exec('reset role')
  const stranger = '00000000-0000-4000-8000-000000000001'
  const owner = '00000000-0000-4000-8000-000000000002'
  await db.exec(`insert into auth.users (id, email) values ('${stranger}', 'stranger@example.com'), ('${owner}', 'owner@example.com')`)
  await asRole('authenticated', stranger)
  check('cannot insert products', await fails(`insert into public.products (name, slug, price) values ('x', 'x', 1)`))
  check('cannot delete categories', (await count(`with d as (delete from public.categories returning 1) select count(*)::int as n from d`)) === 0)
  check('cannot make self admin', await fails(`insert into public.admin_users (user_id, role) values ('${stranger}', 'owner')`))
  check('cannot upload images', await fails(`insert into storage.objects (bucket_id, name) values ('products', 'x.webp')`))

  console.log('\nadmin (owner)')
  await db.exec('reset role')
  await db.exec(`insert into public.admin_users (user_id, email, role) values ('${owner}', 'owner@example.com', 'owner')`)
  await asRole('authenticated', owner)
  check('sees hidden products', (await count('select count(*)::int as n from public.products')) === products)
  check('can insert product', !(await fails(`insert into public.products (name, slug, price, is_visible) values ('Test Chair', 'test-chair', 1000, true)`)))
  check('can update settings', (await count(`with u as (update public.site_settings set tagline = 'Hello' returning 1) select count(*)::int as n from u`)) === 1)
  check('can upload images', !(await fails(`insert into storage.objects (bucket_id, name) values ('products', 'a/b.webp')`)))
  check('cannot upload to unknown bucket', await fails(`insert into storage.objects (bucket_id, name) values ('secret', 'a.webp')`))
  check('activity is logged', (await count(`select count(*)::int as n from public.activity_log where user_id = '${owner}'`)) >= 2)
  await db.exec(`update public.products set slug = 'test-chair-renamed' where slug = 'test-chair'`)
  const redirect = (await db.query<{ s: string }>(`select public.resolve_slug_redirect('product', 'test-chair') as s`)).rows[0]?.s
  check('old slug redirects to new slug', redirect === 'test-chair-renamed', String(redirect))
  check('can read contact messages', !(await fails('select * from public.contact_messages')))

  console.log('\nserver (secret key) + triggers')
  await db.exec('reset role')
  const pid = (await db.query<{ id: string }>(`select id from public.products where slug = 'cove-side-table'`)).rows[0]!.id
  const before = await count(`select order_clicks as n from public.product_stats where product_id = '${pid}'`)
  await db.exec(`insert into public.whatsapp_clicks (product_id, context) values ('${pid}', 'product')`)
  check('whatsapp click increments counter', (await count(`select order_clicks as n from public.product_stats where product_id = '${pid}'`)) === before + 1)
  await db.exec(`insert into vault.secrets values ('revalidate_url', 'https://example.com/api/revalidate'), ('revalidate_secret', 's3cret')`)
  await db.exec(`update public.offers set starts_at = now() - interval '2 minutes' where name = 'Dining Week'`)
  await db.exec('select public.notify_schedule_boundaries()')
  check('scheduler pings the site when an offer starts', (await count('select count(*)::int as n from net.requests')) === 1)

  console.log(failures ? `\n${failures} check(s) failed` : '\nall database checks passed')
  process.exit(failures ? 1 : 0)
}

main()
