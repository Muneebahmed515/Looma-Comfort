import { computePrice, hasPriceVariants, isOfferLive, minOptionDelta, pickBestOffer, type AppliedOffer, type PriceResult } from '../pricing'
import type {
  AnnouncementRow,
  CategoryRow,
  CollectionRow,
  FaqRow,
  HeroSlideRow,
  HomeSectionRow,
  ImageAsset,
  MaterialRow,
  OfferRow,
  PageRow,
  ProductRow,
  PromoBannerRow,
  ReviewRow,
  SettingsRow,
  SiteRows,
} from '../types'

export interface CategoryNode extends CategoryRow {
  parentSlug: string | null
  childIds: string[]
  /** Visible products in this category and its children. */
  productCount: number
}

export interface CatalogProduct extends ProductRow {
  category: { id: string; name: string; slug: string } | null
  parentCategory: { id: string; name: string; slug: string } | null
  /** Category and its ancestors, used for filtering and offers. */
  categoryIds: string[]
  offer: AppliedOffer | null
  /** Price at the cheapest option combination. */
  pricing: PriceResult
  fromPrice: boolean
  materialNames: string[]
  reviewCount: number
  ratingAverage: number | null
}

/** Lean shape sent to product cards and client components. */
export interface ProductCardData {
  id: string
  name: string
  slug: string
  categoryName: string | null
  image: ImageAsset | null
  altImage: ImageAsset | null
  pricing: PriceResult
  fromPrice: boolean
  priceOnRequest: boolean
  stock: ProductRow['stock_status']
  isNew: boolean
  isBestSeller: boolean
  offerBadge: string | null
}

export interface SiteData {
  settings: SettingsRow
  categories: CategoryNode[]
  materials: MaterialRow[]
  collections: CollectionRow[]
  products: CatalogProduct[]
  liveOffers: OfferRow[]
  announcements: AnnouncementRow[]
  heroSlides: HeroSlideRow[]
  promos: PromoBannerRow[]
  homeSections: HomeSectionRow[]
  reviews: ReviewRow[]
  pages: PageRow[]
  faqs: FaqRow[]
  generatedAt: number
}

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

function inWindow(row: { starts_at: string | null; ends_at: string | null }, now: number): boolean {
  if (row.starts_at && Date.parse(row.starts_at) > now) return false
  if (row.ends_at && Date.parse(row.ends_at) <= now) return false
  return true
}

export function buildSiteData(rows: SiteRows, now: number): SiteData {
  const visibleCats = rows.categories.filter((c) => c.is_visible).sort(bySort)
  const catById = new Map(visibleCats.map((c) => [c.id, c]))
  const matById = new Map(rows.materials.map((m) => [m.id, m]))

  const ancestors = (id: string | null): string[] => {
    const out: string[] = []
    let cur = id ? catById.get(id) : undefined
    let guard = 0
    while (cur && guard++ < 5) {
      out.push(cur.id)
      cur = cur.parent_id ? catById.get(cur.parent_id) : undefined
    }
    return out
  }

  const approved = rows.reviews.filter((r) => r.status === 'approved')
  const reviewStats = new Map<string, { n: number; sum: number }>()
  for (const r of approved) {
    if (!r.product_id) continue
    const s = reviewStats.get(r.product_id) ?? { n: 0, sum: 0 }
    s.n++
    s.sum += r.rating
    reviewStats.set(r.product_id, s)
  }

  const liveOffers = rows.offers.filter((o) => isOfferLive(o, now))

  const products: CatalogProduct[] = rows.products
    .filter((p) => p.is_visible && (!p.category_id || catById.has(p.category_id) || !rows.categories.some((c) => c.id === p.category_id)))
    .map((p) => {
      const cat = p.category_id ? catById.get(p.category_id) : undefined
      const parent = cat?.parent_id ? catById.get(cat.parent_id) : undefined
      const categoryIds = ancestors(p.category_id)
      const offer = p.price_on_request ? null : pickBestOffer(p, categoryIds, liveOffers, now)
      const stats = reviewStats.get(p.id)
      return {
        ...p,
        images: p.images ?? [],
        options: p.options ?? [],
        specifications: p.specifications ?? [],
        material_ids: p.material_ids ?? [],
        collection_ids: p.collection_ids ?? [],
        related_ids: p.related_ids ?? [],
        tags: p.tags ?? [],
        category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
        parentCategory: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
        categoryIds,
        offer,
        pricing: computePrice(p, offer, minOptionDelta(p.options ?? [])),
        fromPrice: hasPriceVariants(p.options ?? []),
        materialNames: (p.material_ids ?? []).map((id) => matById.get(id)?.name).filter((x): x is string => Boolean(x)),
        reviewCount: stats?.n ?? 0,
        ratingAverage: stats ? Math.round((stats.sum / stats.n) * 10) / 10 : null,
      }
    })
    .sort(bySort)

  const categories: CategoryNode[] = visibleCats.map((c) => {
    const childIds = visibleCats.filter((x) => x.parent_id === c.id).map((x) => x.id)
    return {
      ...c,
      parentSlug: c.parent_id ? (catById.get(c.parent_id)?.slug ?? null) : null,
      childIds,
      productCount: products.filter((p) => p.categoryIds.includes(c.id)).length,
    }
  })

  return {
    settings: rows.settings,
    categories,
    materials: [...rows.materials].sort(bySort),
    collections: rows.collections.filter((c) => c.is_visible).sort(bySort),
    products,
    liveOffers,
    announcements: rows.announcements.filter((a) => a.is_active && inWindow(a, now)).sort(bySort),
    heroSlides: rows.hero_slides.filter((s) => s.is_active && inWindow(s, now)).sort(bySort),
    promos: rows.promo_banners.filter((b) => b.is_active && inWindow(b, now)).sort(bySort),
    homeSections: rows.home_sections.filter((s) => s.is_visible).sort(bySort),
    reviews: approved.sort((a, b) => (b.review_date ?? b.created_at).localeCompare(a.review_date ?? a.created_at)),
    pages: rows.pages,
    faqs: rows.faqs.filter((f) => f.is_visible).sort(bySort),
    generatedAt: now,
  }
}

/** Image without its blur preview, for places that don't show one (keeps pages light). */
export function lean(asset: ImageAsset | null | undefined): ImageAsset | null {
  return asset ? { ref: asset.ref, alt: asset.alt, w: asset.w, h: asset.h } : null
}

export function toCard(p: CatalogProduct): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    categoryName: p.category?.name ?? null,
    image: lean(p.images[0]),
    altImage: lean(p.images[1]),
    pricing: p.pricing,
    fromPrice: p.fromPrice,
    priceOnRequest: p.price_on_request,
    stock: p.stock_status,
    isNew: p.is_new_arrival,
    isBestSeller: p.is_best_seller,
    offerBadge: p.offer?.badge ?? null,
  }
}
