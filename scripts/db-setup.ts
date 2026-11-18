// Creates every table in your Neon database and loads the starter content (db/setup.sql).
// Safe to run again: existing tables and rows are kept.
// Run: npm run db:setup   (reads DATABASE_URL from .env.local)
import { readFileSync } from 'node:fs'
import pg from 'pg'
import { loadEnv } from './load-env'

async function main() {
  loadEnv()
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is missing. Add it to .env.local (Neon > Connect > connection string).')
    process.exit(1)
  }
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    await client.query(readFileSync('db/setup.sql', 'utf8'))
    const { rows } = await client.query<{ n: number }>('select count(*)::int as n from public.products')
    console.log(`Database ready (${rows[0]!.n} products).`)
    const admins = await client.query<{ n: number }>('select count(*)::int as n from public.admin_users')
    if (!admins.rows[0]!.n) console.log('Next: create your owner account with  npm run admin:create -- you@example.com "Your Name"')
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
