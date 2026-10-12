import type { NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/env'
import { createPublicClient } from '@/lib/supabase/public'

/**
 * Daily Vercel Cron: a tiny query so the free Supabase project never pauses for inactivity.
 * Vercel sends "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 })
  }
  if (!isSupabaseConfigured) return Response.json({ ok: true, supabase: false })
  const { error } = await createPublicClient().from('site_settings').select('id').limit(1)
  return Response.json({ ok: !error, at: new Date().toISOString() })
}
