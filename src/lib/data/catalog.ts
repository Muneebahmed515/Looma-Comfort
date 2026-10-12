import type { StockStatus } from '../types'
import type { CatalogProduct, CategoryNode, SiteData } from './build'

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-sellers' | 'discount'

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'best-sellers', label: 'Best sellers' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
]

export const PAGE_SIZE = 24

export interface ListingFilters {
  categories: string[]
  materials: string[]
  min: number | null
  max: number | null
  sale: boolean
  stock: StockStatus[]
}

export interface ListingQuery {
  filters: ListingFilters
  sort: SortKey
  page: number
}

type Params = Record<string, string | string[] | undefined>

const list = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? v.split(',') : []).map((s) => s.trim()).filter(Boolean)

const num = (v: string | string[] | undefined): number | null => {
  const s = Array.isArray(v) ? v[0] : v
  if (!s) return null
  const n = Number(s.replace(/[^\d]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

export function parseListingParams(sp: Params, defaultSort: SortKey = 'featured'): ListingQuery {
  const sortRaw = (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) as SortKey | undefined
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw) ? sortRaw! : defaultSort
  const page = Math.max(1, Math.min(50, num(sp.page) ?? 1))
  const stock = list(sp.stock).filter((s): s is StockStatus => ['in_stock', 'made_to_order', 'out_of_stock'].includes(s))
  return {
    filters: {
      categories: list(sp.category),
      materials: list(sp.material),
      min: num(sp.min),
      max: num(sp.max),
      sale: (Array.isArray(sp.sale) ? sp.sale[0] : sp.sale) === '1',
      stock,
    },
    sort,
    page,
  }
}

export function activeFilterCount(f: ListingFilters): number {
  return f.categories.length + f.materials.length + (f.min || f.max ? 1 : 0) + (f.sale ? 1 : 0) + f.stock.length
}

export function applyFilters(products: CatalogProduct[], f: ListingFilters, data: Pick<SiteData, 'categories' | 'materials'>) {
  const catIds = f.categories
    .map((slug) => data.categories.find((c) => c.slug === slug)?.id)
    .filter((x): x is string => Boolean(x))
  const matIds = f.materials
    .map((slug) => data.materials.find((m) => m.slug === slug)?.id)
    .filter((x): x is string => Boolean(x))
  return products.filter((p) => {
    if (catIds.length && !catIds.some((id) => p.categoryIds.includes(id))) return false
    if (matIds.length && !matIds.some((id) => p.material_ids.includes(id))) return false
    if (f.min != null && (p.price_on_request || p.pricing.final < f.min)) return false
    if (f.max != null && (p.price_on_request || p.pricing.final > f.max)) return false
    if (f.sale && !p.pricing.sale) return false
    if (f.stock.length && !f.stock.includes(p.stock_status)) return false
    return true
  })
}

export function sortProducts(products: CatalogProduct[], sort: SortKey): CatalogProduct[] {
  const arr = [...products]
  const price = (p: CatalogProduct) => (p.price_on_request ? Infinity : p.pricing.final)
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => (b.published_at ?? b.created_at).localeCompare(a.published_at ?? a.created_at))
    case 'price-asc':
      return arr.sort((a, b) => price(a) - price(b))
    case 'price-desc':
      return arr.sort((a, b) => (b.price_on_request ? -1 : price(b)) - (a.price_on_request ? -1 : price(a)))
    case 'best-sellers':
      return arr.sort((a, b) => Number(b.is_best_seller) - Number(a.is_best_seller) || b.order_clicks - a.order_clicks)
    case 'discount':
      return arr.sort((a, b) => b.pricing.discountPercent - a.pricing.discountPercent || a.sort_order - b.sort_order)
    default:
      return arr.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order)
  }
}

export interface Facets {
  categories: { slug: string; name: string; count: number; depth: number }[]
  materials: { slug: string; name: string; count: number }[]
  priceMin: number
  priceMax: number
  saleCount: number
  stock: { value: StockStatus; label: string; count: number }[]
}

export function buildFacets(products: CatalogProduct[], data: Pick<SiteData, 'categories' | 'materials'>, scope?: CategoryNode): Facets {
  const cats = scope ? data.categories.filter((c) => c.parent_id === scope.id) : data.categories
  const ordered: { slug: string; name: string; count: number; depth: number }[] = []
  const add = (c: CategoryNode, depth: number) => {
    const count = products.filter((p) => p.categoryIds.includes(c.id)).length
    if (count) ordered.push({ slug: c.slug, name: c.name, count, depth })
  }
  if (scope) cats.forEach((c) => add(c, 0))
  else
    data.categories
      .filter((c) => !c.parent_id)
      .forEach((parent) => {
        add(parent, 0)
        data.categories.filter((c) => c.parent_id === parent.id).forEach((c) => add(c, 1))
      })
  const prices = products.filter((p) => !p.price_on_request).map((p) => p.pricing.final)
  return {
    categories: ordered,
    materials: data.materials
      .map((m) => ({ slug: m.slug, name: m.name, count: products.filter((p) => p.material_ids.includes(m.id)).length }))
      .filter((m) => m.count > 0),
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 0,
    saleCount: products.filter((p) => p.pricing.sale).length,
    stock: (
      [
        ['in_stock', 'In stock'],
        ['made_to_order', 'Made to order'],
      ] as const
    )
      .map(([value, label]) => ({ value, label, count: products.filter((p) => p.stock_status === value).length }))
      .filter((s) => s.count > 0),
  }
}

