import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { SITE_TAG } from '@/lib/data/site'
import { query } from '@/lib/db'
import { isDbConfigured } from '@/lib/env'

/**
 * Daily Vercel Cron (vercel.json). Refreshes the cached site so offers, slides and banners
 * that started or ended are picked up, and trims old click/activity rows.
 * Vercel sends "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 })
  }
  if (!isDbConfigured) return Response.json({ ok: true, database: false })
  revalidateTag(SITE_TAG, { expire: 0 })
  const ok = await query('select public.prune_old_rows()').then(
    () => true,
    () => false,
  )
  return Response.json({ ok, at: new Date().toISOString() })
}
