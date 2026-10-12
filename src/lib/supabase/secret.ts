import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '../env'

const SECRET = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const hasSecretKey = Boolean(SUPABASE_URL && SECRET)

/**
 * Bypasses Row Level Security. Only used on the server for public form submissions
 * (after spam checks), click counting and inviting admins. Never import in client code.
 */
export function createSecretClient() {
  if (!hasSecretKey) throw new Error('SUPABASE_SECRET_KEY is not configured')
  return createClient(SUPABASE_URL, SECRET, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
