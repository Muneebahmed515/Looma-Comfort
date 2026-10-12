import type { Metadata } from 'next'
import { Gallery, PageHero, ProcessSteps } from '@/components/content/blocks'
import { CustomOrderForm } from '@/components/content/custom-order-form'
import { IconWhatsApp } from '@/components/icons'
import { WhatsAppLink } from '@/components/site/whatsapp-link'
import { AccordionItem } from '@/components/ui/accordion'
import { JsonLd } from '@/components/ui/json-ld'
import { RichText } from '@/components/ui/rich-text'
import { SmartImage } from '@/components/ui/smart-image'
import { getPage, getSiteData } from '@/lib/data/site'
import { htmlToText } from '@/lib/sanitize'
import { whatsappLink } from '@/lib/whatsapp'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('customize')
  return {
    title: page?.seo_title ?? 'Custom furniture, made to measure',
    description: page?.seo_description ?? page?.intro ?? undefined,
    alternates: { canonical: '/customize' },
  }
}

export default async function CustomizePage() {
  const [page, data] = await Promise.all([getPage('customize'), getSiteData()])
  const s = data.settings
  const b = page?.blocks ?? {}
  const wa = whatsappLink(s.whatsapp_number, s.whatsapp_custom_message)
  const faqs = data.faqs.filter((f) => f.show_on_customize)

  return (
    <>
      <PageHero eyebrow="Customize your furniture" title={page?.title ?? 'Made to your measurements'} intro={page?.intro} image={page?.hero_image}>
        <div className="flex flex-wrap gap-3">
          <WhatsAppLink href={wa} context="customize" className="btn btn-primary">
            <IconWhatsApp size={18} /> Discuss on WhatsApp
          </WhatsAppLink>
          <a href="#custom-request" className="btn btn-secondary">
            Send a request
          </a>
        </div>
      </PageHero>

      {page?.body_html && (
        <section className="border-t border-line py-16 lg:py-20">
          <div className="container-site max-w-3xl" data-reveal="up">
            <RichText html={page.body_html} className="text-[1.08rem]" />
          </div>
        </section>
      )}

      {b.options && b.options.length > 0 && (
        <section className="section-y bg-beige-soft">
          <div className="container-site">
            <p className="eyebrow-rule t-eyebrow mb-4 text-gold-text" data-align="start" data-reveal-rule="">
              What you can change
            </p>
            <h2 className="t-h2 max-w-2xl" data-reveal="lines">
              Almost everything, if it makes your home better
            </h2>
            <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {b.options.map((o) => (
                <li key={o.title} data-reveal="card">
                  <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                    <SmartImage asset={o.image} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 100vw" className="object-cover" />
                  </div>
                  <h3 className="mt-5 font-serif text-[1.45rem] font-semibold text-walnut">{o.title}</h3>
                  <p className="mt-2 text-[0.93rem] text-taupe-deep">{o.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <ProcessSteps steps={b.steps ?? []} eyebrow="How it works" title="Five calm steps from idea to delivery" />

      <Gallery images={b.gallery ?? []} />

      <section id="custom-request" className="section-y scroll-mt-24 bg-beige-soft">
        <div className="container-site grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow-rule t-eyebrow mb-4 text-gold-text" data-align="start" data-reveal-rule="">
              Start here
            </p>
            <h2 className="t-h2" data-reveal="lines">
              Tell us what you have in mind
            </h2>
            <p className="mt-5 text-taupe-deep" data-reveal="up">
              Share a few details and we will reply with ideas, a price and a delivery time. Prefer to talk? Message us on WhatsApp with photos or a sketch.
            </p>
            <WhatsAppLink href={wa} context="customize" className="btn btn-secondary mt-8">
              <IconWhatsApp size={18} /> WhatsApp instead
            </WhatsAppLink>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <CustomOrderForm whatsappNumber={s.whatsapp_number} baseMessage={s.whatsapp_custom_message} />
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="section-y">
          <div className="container-site grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="t-h2" data-reveal="lines">
                Custom order questions
              </h2>
            </div>
            <div className="border-t border-line lg:col-span-7 lg:col-start-6">
              {faqs.map((f) => (
                <AccordionItem key={f.id} title={f.question}>
                  <RichText html={f.answer_html} />
                </AccordionItem>
              ))}
            </div>
          </div>
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: htmlToText(f.answer_html, 1000) } })),
            }}
          />
        </section>
      )}
    </>
  )
}
