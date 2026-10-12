import type { NextRequest } from 'next/server'
import { toCard } from '@/lib/data/build'
import { getSiteData } from '@/lib/data/site'

/** Card data for a list of product ids (wishlist, recently viewed). Prices are always current. */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/i.test(s))
    .slice(0, 40)
  const data = await getSiteData()
  const byId = new Map(data.products.map((p) => [p.id, p]))
  const products = ids
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined)
    .map((p) => ({
      ...toCard(p),
      sku: p.sku,
      options: p.options,
      price: p.price,
      sale_price: p.sale_price,
      offer: p.offer,
    }))
  return Response.json({ products }, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' } })
}
