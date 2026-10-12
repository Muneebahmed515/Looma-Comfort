import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { SITE_TAG } from '@/lib/data/site'

/**
 * Called by the database scheduler (pg_cron) when an offer, banner or slide starts or ends,
 * so prices and banners update without anyone pressing a button.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  const auth = request.headers.get('authorization') ?? ''
  if (!secret || auth !== `Bearer ${secret}`) return Response.json({ ok: false }, { status: 401 })
  revalidateTag(SITE_TAG, { expire: 0 })
  return Response.json({ ok: true, revalidated: SITE_TAG })
}
