import type { MetadataRoute } from 'next'
import { getSiteData } from '@/lib/data/site'
import { SITE_URL } from '@/lib/env'
import { absoluteImageUrl } from '@/lib/images'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSiteData()
  const now = new Date(data.generatedAt)
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly') => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  })
  return [
    page('/', 1, 'daily'),
    page('/shop', 0.9, 'daily'),
    page('/new-arrivals', 0.8, 'daily'),
    page('/best-sellers', 0.8),
    page('/sale', 0.8, 'daily'),
    page('/customize', 0.7, 'monthly'),
    page('/about', 0.5, 'monthly'),
    page('/contact', 0.5, 'monthly'),
    page('/faqs', 0.5, 'monthly'),
    ...['shipping', 'refund-and-returns', 'privacy', 'terms'].map((s) => page(`/policies/${s}`, 0.2, 'yearly')),
    ...data.categories
      .filter((c) => c.productCount > 0)
      .map((c) => ({ url: `${SITE_URL}/shop/${c.slug}`, lastModified: new Date(c.updated_at), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...data.collections.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}`, lastModified: new Date(c.updated_at), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...data.products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: p.images.slice(0, 3).map((i) => absoluteImageUrl(i.ref, 1600)),
    })),
  ]
}
