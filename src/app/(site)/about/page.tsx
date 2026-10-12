import type { Metadata } from 'next'
import { CtaBand, Gallery, ImageTextRow, PageHero, ProcessSteps, ValuesGrid } from '@/components/content/blocks'
import { StatRow } from '@/components/home/brand-story'
import { RichText } from '@/components/ui/rich-text'
import { getPage, getSiteData } from '@/lib/data/site'
import { whatsappLink } from '@/lib/whatsapp'
import { absoluteImageUrl } from '@/lib/images'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about')
  return {
    title: page?.seo_title ?? 'About us',
    description: page?.seo_description ?? page?.intro ?? undefined,
    alternates: { canonical: '/about' },
    openGraph: page?.hero_image ? { images: [{ url: absoluteImageUrl(page.hero_image.ref, 1600) }] } : undefined,
  }
}

export default async function AboutPage() {
  const [page, data] = await Promise.all([getPage('about'), getSiteData()])
  const b = page?.blocks ?? {}
  const wa = whatsappLink(data.settings.whatsapp_number, data.settings.whatsapp_general_message)
  return (
    <>
      <PageHero eyebrow="About Looma Comfort" title={page?.title ?? 'About us'} intro={page?.intro} image={page?.hero_image} />

      {page?.body_html && (
        <section className="section-y border-t border-line">
          <div className="container-site grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow-rule t-eyebrow text-gold-text" data-align="start" data-reveal-rule="">
                Our story
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6" data-reveal="up">
              <RichText html={page.body_html} className="text-[1.08rem] [&_p:first-child]:font-serif [&_p:first-child]:text-[1.6rem] [&_p:first-child]:leading-snug" />
            </div>
          </div>
        </section>
      )}

      {b.sections && b.sections.length > 0 && (
        <section className="pb-20 lg:pb-28">
          <div className="container-site space-y-20 lg:space-y-28">
            {b.sections.map((s, i) => (
              <ImageTextRow key={s.heading} heading={s.heading} body={s.body} image={s.image} reverse={i % 2 === 1} />
            ))}
          </div>
        </section>
      )}

      <ValuesGrid items={b.values ?? []} eyebrow="What we stand for" title="Values you can feel in every piece" />

      <ProcessSteps steps={b.steps ?? []} eyebrow="How we make it" title="From timber to your living room" />

      {b.stats && b.stats.length > 0 && (
        <section className="pb-20 lg:pb-24">
          <div className="container-site max-w-4xl">
            <StatRow stats={b.stats} />
          </div>
        </section>
      )}

      <Gallery images={b.gallery ?? []} />

      <CtaBand
        title="Questions about a piece, a fabric or a size?"
        text="Talk to a real person on WhatsApp. We reply quickly and can send photos and videos of any piece."
        whatsappHref={wa}
      />
    </>
  )
}
