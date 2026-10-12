import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { IconArrowRight, IconWhatsApp } from '@/components/icons'
import { WhatsAppLink } from '@/components/site/whatsapp-link'
import { Breadcrumbs, type Crumb } from '@/components/ui/breadcrumbs'
import { toCard, type CatalogProduct, type CategoryNode, type SiteData } from '@/lib/data/build'
import { applyFilters, buildFacets, listingHref, PAGE_SIZE, parseListingParams, sortProducts, type SortKey } from '@/lib/data/catalog'
import { cn } from '@/lib/cn'
import { plural } from '@/lib/format'
import { whatsappLink } from '@/lib/whatsapp'
import { FilterPanel } from './filter-panel'
import { ListingResults, ListingShell } from './listing-shell'
import { ListingToolbar } from './listing-toolbar'
import { ProductCard } from './product-card'

type Params = Record<string, string | string[] | undefined>

export function ListingHeader({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow?: string | null
  title: string
  intro?: string | null
  crumbs: Crumb[]
  children?: ReactNode
}) {
  return (
    <header className="container-site pt-8 pb-8 lg:pt-12 lg:pb-12">
      <Breadcrumbs items={crumbs} className="anim-fade" />
      <div className="mt-8 max-w-3xl lg:mt-12">
        {eyebrow && (
          <p className="eyebrow-rule t-eyebrow anim-rise mb-4 text-gold-text" data-align="start">
            {eyebrow}
          </p>
        )}
        <h1 className="t-h1 anim-rise" style={{ ['--d' as string]: '0.05s' }}>
          {title}
        </h1>
        {intro && (
          <p className="t-lead anim-rise mt-4 max-w-2xl text-taupe" style={{ ['--d' as string]: '0.12s' }}>
            {intro}
          </p>
        )}
      </div>
      {children}
    </header>
  )
}

export function SubcategoryChips({ items }: { items: { name: string; slug: string; active?: boolean }[] }) {
  if (!items.length) return null
  return (
    <nav aria-label="Subcategories" className="no-scrollbar anim-rise -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" style={{ ['--d' as string]: '0.18s' }}>
      {items.map((c) => (
        <Link
          key={c.slug}
          href={`/shop/${c.slug}`}
          aria-current={c.active ? 'page' : undefined}
          className={cn(
            'shrink-0 rounded-[2px] border px-4 py-2 text-[0.88rem] whitespace-nowrap transition-colors duration-300',
            c.active ? 'border-walnut bg-walnut text-ivory' : 'border-line-strong text-walnut hover:border-walnut',
          )}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  )
}

interface ListingGridProps {
  data: SiteData
  /** Products this page is about, before filters (e.g. a category, the sale, search results). */
  products: CatalogProduct[]
  params: Params
  pathname: string
  defaultSort?: SortKey
  sortOptions?: SortKey[]
  scope?: CategoryNode
  showCategoryFilter?: boolean
  /** Keep the incoming order (e.g. search relevance) unless a sort is chosen. */
  keepOrder?: boolean
  emptyTitle?: string
}

/** Filters, sorting, product grid and "load more". */
export function ListingGrid({
  data,
  products,
  params,
  pathname,
  defaultSort = 'featured',
  sortOptions,
  scope,
  showCategoryFilter = true,
  keepOrder,
  emptyTitle,
}: ListingGridProps) {
  const { filters, sort, page } = parseListingParams(params, defaultSort)
  const facets = buildFacets(products, data, scope)
  const filtered = applyFilters(products, filters, data)
  const sorted = keepOrder && !params.sort ? filtered : sortProducts(filtered, sort)
  const visible = sorted.slice(0, page * PAGE_SIZE)
  const showCats = showCategoryFilter && facets.categories.length > 1
  const hasFilters = facets.priceMax > 0 || facets.materials.length > 0 || showCats
  const wa = whatsappLink(data.settings.whatsapp_number, data.settings.whatsapp_custom_message)

  return (
    <ListingShell>
      <div className="container-site pb-20 lg:pb-28">
        <div className={cn('grid gap-10', hasFilters && 'lg:grid-cols-[250px_1fr] xl:gap-14')}>
          {hasFilters && (
            <aside className="hidden lg:block" aria-label="Filters">
              <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100svh-var(--header-h)-3rem)] overflow-y-auto pr-2" data-lenis-prevent>
                <p className="t-label border-b border-line pb-4 text-[0.75rem] text-walnut">Refine</p>
                <FilterPanel facets={facets} filters={filters} params={params} showCategories={showCats} />
              </div>
            </aside>
          )}
          <div className="min-w-0">
            <ListingToolbar
              total={sorted.length}
              sort={sort}
              sortOptions={sortOptions}
              filters={filters}
              facets={facets}
              params={params}
              showCategories={showCats}
            />
            <h2 className="sr-only">Products</h2>
            <ListingResults className="mt-8">
              {visible.length ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6 lg:gap-y-14">
                  {visible.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={toCard(p)}
                      reveal={i >= 6}
                      priority={i < 2}
                      className={i < 6 ? 'anim-rise' : undefined}
                      style={i < 6 ? ({ ['--d' as string]: `${0.15 + i * 0.06}s` } as CSSProperties) : undefined}
                      sizes="(min-width: 1280px) 26vw, (min-width: 768px) 30vw, 46vw"
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-line bg-surface px-6 py-16 text-center">
                  <h2 className="t-h3">{emptyTitle ?? 'No pieces match these filters'}</h2>
                  <p className="mx-auto mt-3 max-w-md text-taupe">
                    Try removing a filter, or tell us what you are looking for. Our workshop can make it to your size and finish.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link href={pathname} className="btn btn-secondary">
                      Clear filters
                    </Link>
                    <WhatsAppLink href={wa} context="customize" className="btn btn-primary">
                      <IconWhatsApp size={18} /> Ask for a custom piece
                    </WhatsAppLink>
                  </div>
                </div>
              )}
              {visible.length < sorted.length && (
                <div className="mt-14 flex flex-col items-center gap-4">
                  <p className="tabular text-[0.85rem] text-taupe">
                    Showing {visible.length} of {plural(sorted.length, 'piece')}
                  </p>
                  <Link href={listingHref(pathname, params, { page: String(page + 1) })} scroll={false} className="btn btn-secondary">
                    Load more <IconArrowRight size={16} className="btn-icon" />
                  </Link>
                </div>
              )}
            </ListingResults>
          </div>
        </div>
      </div>
    </ListingShell>
  )
}

export function ListingSkeleton() {
  return (
    <div className="container-site pb-24">
      <div className="h-12 border-y border-line" />
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:gap-x-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse bg-beige-soft" />
            <div className="mt-4 h-3 w-1/3 bg-beige-soft" />
            <div className="mt-3 h-4 w-2/3 bg-beige-soft" />
          </div>
        ))}
      </div>
    </div>
  )
}
