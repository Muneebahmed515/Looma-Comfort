import { describe, expect, it } from 'vitest'
import { buildSiteData } from '@/lib/data/build'
import { applyFilters, listingHref, parseListingParams, relatedProducts, searchProducts, sortProducts } from '@/lib/data/catalog'
import { productsForSection } from '@/lib/data/sections'
import { demoRows } from '@/lib/demo/data'

const data = buildSiteData(demoRows, Date.parse('2026-10-12T12:00:00Z'))

describe('site data', () => {
  it('builds the demo catalogue', () => {
    expect(data.products.length).toBeGreaterThan(20)
    expect(data.categories.find((c) => c.slug === 'tables')?.productCount).toBeGreaterThan(3)
  })

  it('applies the live sofa offer and not the scheduled dining offer', () => {
    const sofa = data.products.find((p) => p.slug === 'maren-velvet-sofa')!
    expect(sofa.offer?.badge).toBe('White Friday')
    expect(sofa.pricing.discountPercent).toBe(15)
    const table = data.products.find((p) => p.slug === 'six-seater-sheesham-dining-table')!
    expect(table.offer).toBeNull()
  })
})

describe('listing', () => {
  it('parses and applies filters from the URL', () => {
    const q = parseListingParams({ category: 'tables', material: 'sheesham-wood', min: '20000', max: '60000', sort: 'price-asc' })
    const list = sortProducts(applyFilters(data.products, q.filters, data), q.sort)
    expect(list.length).toBeGreaterThan(0)
    for (const p of list) {
      expect(p.pricing.final).toBeGreaterThanOrEqual(20000)
      expect(p.pricing.final).toBeLessThanOrEqual(60000)
      expect(p.materialNames).toContain('Sheesham Wood')
    }
    for (let i = 1; i < list.length; i++) expect(list[i]!.pricing.final).toBeGreaterThanOrEqual(list[i - 1]!.pricing.final)
  })

  it('ignores unknown sort keys', () => {
    expect(parseListingParams({ sort: 'nope' }).sort).toBe('featured')
  })

  it('builds clean listing URLs and resets the page on filter change', () => {
    expect(listingHref('/shop', { page: '3', sort: 'newest' }, { material: ['velvet'] })).toBe('/shop?sort=newest&material=velvet')
    expect(listingHref('/shop', {}, { sale: null })).toBe('/shop')
  })
})

describe('search', () => {
  it('handles spelling variations and typos', () => {
    const syn = data.settings.search_synonyms
    expect(searchProducts(data.products, 'shisham coffee table', syn)[0]?.slug).toBe('round-sheesham-coffee-table')
    expect(searchProducts(data.products, 'leathr sofa', syn)[0]?.slug).toBe('alder-three-seater-leather-sofa')
    expect(searchProducts(data.products, 'almirah', syn).some((p) => p.slug === 'five-drawer-dresser')).toBe(true)
  })

  it('returns nothing for an empty query', () => {
    expect(searchProducts(data.products, '   ')).toEqual([])
  })
})

describe('sections + related', () => {
  it('fills homepage product sections', () => {
    expect(productsForSection({ source: 'best_sellers', limit: 4 }, data.products)).toHaveLength(4)
    expect(productsForSection({ source: 'sale', limit: 24 }, data.products).every((p) => p.pricing.sale)).toBe(true)
  })

  it('suggests related products from the same category first', () => {
    const p = data.products.find((x) => x.slug === 'maren-velvet-sofa')!
    const related = relatedProducts(p, data.products, 4)
    expect(related.length).toBe(4)
    expect(related[0]!.category_id).toBe(p.category_id)
    expect(related.some((r) => r.id === p.id)).toBe(false)
  })
})
