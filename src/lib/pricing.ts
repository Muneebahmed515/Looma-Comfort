import type { OfferRow, OptionGroup, ProductRow } from './types'

/** The subset of an offer the browser needs to price option changes. */
export interface AppliedOffer {
  id: string
  name: string
  badge: string | null
  discount_type: OfferRow['discount_type']
  discount_value: number
  ends_at: string | null
}

export interface PriceResult {
  /** Regular price including option extras. */
  regular: number
  /** Discounted price, or null when nothing applies. */
  sale: number | null
  /** What the customer pays. */
  final: number
  discountPercent: number
  source: 'manual' | 'offer' | null
}

export type Selection = Record<string, string>

export function isOfferLive(offer: Pick<OfferRow, 'is_active' | 'starts_at' | 'ends_at'>, now: number): boolean {
  if (!offer.is_active) return false
  if (offer.starts_at && Date.parse(offer.starts_at) > now) return false
  if (offer.ends_at && Date.parse(offer.ends_at) <= now) return false
  return true
}

/**
 * Whether an offer covers a product. `categoryIds` should contain the product's
 * category and its parents, so an offer on "Tables" also covers "Coffee Tables".
 */
export function offerCovers(
  offer: Pick<OfferRow, 'scope' | 'category_ids' | 'collection_ids' | 'product_ids'>,
  product: Pick<ProductRow, 'id' | 'collection_ids'>,
  categoryIds: string[],
): boolean {
  switch (offer.scope) {
    case 'all':
      return true
    case 'products':
      return offer.product_ids.includes(product.id)
    case 'categories':
      return offer.category_ids.some((id) => categoryIds.includes(id))
    case 'collections':
      return offer.collection_ids.some((id) => product.collection_ids.includes(id))
    default:
      return false
  }
}

export function applyDiscount(amount: number, offer: Pick<OfferRow, 'discount_type' | 'discount_value'>): number {
  const value = Math.max(0, offer.discount_value)
  if (offer.discount_type === 'percent') {
    return Math.max(0, Math.round(amount * (1 - Math.min(value, 95) / 100)))
  }
  return Math.max(0, Math.round(amount - value))
}

/** Picks the live offer that gives the lowest price; ties go to the higher priority. */
export function pickBestOffer(
  product: Pick<ProductRow, 'id' | 'price' | 'collection_ids'>,
  categoryIds: string[],
  offers: OfferRow[],
  now: number,
): AppliedOffer | null {
  let best: OfferRow | null = null
  let bestPrice = Infinity
  for (const offer of offers) {
    if (!isOfferLive(offer, now) || !offerCovers(offer, product, categoryIds)) continue
    const p = applyDiscount(product.price, offer)
    if (p < bestPrice || (p === bestPrice && best && offer.priority > best.priority)) {
      best = offer
      bestPrice = p
    }
  }
  if (!best || bestPrice >= product.price) return null
  return {
    id: best.id,
    name: best.name,
    badge: best.badge,
    discount_type: best.discount_type,
    discount_value: best.discount_value,
    ends_at: best.ends_at,
  }
}

/**
 * Price for a product with option extras applied.
 * Manual sale prices get the same option extras added; percentage offers apply to the
 * option-adjusted total. The lowest valid price wins and offers never stack.
 */
export function computePrice(
  product: Pick<ProductRow, 'price' | 'sale_price'>,
  offer: AppliedOffer | null,
  optionDelta = 0,
): PriceResult {
  const regular = product.price + optionDelta
  const candidates: { price: number; source: 'manual' | 'offer' }[] = []
  if (product.sale_price != null && product.sale_price > 0 && product.sale_price < product.price) {
    candidates.push({ price: product.sale_price + optionDelta, source: 'manual' })
  }
  if (offer) candidates.push({ price: applyDiscount(regular, offer), source: 'offer' })
  const best = candidates.filter((c) => c.price < regular).sort((a, b) => a.price - b.price)[0]
  if (!best) return { regular, sale: null, final: regular, discountPercent: 0, source: null }
  return {
    regular,
    sale: best.price,
    final: best.price,
    discountPercent: Math.round(((regular - best.price) / regular) * 100),
    source: best.source,
  }
}

export function defaultSelection(options: OptionGroup[]): Selection {
  const sel: Selection = {}
  for (const g of options) {
    const available = g.values.filter((v) => v.is_available !== false)
    const v = available.find((x) => x.is_default) ?? available[0] ?? g.values[0]
    if (v) sel[g.id] = v.id
  }
  return sel
}

export function selectionDelta(options: OptionGroup[], selection: Selection): number {
  let sum = 0
  for (const g of options) {
    const v = g.values.find((x) => x.id === selection[g.id])
    if (v) sum += v.price_delta || 0
  }
  return sum
}

/** "Size: 3-Seater, Fabric: Tan" style lines for the WhatsApp message. */
export function selectionLines(options: OptionGroup[], selection: Selection): { name: string; value: string }[] {
  const lines: { name: string; value: string }[] = []
  for (const g of options) {
    const v = g.values.find((x) => x.id === selection[g.id])
    if (v) lines.push({ name: g.name, value: v.label })
  }
  return lines
}

/** Lowest possible price across options, for "From Rs. X" on cards. */
export function minOptionDelta(options: OptionGroup[]): number {
  return options.reduce((sum, g) => {
    const deltas = g.values.filter((v) => v.is_available !== false).map((v) => v.price_delta || 0)
    return sum + (deltas.length ? Math.min(...deltas) : 0)
  }, 0)
}

export function hasPriceVariants(options: OptionGroup[]): boolean {
  return options.some((g) => new Set(g.values.map((v) => v.price_delta || 0)).size > 1)
}
