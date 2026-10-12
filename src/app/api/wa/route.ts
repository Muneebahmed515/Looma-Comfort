import type { NextRequest } from 'next/server'
import { clientIpHash, memoryRateLimit } from '@/lib/server/spam'
import { createSecretClient, hasSecretKey } from '@/lib/supabase/secret'

const CONTEXTS = new Set(['product', 'question', 'wishlist', 'floating', 'header', 'contact', 'customize', 'banner', 'other'])

/** WhatsApp click beacon: feeds "most requested" on the dashboard and best-seller sorting. */
export async function POST(request: NextRequest) {
  if (!hasSecretKey) return new Response(null, { status: 204 })
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
    await createSecretClient()
      .from('whatsapp_clicks')
      .insert({ context, product_id: productId, page_path: (body.path ?? '').slice(0, 200), ip_hash: ipHash })
  } catch {
    // Never fail the visitor's click.
  }
  return new Response(null, { status: 204 })
}
