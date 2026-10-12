import { MotionProvider } from '@/components/motion/motion-provider'
import { MotionRoot } from '@/components/motion/motion-root'
import { AnnouncementBar } from '@/components/site/announcement-bar'
import { Analytics } from '@/components/site/analytics'
import { FloatingWhatsApp } from '@/components/site/floating-whatsapp'
import { IntroOverlay } from '@/components/site/intro-overlay'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { JsonLd } from '@/components/ui/json-ld'
import { getSiteData } from '@/lib/data/site'
import { SITE_URL } from '@/lib/env'
import { buildSocials } from '@/components/site/site-header'

export default async function SiteLayout({ children }: LayoutProps<'/'>) {
  const data = await getSiteData()
  const s = data.settings
  return (
    <MotionRoot>
      <a
        href="#main"
        className="sr-only z-[70] bg-walnut px-4 py-3 text-ivory focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <IntroOverlay />
      <AnnouncementBar messages={data.announcements.map(({ id, message, link_url }) => ({ id, message, link_url }))} />
      <SiteHeader data={data} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter data={data} />
      <FloatingWhatsApp number={s.whatsapp_number} message={s.whatsapp_general_message} siteUrl={SITE_URL} />
      <MotionProvider />
      <Analytics ga4={s.ga4_id} pixel={s.meta_pixel_id} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FurnitureStore',
          '@id': `${SITE_URL}/#store`,
          name: s.brand_name,
          url: SITE_URL,
          logo: `${SITE_URL}/brand/logo-full.png`,
          image: `${SITE_URL}/opengraph-image.jpg`,
          description: s.default_seo_description ?? undefined,
          telephone: s.phone ?? undefined,
          email: s.email ?? undefined,
          address: s.address ? { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: s.city ?? undefined, addressCountry: 'PK' } : undefined,
          currenciesAccepted: 'PKR',
          paymentAccepted: 'Cash',
          areaServed: { '@type': 'Country', name: 'Pakistan' },
          sameAs: buildSocials(s).map((x) => x.href),
        }}
      />
    </MotionRoot>
  )
}
