import type { Metadata } from 'next'
import { PageHero } from '@/components/content/blocks'
import { ContactForm } from '@/components/content/contact-form'
import { MapEmbed } from '@/components/content/map-embed'
import { IconClock, IconMail, IconMapPin, IconPhone, IconWhatsApp } from '@/components/icons'
import { WhatsAppLink } from '@/components/site/whatsapp-link'
import { getSiteData } from '@/lib/data/site'
import { whatsappLink } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Message Looma Comfort on WhatsApp, call, email or send us a message. We reply quickly, seven days a week.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const { settings: s } = await getSiteData()
  const wa = whatsappLink(s.whatsapp_number, s.whatsapp_general_message)
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We would love to hear from you"
        intro="Questions about a piece, a custom size or your delivery? WhatsApp is the fastest way to reach us. You can also call, email or send a message below."
      />
      <section className="container-site grid gap-12 pb-20 lg:grid-cols-12 lg:gap-16 lg:pb-28">
        <div className="space-y-4 lg:col-span-5">
          <div className="anim-rise bg-walnut p-8 text-ivory lg:p-10" style={{ ['--d' as string]: '0.2s' }}>
            <IconWhatsApp size={32} className="text-gold" />
            <h2 className="t-h3 mt-5">Chat on WhatsApp</h2>
            <p className="mt-3 text-ivory/75">Send photos, ask about fabrics, or place an order. {s.whatsapp_reply_note}</p>
            <WhatsAppLink href={wa} context="contact" className="btn btn-light mt-7">
              <IconWhatsApp size={18} /> Start a chat
            </WhatsAppLink>
          </div>
          <ul className="anim-rise divide-y divide-line border-y border-line" style={{ ['--d' as string]: '0.28s' }}>
            {s.phone && (
              <li>
                <a href={`tel:${s.phone.replace(/\s+/g, '')}`} className="group flex items-center gap-5 py-5">
                  <IconPhone size={24} className="text-gold-text" />
                  <span>
                    <span className="block text-[0.8rem] text-taupe">Call us</span>
                    <span className="link-u text-[1.05rem] text-walnut">{s.phone}</span>
                  </span>
                </a>
              </li>
            )}
            {s.email && (
              <li>
                <a href={`mailto:${s.email}`} className="flex items-center gap-5 py-5">
                  <IconMail size={24} className="text-gold-text" />
                  <span>
                    <span className="block text-[0.8rem] text-taupe">Email</span>
                    <span className="link-u text-[1.05rem] text-walnut">{s.email}</span>
                  </span>
                </a>
              </li>
            )}
            {s.address && (
              <li className="flex items-center gap-5 py-5">
                <IconMapPin size={24} className="text-gold-text" />
                <span>
                  <span className="block text-[0.8rem] text-taupe">Visit</span>
                  <span className="text-[1.05rem] text-walnut">{s.address}</span>
                  {s.map_link_url && (
                    <a href={s.map_link_url} target="_blank" rel="noopener noreferrer" className="link-u mt-1 block text-[0.85rem] text-gold-text">
                      Get directions
                    </a>
                  )}
                </span>
              </li>
            )}
            {s.business_hours && (
              <li className="flex items-center gap-5 py-5">
                <IconClock size={24} className="text-gold-text" />
                <span>
                  <span className="block text-[0.8rem] text-taupe">Hours</span>
                  <span className="text-[1.05rem] text-walnut">{s.business_hours}</span>
                </span>
              </li>
            )}
          </ul>
        </div>
        <div className="anim-rise lg:col-span-7" style={{ ['--d' as string]: '0.24s' }}>
          <h2 className="t-h3 mb-8">Send us a message</h2>
          <ContactForm whatsappNumber={s.whatsapp_number} />
        </div>
      </section>
      <section className="container-site pb-20 lg:pb-28">
        <MapEmbed src={s.map_embed_url} address={s.address} linkUrl={s.map_link_url} />
      </section>
    </>
  )
}
