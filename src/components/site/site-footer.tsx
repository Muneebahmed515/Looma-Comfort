import Image from 'next/image'
import Link from 'next/link'
import { IconFacebook, IconInstagram, IconMail, IconMapPin, IconPhone, IconTikTok, IconWhatsApp, IconYouTube } from '@/components/icons'
import type { SiteData } from '@/lib/data/build'
import { whatsappLink } from '@/lib/whatsapp'
import { NewsletterForm } from './newsletter-form'
import { WhatsAppLink } from './whatsapp-link'

const EXPLORE = [
  { href: '/new-arrivals', label: 'New arrivals' },
  { href: '/best-sellers', label: 'Best sellers' },
  { href: '/sale', label: 'Sale & offers' },
  { href: '/customize', label: 'Custom furniture' },
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
  { href: '/faqs', label: 'FAQs' },
]

const POLICIES = [
  { href: '/policies/shipping', label: 'Shipping & delivery' },
  { href: '/policies/refund-and-returns', label: 'Refunds & returns' },
  { href: '/policies/privacy', label: 'Privacy policy' },
  { href: '/policies/terms', label: 'Terms of service' },
]

export function SiteFooter({ data }: { data: SiteData }) {
  const s = data.settings
  const shop = data.categories.filter((c) => c.parent_id && c.show_in_menu && c.productCount > 0).slice(0, 8)
  const wa = whatsappLink(s.whatsapp_number, s.whatsapp_general_message)
  const year = new Date(data.generatedAt).getFullYear()
  const socials = [
    s.instagram_url && { href: s.instagram_url, label: 'Instagram', Icon: IconInstagram },
    s.facebook_url && { href: s.facebook_url, label: 'Facebook', Icon: IconFacebook },
    s.tiktok_url && { href: s.tiktok_url, label: 'TikTok', Icon: IconTikTok },
    s.youtube_url && { href: s.youtube_url, label: 'YouTube', Icon: IconYouTube },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof IconInstagram }[]

  return (
    <footer className="bg-walnut text-ivory">
      <div className="container-site pt-16 pb-10 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Looma Comfort, home" className="inline-block">
              <Image src="/brand/lockup-light.png" alt="Looma Comfort" width={912} height={306} sizes="220px" className="h-auto w-[200px] lg:w-[230px]" />
            </Link>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-ivory/75">
              {s.tagline ? `${s.tagline}. ` : ''}Handcrafted furniture, delivered across Pakistan. Order on WhatsApp and pay when it arrives.
            </p>
            {socials.length > 0 && (
              <ul className="mt-7 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-11 place-items-center rounded-full border border-ivory/20 text-ivory/85 transition-colors duration-300 hover:border-gold hover:text-gold"
                    >
                      <Icon size={20} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-5">
            <FooterColumn title="Shop" links={[...shop.map((c) => ({ href: `/shop/${c.slug}`, label: c.name })), { href: '/shop', label: 'All furniture' }]} />
            <FooterColumn title="Explore" links={EXPLORE} />
            <FooterColumn title="Policies" links={POLICIES} />
          </div>

          <div className="lg:col-span-3">
            <p className="t-eyebrow text-gold">Get in touch</p>
            <ul className="mt-5 space-y-3.5 text-[0.92rem] text-ivory/85">
              <li>
                <WhatsAppLink href={wa} context="other" className="link-u flex items-center gap-3">
                  <IconWhatsApp size={18} className="text-gold" /> WhatsApp {s.phone ? `· ${s.phone}` : ''}
                </WhatsAppLink>
              </li>
              {s.phone && (
                <li>
                  <a href={`tel:${s.phone.replace(/\s+/g, '')}`} className="link-u flex items-center gap-3">
                    <IconPhone size={18} className="text-gold" /> {s.phone}
                  </a>
                </li>
              )}
              {s.email && (
                <li>
                  <a href={`mailto:${s.email}`} className="link-u flex items-center gap-3">
                    <IconMail size={18} className="text-gold" /> {s.email}
                  </a>
                </li>
              )}
              {s.address && (
                <li className="flex items-start gap-3">
                  <IconMapPin size={18} className="mt-0.5 shrink-0 text-gold" />
                  <span>
                    {s.address}
                    {s.business_hours && <span className="mt-1 block text-ivory/60">{s.business_hours}</span>}
                  </span>
                </li>
              )}
            </ul>
            <div className="mt-9">
              <p className="t-eyebrow text-gold">New arrivals, first</p>
              <p className="mt-2 mb-3 text-[0.85rem] text-ivory/65">Occasional emails about new pieces and private offers.</p>
              <NewsletterForm />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-ivory/15 pt-6 text-[0.8rem] text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {s.brand_name}. All rights reserved.
          </p>
          <p>Cash on delivery · Inspect before you pay · Free delivery nationwide</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="t-eyebrow text-gold">{title}</p>
      <ul className="mt-5 space-y-3 text-[0.92rem] text-ivory/80">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="link-u transition-colors hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
