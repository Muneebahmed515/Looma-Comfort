import type { HomeSectionSettings } from '../types'
import type { CatalogProduct } from './build'
import { sortProducts } from './catalog'

export function bestSellers(all: CatalogProduct[]): CatalogProduct[] {
  const flagged = sortProducts(all.filter((p) => p.is_best_seller), 'best-sellers')
  return flagged.length ? flagged : sortProducts(all, 'best-sellers')
}

/** Flagged new arrivals first, then the most recently added pieces. */
export function newArrivals(all: CatalogProduct[]): CatalogProduct[] {
  const flagged = sortProducts(all.filter((p) => p.is_new_arrival), 'newest')
  const rest = sortProducts(all.filter((p) => !p.is_new_arrival), 'newest')
  return [...flagged, ...rest]
}

export function onSale(all: CatalogProduct[]): CatalogProduct[] {
  return sortProducts(all.filter((p) => p.pricing.sale), 'discount')
}

/** Products for a homepage section, based on its "source" setting. */
export function productsForSection(settings: HomeSectionSettings, all: CatalogProduct[]): CatalogProduct[] {
  const limit = Math.min(Math.max(settings.limit ?? 8, 1), 24)
  let list: CatalogProduct[]
  switch (settings.source) {
    case 'new_arrivals':
      list = newArrivals(all)
      break
    case 'featured':
      list = sortProducts(all.filter((p) => p.is_featured), 'featured')
      break
    case 'sale':
      list = onSale(all)
      break
    case 'category':
      list = settings.category_id ? sortProducts(all.filter((p) => p.categoryIds.includes(settings.category_id!)), 'featured') : []
      break
    case 'manual':
      list = (settings.product_ids ?? []).map((id) => all.find((p) => p.id === id)).filter((p): p is CatalogProduct => Boolean(p))
      break
    case 'best_sellers':
    default:
      list = bestSellers(all)
  }
  return list.slice(0, limit)
}
