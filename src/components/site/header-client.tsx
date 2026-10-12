'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconArrowRight, IconCaretDown, IconHeart, IconMenu, IconSearch, IconWhatsApp } from '@/components/icons'
import { SmartImage } from '@/components/ui/smart-image'
import { useWishlist } from '@/lib/client-store'
import { cn } from '@/lib/cn'
import { EASE_LOOMA } from '@/lib/motion-tokens'
import type { ImageAsset } from '@/lib/types'
import { WhatsAppLink } from './whatsapp-link'

export interface NavCategory {
  name: string
  slug: string
  image: ImageAsset | null
  children: { name: string; slug: string; image: ImageAsset | null }[]
}

export interface HeaderData {
  categories: NavCategory[]
  promo: { eyebrow: string; title: string; href: string; image: ImageAsset | null } | null
  whatsappHref: string | null
  phone: string | null
  socials: { label: string; href: string }[]
  popularSearches: string[]
}

// Loaded on first use so their dialog code never weighs down the first page load.
const MobileNav = dynamic(() => import('./mobile-nav').then((mod) => mod.MobileNav), { ssr: false })
const SearchOverlay = dynamic(() => import('./search-overlay').then((mod) => mod.SearchOverlay), { ssr: false })

const NAV = [
  { href: '/new-arrivals', label: 'New Arrivals' },
  { href: '/best-sellers', label: 'Best Sellers' },
  { href: '/sale', label: 'Sale' },
  { href: '/customize', label: 'Customize' },
]

