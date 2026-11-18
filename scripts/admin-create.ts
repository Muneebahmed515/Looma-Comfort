// Creates the owner account, or sets a new password for an existing admin (also turns off
// their two-step sign in and signs them out everywhere). Use it for the first owner and
// whenever the owner is locked out.
// Run: npm run admin:create -- you@example.com "Your Name"
//      (prompts for a password; or set ADMIN_PASSWORD to skip the prompt)
import { createInterface } from 'node:readline/promises'
import pg from 'pg'
import { hashPassword } from '../src/lib/auth/crypto'
import { loadEnv } from './load-env'

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(question)
  rl.close()
  return answer
}

async function main() {
  loadEnv()
  const [emailArg, ...nameParts] = process.argv.slice(2)
  const email = (emailArg ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run admin:create -- you@example.com "Your Name"')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing. Add it to .env.local first.')
    process.exit(1)
  }
  const password = process.env.ADMIN_PASSWORD ?? (await ask('Choose a password (at least 10 characters): '))
  if (password.length < 10) {
    console.error('The password must be at least 10 characters.')
    process.exit(1)
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    const hash = await hashPassword(password)
    const name = nameParts.join(' ').trim() || null
    const { rows } = await client.query<{ created: boolean }>(
      `insert into public.admin_users (email, full_name, role, password_hash)
       values ($1, $2, 'owner', $3)
       on conflict (email) do update set
         password_hash = excluded.password_hash,
         full_name = coalesce(excluded.full_name, public.admin_users.full_name),
         totp_secret = null, totp_pending = null,
         session_version = public.admin_users.session_version + 1
       returning (xmax = 0) as created`,
      [email, name, hash],
    )
    console.log(rows[0]!.created ? `Owner account created for ${email}. Sign in at /admin.` : `New password set for ${email}. Sign in at /admin.`)
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