/** Builds a listing URL with updated params; empty values are removed. */
export function listingHref(pathname: string, current: Params, patch: Record<string, string | string[] | null>): string {
  const sp = new URLSearchParams()
  const merged: Record<string, string | string[] | undefined | null> = { ...current, ...patch }
  for (const [k, v] of Object.entries(merged)) {
    if (v == null) continue
    const value = Array.isArray(v) ? v.join(',') : v
    if (value !== '') sp.set(k, value)
  }
  if (!('page' in patch)) sp.delete('page')
  const qs = sp.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

// ---------------------------------------------------------------- search

export function normalizeText(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function applySynonyms(q: string, synonyms: Record<string, string>): string {
  let out = ` ${q} `
  for (const [from, to] of Object.entries(synonyms)) {
    const f = normalizeText(from)
    if (!f) continue
    out = out.replace(new RegExp(`\\s${f.replace(/\s+/g, '\\s+')}\\s`, 'g'), ` ${normalizeText(to)} `)
  }
  return out.trim()
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]!
    prev[0] = i
    let rowMin = prev[0]
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j]!
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = temp
      rowMin = Math.min(rowMin, prev[j]!)
    }
    if (rowMin > max) return max + 1
  }
  return prev[b.length]!
}

function tokenScore(token: string, words: string[]): number {
  let best = 0
  for (const w of words) {
    if (w === token) return 1
    if (w.startsWith(token) && token.length >= 2) best = Math.max(best, 0.8)
    else if (token.length >= 4) {
      const allowed = token.length >= 7 ? 2 : 1
      const d = editDistance(token, w.slice(0, token.length + allowed), allowed)
      if (d <= allowed) best = Math.max(best, 0.6)
    }
  }
  return best
}

export function searchProducts(products: CatalogProduct[], query: string, synonyms: Record<string, string> = {}): CatalogProduct[] {
  const q = applySynonyms(normalizeText(query), synonyms)
  const tokens = q.split(' ').filter((t) => t.length > 1 || /\d/.test(t))
  if (!tokens.length) return []
  const scored = products.map((p) => {
    const fields: [string[], number][] = [
      [normalizeText(p.name).split(' '), 5],
      [normalizeText(`${p.category?.name ?? ''} ${p.parentCategory?.name ?? ''}`).split(' '), 3],
      [normalizeText(p.tags.join(' ')).split(' '), 3],
      [normalizeText(p.materialNames.join(' ')).split(' '), 2],
      [normalizeText(p.sku ?? '').split(' '), 4],
      [normalizeText(p.short_description ?? '').split(' '), 1],
    ]
    let total = 0
    let matched = 0
    for (const t of tokens) {
      let best = 0
      for (const [words, weight] of fields) best = Math.max(best, tokenScore(t, words) * weight)
      if (best > 0) matched++
      total += best
    }
    return { p, total, all: matched === tokens.length }
  })
  const strict = scored.filter((s) => s.all && s.total > 0)
  const pool = strict.length ? strict : scored.filter((s) => s.total >= 2)
  return pool.sort((a, b) => b.total - a.total || b.p.order_clicks - a.p.order_clicks).map((s) => s.p)
}

export function relatedProducts(product: CatalogProduct, all: CatalogProduct[], limit = 8): CatalogProduct[] {
  const manual = product.related_ids.map((id) => all.find((p) => p.id === id)).filter((p): p is CatalogProduct => Boolean(p))
  const rest = all
    .filter((p) => p.id !== product.id && !manual.some((m) => m.id === p.id))
    .map((p) => {
      let score = 0
      if (p.category_id === product.category_id) score += 5
      else if (p.categoryIds.some((id) => product.categoryIds.includes(id))) score += 2
      score += p.tags.filter((t) => product.tags.includes(t)).length
      score += p.collection_ids.filter((c) => product.collection_ids.includes(c)).length * 2
      score += p.material_ids.filter((m) => product.material_ids.includes(m)).length * 0.5
      return { p, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.order_clicks - a.p.order_clicks)
    .map((x) => x.p)
  return [...manual, ...rest].slice(0, limit)
}
