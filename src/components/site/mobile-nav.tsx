'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import Link from 'next/link'
import { useState } from 'react'
import { IconCaretDown, IconPhone, IconSearch, IconWhatsApp } from '@/components/icons'
import { Sheet } from '@/components/ui/sheet'
import { SmartImage } from '@/components/ui/smart-image'
import { cn } from '@/lib/cn'
import { EASE_LOOMA } from '@/lib/motion-tokens'
import type { HeaderData } from './header-client'
import { WhatsAppLink } from './whatsapp-link'

const LINKS = [
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/best-sellers', label: 'Best Sellers' },
  { href: '/sale', label: 'Sale' },
  { href: '/customize', label: 'Customize your furniture' },
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
  { href: '/faqs', label: 'FAQs' },
]

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: HeaderData
  onSearch: () => void
}

export function MobileNav({ open, onOpenChange, data, onSearch }: MobileNavProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      title="Menu"
      footer={
        <div className="space-y-4 px-5 py-5">
          <WhatsAppLink href={data.whatsappHref} context="header" className="btn btn-primary btn-block">
            <IconWhatsApp size={18} /> Chat on WhatsApp
          </WhatsAppLink>
          <div className="flex items-center justify-between text-[0.85rem] text-taupe">
            {data.phone ? (
              <a href={`tel:${data.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2">
                <IconPhone size={16} /> {data.phone}
              </a>
            ) : (
              <span />
            )}
            <div className="flex gap-4">
              {data.socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link-u">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="px-5 pt-2 pb-6">
        <button
          type="button"
          onClick={() => {
            onOpenChange(false)
            window.setTimeout(onSearch, 250)
          }}
          className="flex w-full items-center gap-3 border-b border-line-strong py-3 text-left text-taupe"
        >
          <IconSearch size={20} /> Search sofas, tables, beds…
        </button>

        <p className="t-eyebrow mt-7 mb-2 text-gold-text">Shop</p>
        <ul>
          {data.categories.map((cat) => {
            const isOpen = expanded === cat.slug
            return (
              <li key={cat.slug} className="border-b border-line">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : cat.slug)}
                  className="flex w-full items-center justify-between py-4 font-serif text-[1.45rem] leading-none text-walnut"
                >
                  {cat.name}
                  <IconCaretDown size={16} className={cn('text-gold-text transition-transform duration-300', isOpen && 'rotate-180')} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <m.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE_LOOMA }}
                      className="overflow-hidden"
                    >
                      <li className="pb-2">
                        <Link href={`/shop/${cat.slug}`} className="t-label block py-2 text-[0.72rem] text-gold-text">
                          All {cat.name.toLowerCase()}
                        </Link>
                      </li>
                      {cat.children.map((child) => (
                        <li key={child.slug}>
                          <Link href={`/shop/${child.slug}`} className="flex items-center gap-4 py-2.5 text-walnut">
                            <span className="relative size-12 shrink-0 overflow-hidden bg-beige-soft">
                              <SmartImage asset={child.image} fill sizes="48px" className="object-cover" />
                            </span>
                            {child.name}
                          </Link>
                        </li>
                      ))}
                      <li className="h-3" />
                    </m.ul>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>

        <ul className="mt-6 space-y-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block py-2 text-[1.02rem] text-walnut">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
