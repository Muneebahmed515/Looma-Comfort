// Runs all migrations + seed in an in-process Postgres (PGlite) and checks the triggers and
// helper functions the website relies on. Run: npm run db:check
import { PGlite } from '@electric-sql/pglite'
import { citext } from '@electric-sql/pglite/contrib/citext'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { readdirSync, readFileSync } from 'node:fs'
import { bundleSql } from './bundle-sql'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  if (ok) console.log(`  ok   ${name}`)
  else {
    failures++
    console.log(`  FAIL ${name} ${detail}`)
  }
}

const newDb = () => new PGlite({ extensions: { citext, pgcrypto } })

async function main() {
  const db = newDb()
  const dir = 'db/migrations'
  for (const file of readdirSync(dir).sort()) {
    try {
      await db.exec(readFileSync(`${dir}/${file}`, 'utf8'))
      console.log(`migrated ${file}`)
    } catch (e) {
      console.error(`migration failed: ${file}\n`, e)
      process.exit(1)
    }
  }
  try {
    await db.exec(readFileSync('db/seed.sql', 'utf8'))
    console.log('seeded')
  } catch (e) {
    console.error('seed failed\n', e)
    process.exit(1)
  }

  const count = async (sql: string) => Number(((await db.query<{ n: number }>(sql)).rows[0] as { n: number }).n)
  const fails = async (sql: string) => db.exec(sql).then(() => false, () => true)

  console.log('\ncontent')
  const products = await count('select count(*)::int as n from public.products')
  check('products seeded', products > 20, String(products))
  check('settings row exists', (await count('select count(*)::int as n from public.site_settings')) === 1)
  check('product stats seeded', (await count('select count(*)::int as n from public.product_stats')) === products)
  check('only one settings row allowed', await fails(`insert into public.site_settings (id) values (2)`))

  console.log('\nadmin users')
  const owner = '00000000-0000-4000-8000-000000000002'
  await db.exec(`insert into public.admin_users (user_id, email, role, password_hash) values ('${owner}', 'Owner@Example.com', 'owner', 'x')`)
  check('emails are case-insensitive', (await count(`select count(*)::int as n from public.admin_users where email = 'owner@example.com'`)) === 1)
  check('duplicate email rejected', await fails(`insert into public.admin_users (email) values ('OWNER@example.com')`))

  console.log('\nactivity log')
  await db.exec(`insert into public.products (name, slug, price, is_visible) values ('Anonymous', 'anonymous', 1, true)`)
  check('changes without an admin are not logged', (await count('select count(*)::int as n from public.activity_log')) === 0)
  await db.transaction(async (tx) => {
    await tx.query(`select set_config('app.user_id', '${owner}', true), set_config('app.user_email', 'owner@example.com', true)`)
    await tx.query(`insert into public.products (name, slug, price, is_visible) values ('Test Chair', 'test-chair', 1000, true)`)
  })
  const logged = await db.query<{ user_email: string; entity_label: string }>(`select user_email, entity_label from public.activity_log where user_id = '${owner}'`)
  check('admin changes are logged with who made them', logged.rows.length === 1 && logged.rows[0]!.user_email === 'owner@example.com' && logged.rows[0]!.entity_label === 'Test Chair')
  check('actor does not leak outside the transaction', (await db.query<{ v: string | null }>(`select nullif(current_setting('app.user_id', true), '') as v`)).rows[0]!.v === null)

  console.log('\nslug redirects')
  await db.exec(`update public.products set slug = 'test-chair-renamed' where slug = 'test-chair'`)
  const redirect = (await db.query<{ s: string }>(`select public.resolve_slug_redirect('product', 'test-chair') as s`)).rows[0]?.s
  check('old slug redirects to new slug', redirect === 'test-chair-renamed', String(redirect))
  await db.exec(`update public.products set is_visible = false where slug = 'test-chair-renamed'`)
  const hidden = (await db.query<{ s: string | null }>(`select public.resolve_slug_redirect('product', 'test-chair') as s`)).rows[0]?.s
  check('no redirect to a hidden product', hidden === null, String(hidden))

  console.log('\ntracking')
  const pid = (await db.query<{ id: string }>(`select id from public.products where slug = 'cove-side-table'`)).rows[0]!.id
  const before = await count(`select order_clicks as n from public.product_stats where product_id = '${pid}'`)
  await db.exec(`insert into public.whatsapp_clicks (product_id, context) values ('${pid}', 'product')`)
  check('whatsapp click increments counter', (await count(`select order_clicks as n from public.product_stats where product_id = '${pid}'`)) === before + 1)
  await db.exec(`insert into public.whatsapp_clicks (context, created_at) values ('other', now() - interval '2 years')`)
  await db.exec('select public.prune_old_rows()')
  check('old clicks are pruned', (await count(`select count(*)::int as n from public.whatsapp_clicks where created_at < now() - interval '1 year'`)) === 0)

  console.log('\none-file setup (db/setup.sql)')
  const setup = readFileSync('db/setup.sql', 'utf8')
  check('setup.sql is up to date (npm run db:bundle)', setup === bundleSql())
  const fresh = newDb()
  const setupError = await fresh.exec(setup).then(
    () => null,
    (e: unknown) => String(e),
  )
  check('setup.sql runs on an empty database', setupError === null, setupError ?? '')
  if (!setupError) {
    check('setup.sql adds the starter products', (await fresh.query('select 1 from public.products')).rows.length === products)
    check('setup.sql can run twice', (await fresh.exec(setup).then(() => null, (e: unknown) => String(e))) === null)
  }

  console.log(failures ? `\n${failures} check(s) failed` : '\nall database checks passed')
  process.exit(failures ? 1 : 0)
}

main()
