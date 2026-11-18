import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import { SESSION_COOKIE, verifySessionToken } from '../auth/session'
import { queryOne, type Actor } from '../db'
import { isDbConfigured } from '../env'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'owner' | 'editor'
  /** True when the database isn't connected: the admin can be explored but nothing saves. */
  demo: boolean
}

export interface AdminRow {
  user_id: string
  email: string
  full_name: string | null
  role: 'owner' | 'editor'
  password_hash: string | null
  totp_secret: string | null
  session_version: number
}

type SessionState = { status: 'ok'; admin: AdminUser } | { status: 'signed-out' } | { status: 'needs-mfa' }

/** Reads the session cookie and checks it against admin_users. */
export const readSession = cache(async (): Promise<SessionState> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = verifySessionToken(token)
  if (!session) return { status: 'signed-out' }
  const row = await queryOne<AdminRow>(
    'select user_id, email, full_name, role, totp_secret, session_version from public.admin_users where user_id = $1',
    [session.sub],
  )
  if (!row || row.session_version !== session.v) return { status: 'signed-out' }
  if (row.totp_secret && !session.mfa) return { status: 'needs-mfa' }
  return { status: 'ok', admin: { id: row.user_id, email: row.email, name: row.full_name, role: row.role, demo: false } }
})

/** Verifies the signed-in user is an admin. Redirects to login otherwise. */
export const requireAdmin = cache(async (): Promise<AdminUser> => {
  // The admin is always rendered per request, never prerendered.
  await connection()
  if (!isDbConfigured) {
    return { id: 'demo', email: 'demo@loomacomfort.com', name: 'Demo admin', role: 'owner', demo: true }
  }
  const state = await readSession()
  if (state.status === 'needs-mfa') redirect('/admin/login?mfa=1')
  if (state.status !== 'ok') redirect('/admin/login')
  return state.admin
})

export type ActionResult<T = undefined> = { ok: true; message?: string; data?: T } | { ok: false; message: string; errors?: Record<string, string> }

export const DEMO_MESSAGE = 'Demo mode: connect the Neon database (see README) to save changes.'

/** For server actions: returns the admin, or an error result to send back to the form. */
export async function adminForAction(opts: { owner?: boolean } = {}): Promise<{ admin: AdminUser } | { error: ActionResult<never> }> {
  if (!isDbConfigured) return { error: { ok: false, message: DEMO_MESSAGE } }
  try {
    const admin = await requireAdmin()
    if (opts.owner && admin.role !== 'owner') return { error: { ok: false, message: 'Only the owner account can change this.' } }
    return { admin }
  } catch (e) {
    // redirect() throws; treat as signed out.
    if (e && typeof e === 'object' && 'digest' in e) return { error: { ok: false, message: 'Your session has expired. Please sign in again.' } }
    throw e
  }
}

export function actorOf(admin: AdminUser): Actor {
  return { id: admin.id, email: admin.email }
}
