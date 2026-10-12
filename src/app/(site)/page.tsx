import type { Metadata } from 'next'
import { HomeSections } from '@/components/home/home-sections'
import { JsonLd } from '@/components/ui/json-ld'
import { getSiteData } from '@/lib/data/site'
import { SITE_URL } from '@/lib/env'

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteData()
  return {
    title: { absolute: settings.default_seo_title || `${settings.brand_name} | Premium Furniture in Pakistan` },
    alternates: { canonical: '/' },
  }
}

export default async function HomePage() {
  const data = await getSiteData()
  const hasHero = data.homeSections.some((s) => s.type === 'hero') && data.heroSlides.length > 0
  return (
    <>
      {!hasHero && <h1 className="sr-only">{data.settings.brand_name}: premium furniture in Pakistan</h1>}
      <HomeSections data={data} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: data.settings.brand_name,
          url: SITE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
            'query-input': 'required name=search_term_string',
          },
        }}
      />
    </>
  )
}
