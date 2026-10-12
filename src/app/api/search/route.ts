import type { NextRequest } from 'next/server'
import { normalizeText, searchProducts } from '@/lib/data/catalog'
import { getSiteData } from '@/lib/data/site'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 80)
  const data = await getSiteData()
  const products = searchProducts(data.products, q, data.settings.search_synonyms).slice(0, 6)
  const nq = normalizeText(q)
  const categories = nq.length >= 2
    ? data.categories
        .filter((c) => c.productCount > 0 && normalizeText(c.name).split(' ').some((w) => w.startsWith(nq.split(' ')[0]!)))
        .slice(0, 5)
        .map((c) => ({ name: c.name, slug: c.slug }))
    : []
  return Response.json(
    {
      products: products.map((p) => ({
        name: p.name,
        slug: p.slug,
        image: p.images[0] ?? null,
        price: p.price_on_request ? null : p.pricing.final,
        category: p.category?.name ?? null,
      })),
      categories,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
