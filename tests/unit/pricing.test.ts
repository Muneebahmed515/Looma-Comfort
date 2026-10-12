import { describe, expect, it } from 'vitest'
import { applyDiscount, computePrice, defaultSelection, isOfferLive, minOptionDelta, offerCovers, pickBestOffer, selectionDelta } from '@/lib/pricing'
import type { OfferRow, OptionGroup } from '@/lib/types'

const offer = (o: Partial<OfferRow>): OfferRow => ({
  id: 'o1',
  name: 'Offer',
  badge: 'Sale',
  discount_type: 'percent',
  discount_value: 10,
  scope: 'all',
  category_ids: [],
  collection_ids: [],
  product_ids: [],
  starts_at: null,
  ends_at: null,
  is_active: true,
  priority: 0,
  ...o,
})

const NOW = Date.parse('2026-10-12T12:00:00Z')

describe('offers', () => {
  it('respects start and end times', () => {
    expect(isOfferLive(offer({}), NOW)).toBe(true)
    expect(isOfferLive(offer({ is_active: false }), NOW)).toBe(false)
    expect(isOfferLive(offer({ starts_at: '2026-10-13T00:00:00Z' }), NOW)).toBe(false)
    expect(isOfferLive(offer({ ends_at: '2026-10-12T11:59:00Z' }), NOW)).toBe(false)
    expect(isOfferLive(offer({ starts_at: '2026-10-01T00:00:00Z', ends_at: '2026-10-31T00:00:00Z' }), NOW)).toBe(true)
  })

  it('covers products by scope, including parent categories', () => {
    const product = { id: 'p1', collection_ids: ['c1'] }
    expect(offerCovers(offer({ scope: 'categories', category_ids: ['tables'] }), product, ['coffee-tables', 'tables'])).toBe(true)
    expect(offerCovers(offer({ scope: 'categories', category_ids: ['sofas'] }), product, ['coffee-tables', 'tables'])).toBe(false)
    expect(offerCovers(offer({ scope: 'collections', collection_ids: ['c1'] }), product, [])).toBe(true)
    expect(offerCovers(offer({ scope: 'products', product_ids: ['p1'] }), product, [])).toBe(true)
  })

  it('applies percentage and fixed discounts, never below zero', () => {
    expect(applyDiscount(45499, { discount_type: 'percent', discount_value: 15 })).toBe(38674)
    expect(applyDiscount(10000, { discount_type: 'fixed', discount_value: 2500 })).toBe(7500)
    expect(applyDiscount(1000, { discount_type: 'fixed', discount_value: 5000 })).toBe(0)
  })

  it('picks the offer with the lowest price', () => {
    const best = pickBestOffer({ id: 'p1', price: 100000, collection_ids: [] }, [], [offer({ id: 'a', discount_value: 10 }), offer({ id: 'b', discount_value: 20 })], NOW)
    expect(best?.id).toBe('b')
  })
})

describe('computePrice', () => {
  it('uses the lowest of manual sale price and offer, without stacking', () => {
    const o = { id: 'o', name: 'x', badge: null, discount_type: 'percent' as const, discount_value: 10, ends_at: null }
    expect(computePrice({ price: 100000, sale_price: 85000 }, o).final).toBe(85000)
    expect(computePrice({ price: 100000, sale_price: 95000 }, o).final).toBe(90000)
    expect(computePrice({ price: 100000, sale_price: null }, null)).toMatchObject({ final: 100000, sale: null, discountPercent: 0 })
  })

  it('adds option extras to regular and sale prices', () => {
    const r = computePrice({ price: 45499, sale_price: 40000 }, null, 6000)
    expect(r.regular).toBe(51499)
    expect(r.final).toBe(46000)
    expect(r.discountPercent).toBe(11)
  })

  it('ignores a sale price that is not lower than the price', () => {
    expect(computePrice({ price: 100, sale_price: 100 }, null).sale).toBeNull()
  })
})

describe('options', () => {
  const groups: OptionGroup[] = [
    { id: 'size', name: 'Size', display: 'buttons', values: [{ id: 's1', label: 'Queen', price_delta: 0 }, { id: 's2', label: 'King', price_delta: 20000, is_default: true }] },
    { id: 'fin', name: 'Finish', display: 'swatches', values: [{ id: 'f1', label: 'Natural', price_delta: 0, is_available: false }, { id: 'f2', label: 'Walnut', price_delta: 3000 }] },
  ]
  it('selects defaults, skipping unavailable values', () => {
    expect(defaultSelection(groups)).toEqual({ size: 's2', fin: 'f2' })
  })
  it('sums option extras', () => {
    expect(selectionDelta(groups, { size: 's2', fin: 'f2' })).toBe(23000)
    expect(minOptionDelta(groups)).toBe(3000)
  })
})
