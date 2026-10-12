'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { IconArrowRight, IconClose, IconHeart, IconWhatsApp } from '@/components/icons'
import { Price } from '@/components/ui/price'
import { SmartImage } from '@/components/ui/smart-image'
import { useWishlist } from '@/lib/client-store'
import type { ProductCardData } from '@/lib/data/build'
import { formatPKR, slugify } from '@/lib/format'
import { computePrice, selectionDelta, selectionLines, type AppliedOffer } from '@/lib/pricing'
import { trackWhatsApp } from '@/lib/track'
import type { OptionGroup } from '@/lib/types'
import { buildListMessage, whatsappLink } from '@/lib/whatsapp'

type Item = ProductCardData & { sku: string | null; options: OptionGroup[]; price: number; sale_price: number | null; offer: AppliedOffer | null }

const noopSubscribe = () => () => {}

export function WishlistView({ whatsappNumber, siteUrl }: { whatsappNumber: string | null; siteUrl: string }) {
  const { items, remove, clear } = useWishlist()
  const [loaded, setLoaded] = useState<{ key: string; products: Item[] } | null>(null)
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const key = items.map((i) => i.id).join(',')

  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    fetch(`/api/products?ids=${key}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { products: Item[] }) => setLoaded({ key, products: d.products }))
      .catch(() => {})
    return () => ctrl.abort()
  }, [key])

  // Removing an item updates instantly; the fetch only adds data for newly saved pieces.
  const products: Item[] | null = !key ? [] : loaded ? loaded.products.filter((p) => items.some((i) => i.id === p.id)) : null

  if (!hydrated || products === null) {
    return <div className="container-site min-h-[30vh] pb-24" aria-busy />
  }

  if (!items.length || !products.length) {
    return (
      <div className="container-site pb-24">
        <div className="border border-line bg-surface px-6 py-16 text-center">
          <IconHeart size={36} className="mx-auto text-gold-text" />
          <h2 className="t-h3 mt-5">Nothing saved yet</h2>
          <p className="mx-auto mt-3 max-w-md text-taupe">Tap the heart on any piece to save it here. Your list stays on this device.</p>
          <Link href="/shop" className="btn btn-primary mt-8">
            Browse the collection <IconArrowRight size={16} className="btn-icon" />
          </Link>
        </div>
      </div>
    )
  }

  const rows = products.map((p) => {
    const saved = items.find((i) => i.id === p.id)
    const selection = saved?.selection ?? {}
    const lines = selectionLines(p.options, selection)
    const pricing = computePrice({ price: p.price, sale_price: p.sale_price }, p.offer, selectionDelta(p.options, selection))
    const query = new URLSearchParams()
    for (const g of p.options) {
      const v = g.values.find((x) => x.id === selection[g.id])
      if (v) query.set(slugify(g.name), slugify(v.label))
    }
    const qs = query.toString()
    return { p, lines, pricing, url: `${siteUrl}/products/${p.slug}${qs ? `?${qs}` : ''}` }
  })
  const total = rows.reduce((s, r) => s + (r.p.priceOnRequest ? 0 : r.pricing.final), 0)
  const href = whatsappLink(
    whatsappNumber,
    buildListMessage(rows.map((r) => ({ name: r.p.name, options: r.lines, price: r.p.priceOnRequest ? null : r.pricing.final, url: r.url }))),
  )

  return (
    <div className="container-site pb-28 lg:pb-32">
      <div className="grid gap-10 lg:grid-cols-12">
        <ul className="divide-y divide-line border-y border-line lg:col-span-8">
          <AnimatePresence initial={false}>
            {rows.map(({ p, lines, pricing }) => (
              <m.li
                key={p.id}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="flex gap-4 overflow-hidden py-5 sm:gap-6"
              >
                <Link href={`/products/${p.slug}`} className="relative size-24 shrink-0 overflow-hidden bg-beige-soft sm:size-32">
                  <SmartImage asset={p.image} fill sizes="128px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  {p.categoryName && <p className="t-eyebrow text-[0.65rem] text-taupe">{p.categoryName}</p>}
                  <Link href={`/products/${p.slug}`} className="mt-1 block font-serif text-[1.25rem] leading-tight text-walnut">
                    {p.name}
                  </Link>
                  {lines.length > 0 && <p className="mt-1.5 text-[0.82rem] text-taupe">{lines.map((l) => `${l.name}: ${l.value}`).join(' · ')}</p>}
                  <Price pricing={pricing} onRequest={p.priceOnRequest} className="mt-2" />
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="grid size-10 shrink-0 place-items-center self-start text-taupe transition-colors hover:text-walnut"
                  aria-label={`Remove ${p.name}`}
                >
                  <IconClose size={18} />
                </button>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
        <aside className="lg:col-span-4">
          <div className="border border-line bg-surface p-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:p-8">
            <p className="t-label text-[0.72rem] text-walnut">Summary</p>
            <p className="mt-4 flex items-baseline justify-between text-taupe">
              {rows.length} {rows.length === 1 ? 'piece' : 'pieces'}
              <span className="tabular text-[1.4rem] text-walnut">{formatPKR(total)}</span>
            </p>
            <p className="mt-2 text-[0.82rem] text-taupe">Estimated total. We will confirm prices, availability and delivery on WhatsApp.</p>
            {href && (
              <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('wishlist', { value: total })} className="btn btn-primary btn-lg mt-6 w-full">
                <IconWhatsApp size={18} /> Send my list on WhatsApp
              </a>
            )}
            <button type="button" onClick={clear} className="link-u mt-5 text-[0.85rem] text-taupe hover:text-walnut">
              Clear wishlist
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