export function HeaderClient({ data, logo }: { data: HeaderData; logo: ReactNode }) {
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { count } = useWishlist()
  const openTimer = useRef(0)
  const closeTimer = useRef(0)
  const anyOpen = megaOpen || mobileOpen || searchOpen
  // Mount drawers on first open, then keep them so closing can animate.
  const [usedMobile, setUsedMobile] = useState(false)
  const [usedSearch, setUsedSearch] = useState(false)
  if (mobileOpen && !usedMobile) setUsedMobile(true)
  if (searchOpen && !usedSearch) setUsedSearch(true)

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(y > 8)
        if (y < 140) setHidden(false)
        else if (y > last + 4) setHidden(true)
        else if (y < last - 4) setHidden(false)
        last = y
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Warm up the drawer code once the page has settled, so the first tap feels instant.
  useEffect(() => {
    const id = window.setTimeout(() => {
      void import('./mobile-nav')
      void import('./search-overlay')
    }, 4000)
    return () => window.clearTimeout(id)
  }, [])

  // Close menus on navigation (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMegaOpen(false)
    setMobileOpen(false)
    setSearchOpen(false)
  }

  useEffect(() => {
    if (!megaOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMegaOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [megaOpen])

  const enterMega = () => {
    window.clearTimeout(closeTimer.current)
    openTimer.current = window.setTimeout(() => setMegaOpen(true), 120)
  }
  const leaveMega = () => {
    window.clearTimeout(openTimer.current)
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 220)
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <header
        className="site-header sticky top-0 z-40 bg-ivory"
        data-hidden={hidden && !anyOpen ? 'true' : 'false'}
        data-scrolled={scrolled || megaOpen ? 'true' : 'false'}
        onMouseLeave={leaveMega}
      >
        <div className="container-site grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: menu + search on mobile, primary nav on desktop */}
          <div className="flex items-center gap-1 lg:gap-0">
            <button
              type="button"
              className="-ml-2.5 grid size-11 place-items-center text-walnut lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu size={24} />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center text-walnut lg:hidden"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch size={22} />
            </button>
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-7 xl:gap-9">
                <li onMouseEnter={enterMega}>
                  <button
                    type="button"
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                    onClick={() => setMegaOpen((o) => !o)}
                    className="link-u t-label flex items-center gap-1.5 py-3 text-[0.78rem] text-walnut"
                    data-active={megaOpen || pathname.startsWith('/shop') ? 'true' : 'false'}
                  >
                    Shop
                    <IconCaretDown size={12} className={cn('transition-transform duration-300', megaOpen && 'rotate-180')} />
                  </button>
                </li>
                {NAV.map((item) => (
                  <li key={item.href} onMouseEnter={leaveMega}>
                    <Link
                      href={item.href}
                      className="link-u t-label py-3 text-[0.78rem] text-walnut"
                      data-active={isActive(item.href) ? 'true' : 'false'}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="justify-self-center" onMouseEnter={leaveMega}>
            {logo}
          </div>

          {/* Right: search, wishlist, WhatsApp */}
          <div className="flex items-center justify-end gap-0.5 lg:gap-2" onMouseEnter={leaveMega}>
            <button
              type="button"
              className="hidden size-11 place-items-center text-walnut transition-colors hover:text-gold-text lg:grid"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch size={22} />
            </button>
            <Link
              href="/wishlist"
              className="relative grid size-11 place-items-center text-walnut transition-colors hover:text-gold-text"
              aria-label={`Wishlist${count ? `, ${count} saved` : ''}`}
            >
              <IconHeart size={22} />
              {count > 0 && (
                <span className="tabular absolute top-1.5 right-1 grid min-w-4 place-items-center rounded-full bg-walnut px-1 text-[0.6rem] leading-4 text-ivory">
                  {count}
                </span>
              )}
            </Link>
            <WhatsAppLink
              href={data.whatsappHref}
              context="header"
              className="-mr-2.5 grid size-11 place-items-center text-walnut transition-colors hover:text-gold-text lg:mr-0"
              aria-label="Chat on WhatsApp"
            >
              <IconWhatsApp size={23} />
            </WhatsAppLink>
          </div>
        </div>

        <AnimatePresence>
          {megaOpen && (
            <m.div
              id="mega-menu"
              data-lenis-prevent
              className="absolute inset-x-0 top-full hidden border-t border-line bg-ivory shadow-[0_24px_40px_-24px_rgb(58_37_25/0.25)] lg:block"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4, ease: EASE_LOOMA }}
              onMouseEnter={() => window.clearTimeout(closeTimer.current)}
            >
              <m.div
                className="container-site grid grid-cols-12 gap-10 py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="col-span-8 grid grid-cols-4 gap-8">
                  {data.categories.map((cat) => (
                    <div key={cat.slug}>
                      <Link href={`/shop/${cat.slug}`} className="t-eyebrow link-u text-gold-text">
                        {cat.name}
                      </Link>
                      <ul className="mt-5 space-y-3">
                        {cat.children.map((child) => (
                          <li key={child.slug}>
                            <Link href={`/shop/${child.slug}`} className="link-u font-serif text-[1.3rem] leading-tight text-walnut">
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {data.promo && (
                  <Link href={data.promo.href} className="group col-span-4 grid grid-cols-[1fr_1.1fr] items-end gap-6">
                    <div className="media-zoom relative aspect-[4/5] overflow-hidden bg-beige-soft">
                      <SmartImage asset={data.promo.image} fill sizes="240px" className="object-cover" />
                    </div>
                    <div className="pb-1">
                      <p className="t-eyebrow text-gold-text">{data.promo.eyebrow}</p>
                      <p className="mt-3 font-serif text-[1.6rem] leading-tight text-walnut">{data.promo.title}</p>
                      <span className="link-arrow t-label mt-4 text-walnut">
                        Explore <IconArrowRight size={14} className="card-arrow" />
                      </span>
                    </div>
                  </Link>
                )}
              </m.div>
              <div className="border-t border-line">
                <div className="container-site flex items-center gap-8 py-4 text-[0.85rem] text-taupe">
                  <Link href="/shop" className="link-arrow link-u text-walnut">
                    Shop all furniture <IconArrowRight size={14} />
                  </Link>
                  <Link href="/customize" className="link-u">
                    Custom orders
                  </Link>
                  <Link href="/about" className="link-u">
                    About us
                  </Link>
                  <Link href="/contact" className="link-u">
                    Contact
                  </Link>
                  <WhatsAppLink href={data.whatsappHref} context="header" className="link-u ml-auto flex items-center gap-2 text-walnut">
                    <IconWhatsApp size={18} /> Questions? Chat with us
                  </WhatsAppLink>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </header>

      {usedMobile && <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} data={data} onSearch={() => setSearchOpen(true)} />}
      {usedSearch && <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} popular={data.popularSearches} />}
    </>
  )
}
