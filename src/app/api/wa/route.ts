import type { NextRequest } from 'next/server'
import { clientIpHash, memoryRateLimit } from '@/lib/server/spam'
import { query } from '@/lib/db'
import { isDbConfigured } from '@/lib/env'

const CONTEXTS = new Set(['product', 'question', 'wishlist', 'floating', 'header', 'contact', 'customize', 'banner', 'other'])

/** WhatsApp click beacon: feeds "most requested" on the dashboard and best-seller sorting. */
export async function POST(request: NextRequest) {
  if (!isDbConfigured) return new Response(null, { status: 204 })
  let body: { context?: string; productId?: string | null; path?: string } = {}
  try {
    body = await request.json()
  } catch {
    return new Response(null, { status: 400 })
  }
  const context = CONTEXTS.has(body.context ?? '') ? body.context! : 'other'
  const productId = body.productId && /^[0-9a-f-]{36}$/i.test(body.productId) ? body.productId : null
  const ipHash = await clientIpHash()
  // One click per product per visitor every 10 minutes is plenty for counting interest.
  if (!memoryRateLimit(`wa:${ipHash}:${productId ?? context}`, 1, 10 * 60 * 1000)) return new Response(null, { status: 204 })
  try {
    // A product that was just deleted fails the foreign key; that click is simply dropped.
    await query('insert into public.whatsapp_clicks (context, product_id, page_path, ip_hash) values ($1, $2, $3, $4)', [
      context,
      productId,
      String(body.path ?? '').slice(0, 200),
      ipHash,
    ])
  } catch {
    // Never fail the visitor's click.
  }
  return new Response(null, { status: 204 })
}
