import 'server-only'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import { isSupabaseConfigured } from '../env'
import { createSupabaseServer } from '../supabase/server'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'owner' | 'editor'
  /** True when Supabase isn't connected: the admin can be explored but nothing saves. */
  demo: boolean
}

/** Verifies the signed-in user is in admin_users. Redirects to login otherwise. */
export const requireAdmin = cache(async (): Promise<AdminUser> => {
  // The admin is always rendered per request, never prerendered.
  await connection()
  if (!isSupabaseConfigured) {
    return { id: 'demo', email: 'demo@loomacomfort.com', name: 'Demo admin', role: 'owner', demo: true }
  }
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) redirect('/admin/login')
  const { data: row } = await supabase.from('admin_users').select('role, full_name').eq('user_id', data.user.id).maybeSingle()
  if (!row) redirect('/admin/login?error=not-admin')
  // If two-factor authentication is set up, require it for this session.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') redirect('/admin/login?mfa=1')
  return { id: data.user.id, email: data.user.email ?? '', name: row.full_name, role: row.role, demo: false }
})

export type ActionResult<T = undefined> = { ok: true; message?: string; data?: T } | { ok: false; message: string; errors?: Record<string, string> }

export const DEMO_MESSAGE = 'Demo mode: connect Supabase (see README) to save changes.'

/** For server actions: returns the admin, or an error result to send back to the form. */
export async function adminForAction(opts: { owner?: boolean } = {}): Promise<{ admin: AdminUser } | { error: ActionResult<never> }> {
  if (!isSupabaseConfigured) return { error: { ok: false, message: DEMO_MESSAGE } }
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
