'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { IconCash, IconMinus, IconPlus, IconSeal, IconTruck, IconWhatsApp } from '@/components/icons'
import { WishlistButton } from '@/components/catalog/wishlist-button'
import { WhatsAppLink } from '@/components/site/whatsapp-link'
import { cn } from '@/lib/cn'
import { formatDayMonth, formatPKR } from '@/lib/format'
import { computePrice, selectionDelta, selectionLines } from '@/lib/pricing'
import { buildAvailabilityMessage, buildOrderMessage, buildQuestionMessage, whatsappLink } from '@/lib/whatsapp'
import { optionQuery, useProduct } from './product-context'
import { ShareButtons } from './share-buttons'

interface PurchaseProps {
  whatsappNumber: string | null
  orderTemplate: string
  replyNote: string | null
  rating: { average: number; count: number } | null
}

function PriceDisplay({ final, regular, sale, percent, large }: { final: number; regular: number; sale: boolean; percent: number; large?: boolean }) {
  return (
    <div className="tabular flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <m.span
        key={final}
        initial={{ opacity: 0.25, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('font-medium text-walnut', large ? 'text-[1.75rem] leading-none lg:text-[2rem]' : 'text-[1.05rem]')}
      >
        {formatPKR(final)}
      </m.span>
      {sale && (
        <>
          <s className={cn('text-taupe decoration-taupe/60', large ? 'text-[1.05rem]' : 'text-[0.8rem]')}>{formatPKR(regular)}</s>
          {large && <span className="t-label rounded-[2px] bg-walnut px-2 py-1 text-[0.66rem] text-ivory">Save {percent}%</span>}
        </>
      )}
    </div>
  )
}

export function ProductPurchase({ whatsappNumber, orderTemplate, replyNote, rating }: PurchaseProps) {
  const { product, selection, select, quantity, setQuantity } = useProduct()
  const ctaRef = useRef<HTMLDivElement>(null)
  const [showBar, setShowBar] = useState(false)

  const delta = selectionDelta(product.options, selection)
  const price = computePrice({ price: product.price, sale_price: product.sale_price }, product.offer, delta)
  const lines = selectionLines(product.options, selection)
  const url = `${product.url}${optionQuery(product.options, selection)}`
  const soldOut = product.stock === 'out_of_stock'

  const orderText = buildOrderMessage({
    template: orderTemplate,
    productName: product.name,
    sku: product.sku,
    options: lines,
    quantity,
    unitPrice: product.priceOnRequest ? null : price.final,
    regularUnitPrice: price.sale ? price.regular : null,
    url,
  })
  const orderHref = whatsappLink(whatsappNumber, soldOut ? buildAvailabilityMessage(product.name, url) : orderText)
  const questionHref = whatsappLink(whatsappNumber, buildQuestionMessage(product.name, url))
  const ctaLabel = soldOut ? 'Ask about availability' : product.priceOnRequest ? 'Ask for price on WhatsApp' : 'Order on WhatsApp'

  // Sticky order bar on phones once the main button scrolls out of view.
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry!.isIntersecting && entry!.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const stockLine =
    product.stock === 'in_stock'
      ? { dot: 'bg-success', text: product.leadTime ? `In stock · ${product.leadTime}` : 'In stock' }
      : product.stock === 'made_to_order'
        ? { dot: 'bg-gold', text: product.leadTime ?? 'Made to order' }
        : { dot: 'bg-taupe', text: 'Currently unavailable. Message us to reserve the next one.' }

  return (
    <div>
      {product.categoryName && product.categorySlug && (
        <Link href={`/shop/${product.categorySlug}`} className="t-eyebrow link-u anim-fade text-gold-text">
          {product.categoryName}
        </Link>
      )}
      <h1 className="anim-rise mt-3 font-serif text-[2.1rem] leading-[1.08] font-medium text-walnut sm:text-[2.5rem] lg:text-[2.85rem]" style={{ ['--d' as string]: '0.05s' }}>
        {product.name}
      </h1>
      {rating && rating.count > 0 && (
        <a href="#reviews" className="anim-fade mt-3 inline-flex items-center gap-2 text-[0.85rem] text-taupe hover:text-walnut">
          <span className="text-gold">{'★'.repeat(Math.round(rating.average))}</span>
          <span className="tabular">
            {rating.average.toFixed(1)} · {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
          </span>
        </a>
      )}

      <div className="anim-rise mt-6" style={{ ['--d' as string]: '0.12s' }}>
        {product.priceOnRequest ? (
          <p className="text-[1.5rem] text-walnut">Price on request</p>
        ) : (
          <PriceDisplay final={price.final} regular={price.regular} sale={Boolean(price.sale)} percent={price.discountPercent} large />
        )}
        {product.offer && price.source === 'offer' && (
          <p className="mt-3 text-[0.85rem] text-gold-text">
            {product.offer.badge ?? product.offer.name}
            {product.offer.ends_at ? ` · offer ends ${formatDayMonth(product.offer.ends_at)}` : ''}
          </p>
        )}
        <p className="mt-2 text-[0.8rem] text-taupe">Free delivery to major cities · Pay cash on delivery</p>
      </div>

      {/* Options */}
      {product.options.length > 0 && (
        <div className="anim-rise mt-8 space-y-6" style={{ ['--d' as string]: '0.18s' }}>
          {product.options.map((g) => {
            const chosen = g.values.find((v) => v.id === selection[g.id])
            return (
              <fieldset key={g.id}>
                <legend className="mb-3 text-[0.88rem] text-taupe">
                  <span className="t-label mr-2 text-[0.72rem] text-walnut">{g.name}</span>
                  {chosen?.label}
                </legend>
                {g.display === 'dropdown' ? (
                  <select
                    value={selection[g.id] ?? ''}
                    onChange={(e) => select(g.id, e.target.value)}
                    className="h-12 w-full rounded-[2px] border border-line-strong bg-surface px-4 text-walnut focus:border-walnut focus:outline-none"
                  >
                    {g.values.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.is_available === false}>
                        {v.label}
                        {v.price_delta ? ` (+${formatPKR(v.price_delta)})` : ''}
                      </option>
                    ))}
                  </select>
                ) : g.display === 'swatches' ? (
                  <div className="flex flex-wrap gap-3">
                    {g.values.map((v) => {
                      const active = selection[g.id] === v.id
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => select(g.id, v.id)}
                          disabled={v.is_available === false}
                          aria-pressed={active}
                          aria-label={`${v.label}${v.price_delta ? `, adds ${formatPKR(v.price_delta)}` : ''}`}
                          title={v.label}
                          className={cn(
                            'group relative grid size-11 place-items-center rounded-full transition-shadow duration-300 disabled:opacity-30',
                            active ? 'shadow-[0_0_0_1px_var(--color-walnut)]' : 'hover:shadow-[0_0_0_1px_var(--color-line-strong)]',
                          )}
                        >
                          <span className="size-8 rounded-full border border-black/10" style={{ background: v.swatch_hex ?? '#d9cbb3' }} />
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {g.values.map((v) => {
                      const active = selection[g.id] === v.id
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => select(g.id, v.id)}
                          disabled={v.is_available === false}
                          aria-pressed={active}
                          className={cn(
                            'min-h-11 rounded-[2px] border px-4 py-2 text-left text-[0.9rem] transition-colors duration-300 disabled:opacity-35 disabled:line-through',
                            active ? 'border-walnut bg-walnut text-ivory' : 'border-line-strong text-walnut hover:border-walnut',
                          )}
                        >
                          {v.label}
                          {v.price_delta > 0 && (
                            <span className={cn('tabular ml-2 text-[0.78rem]', active ? 'text-ivory/75' : 'text-taupe')}>+{formatPKR(v.price_delta)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </fieldset>
            )
          })}
        </div>
      )}

      {/* Quantity + stock */}
      <div className="anim-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ ['--d' as string]: '0.22s' }}>
        {!soldOut && (
          <div className="flex items-center border border-line-strong" role="group" aria-label="Quantity">
            <button type="button" onClick={() => setQuantity(quantity - 1)} disabled={quantity <= 1} className="grid size-11 place-items-center text-walnut disabled:opacity-30" aria-label="Decrease quantity">
              <IconMinus size={16} />
            </button>
            <span className="tabular w-8 text-center text-[0.95rem] text-walnut" aria-live="polite">
              {quantity}
            </span>
            <button type="button" onClick={() => setQuantity(quantity + 1)} className="grid size-11 place-items-center text-walnut" aria-label="Increase quantity">
              <IconPlus size={16} />
            </button>
          </div>
        )}
        <p className="flex items-center gap-2.5 text-[0.88rem] text-walnut">
          <span className={cn('size-2 rounded-full', stockLine.dot)} aria-hidden />
          {stockLine.text}
        </p>
      </div>

      {/* Primary CTA */}
      <div ref={ctaRef} className="anim-rise mt-8 flex gap-3" style={{ ['--d' as string]: '0.26s' }}>
        <WhatsAppLink
          href={orderHref}
          context={soldOut ? 'question' : 'product'}
          productId={product.id}
          productName={product.name}
          value={product.priceOnRequest ? undefined : price.final * quantity}
          className="btn btn-primary btn-lg flex-1"
        >
          <IconWhatsApp size={20} className="btn-icon" />
          {ctaLabel}
        </WhatsAppLink>
        <WishlistButton productId={product.id} productName={product.name} selection={selection} variant="outline" />
      </div>
      {!soldOut && !product.priceOnRequest && quantity > 1 && (
        <p className="tabular mt-3 text-[0.85rem] text-taupe">
          {quantity} × {formatPKR(price.final)} = <span className="text-walnut">{formatPKR(price.final * quantity)}</span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.85rem]">
        <WhatsAppLink href={questionHref} context="question" productId={product.id} className="link-u text-walnut">
          Ask a question about this piece
        </WhatsAppLink>
        {replyNote && <span className="text-taupe">{replyNote}</span>}
      </div>

      {/* Trust */}
      <ul className="mt-8 grid grid-cols-3 gap-3 border-y border-line py-5 text-center text-[0.76rem] leading-snug text-taupe-deep">
        <li className="flex flex-col items-center gap-2">
          <IconCash size={24} className="text-gold-text" /> Cash on delivery
        </li>
        <li className="flex flex-col items-center gap-2">
          <IconSeal size={24} className="text-gold-text" /> Inspect before you pay
        </li>
        <li className="flex flex-col items-center gap-2">
          <IconTruck size={24} className="text-gold-text" /> Free delivery
        </li>
      </ul>

      <div className="mt-6">
        <ShareButtons url={product.url} title={product.name} />
      </div>

      {/* Mobile sticky order bar */}
      <AnimatePresence>
        {showBar && (
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/97 shadow-[0_-10px_30px_-12px_rgb(58_37_25/0.2)] lg:hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.82rem] text-taupe">{product.name}</p>
                {product.priceOnRequest ? (
                  <p className="text-[0.95rem] text-walnut">Price on request</p>
                ) : (
                  <PriceDisplay final={price.final} regular={price.regular} sale={Boolean(price.sale)} percent={price.discountPercent} />
                )}
              </div>
              <WhatsAppLink
                href={orderHref}
                context={soldOut ? 'question' : 'product'}
                productId={product.id}
                productName={product.name}
                value={product.priceOnRequest ? undefined : price.final * quantity}
                className="btn btn-primary shrink-0 px-5"
              >
                <IconWhatsApp size={18} /> {soldOut ? 'Ask' : 'Order'}
              </WhatsAppLink>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
