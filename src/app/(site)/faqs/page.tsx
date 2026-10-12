import type { Metadata } from 'next'
import { CtaBand, PageHero } from '@/components/content/blocks'
import { AccordionItem } from '@/components/ui/accordion'
import { JsonLd } from '@/components/ui/json-ld'
import { RichText } from '@/components/ui/rich-text'
import { getSiteData } from '@/lib/data/site'
import { slugify } from '@/lib/format'
import { htmlToText } from '@/lib/sanitize'
import { whatsappLink } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description: 'Ordering on WhatsApp, cash on delivery, delivery times, custom sizes, care and returns: answers to common questions.',
  alternates: { canonical: '/faqs' },
}

export default async function FaqsPage() {
  const data = await getSiteData()
  const groups = [...new Set(data.faqs.map((f) => f.group_name))]
  const wa = whatsappLink(data.settings.whatsapp_number, data.settings.whatsapp_general_message)
  return (
    <>
      <PageHero
        eyebrow="Help"
        title="Questions, answered"
        intro="Everything about ordering, delivery, payment and caring for your furniture. Can't find what you need? We are a message away."
      />
      <nav aria-label="FAQ topics" className="sticky top-0 z-20 border-y border-line bg-ivory/95 backdrop-blur-sm">
        <div className="no-scrollbar container-site flex gap-2 overflow-x-auto py-3">
          {groups.map((g) => (
            <a key={g} href={`#${slugify(g)}`} className="shrink-0 rounded-[2px] border border-line-strong px-4 py-2 text-[0.85rem] whitespace-nowrap text-walnut transition-colors hover:border-walnut">
              {g}
            </a>
          ))}
        </div>
      </nav>
      <div className="container-site space-y-16 py-16 lg:py-24">
        {groups.map((g) => (
          <section key={g} id={slugify(g)} className="grid scroll-mt-32 gap-6 lg:grid-cols-12">
            <h2 className="t-h3 lg:col-span-4" data-reveal="up">
              {g}
            </h2>
            <div className="border-t border-line lg:col-span-7 lg:col-start-6">
              {data.faqs
                .filter((f) => f.group_name === g)
                .map((f) => (
                  <AccordionItem key={f.id} title={f.question}>
                    <RichText html={f.answer_html} />
                  </AccordionItem>
                ))}
            </div>
          </section>
        ))}
      </div>
      <CtaBand title="Still have a question?" text="Message us on WhatsApp. A real person will reply, usually within the hour." whatsappHref={wa} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: data.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: htmlToText(f.answer_html, 1000) },
          })),
        }}
      />
    </>
  )
}
