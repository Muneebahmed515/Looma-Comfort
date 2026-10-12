'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { IconCaretDown, IconClose, IconFilters } from '@/components/icons'
import { Sheet } from '@/components/ui/sheet'
import { activeFilterCount, listingHref, SORT_OPTIONS, type Facets, type ListingFilters, type SortKey } from '@/lib/data/catalog'
import { formatPKR, plural } from '@/lib/format'
import { FilterPanel } from './filter-panel'
import { useListingNav } from './listing-shell'

type Params = Record<string, string | string[] | undefined>

interface ToolbarProps {
  total: number
  sort: SortKey
  sortOptions?: SortKey[]
  filters: ListingFilters
  facets: Facets
  params: Params
  showCategories: boolean
}

export function ListingToolbar({ total, sort, sortOptions, filters, facets, params, showCategories }: ToolbarProps) {
  const pathname = usePathname()
  const { navigate, pending } = useListingNav()
  const [open, setOpen] = useState(false)
  const count = activeFilterCount(filters)
  const options = SORT_OPTIONS.filter((o) => !sortOptions || sortOptions.includes(o.value))

  const chips: { label: string; patch: Record<string, string | string[] | null> }[] = [
    ...filters.categories.map((slug) => ({
      label: facets.categories.find((c) => c.slug === slug)?.name ?? slug,
      patch: { category: filters.categories.filter((s) => s !== slug) },
    })),
    ...filters.materials.map((slug) => ({
      label: facets.materials.find((m) => m.slug === slug)?.name ?? slug,
      patch: { material: filters.materials.filter((s) => s !== slug) },
    })),
    ...(filters.min || filters.max
      ? [
          {
            label: `${filters.min ? formatPKR(filters.min) : 'Any'} – ${filters.max ? formatPKR(filters.max) : 'Any'}`,
            patch: { min: null, max: null },
          },
        ]
      : []),
    ...(filters.sale ? [{ label: 'On sale', patch: { sale: null } }] : []),
    ...filters.stock.map((s) => ({
      label: s === 'made_to_order' ? 'Made to order' : 'In stock',
      patch: { stock: filters.stock.filter((x) => x !== s) },
    })),
  ]

  const clearAll = listingHref(pathname, params, { category: null, material: null, min: null, max: null, sale: null, stock: null })

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-y border-line py-3 lg:border-t-0 lg:pt-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="t-label flex items-center gap-2 py-2 text-[0.75rem] text-walnut lg:hidden"
        >
          <IconFilters size={18} /> Filter{count ? ` (${count})` : ''}
        </button>
        <p className="tabular hidden text-[0.88rem] text-taupe lg:block" aria-live="polite">
          {pending ? 'Updating…' : plural(total, 'piece')}
        </p>
        <label className="relative flex items-center gap-2 text-[0.85rem] text-taupe">
          <span className="hidden sm:inline">Sort by</span>
          <select
            value={sort}
            onChange={(e) => navigate(listingHref(pathname, params, { sort: e.target.value === 'featured' ? null : e.target.value }))}
            className="cursor-pointer appearance-none bg-transparent py-2 pr-6 pl-1 text-[0.9rem] text-walnut focus:outline-none"
            aria-label="Sort products"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <IconCaretDown size={14} className="pointer-events-none absolute right-0 text-walnut" />
        </label>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => navigate(listingHref(pathname, params, c.patch))}
              className="flex items-center gap-1.5 rounded-[2px] bg-beige-soft px-3 py-1.5 text-[0.8rem] text-walnut transition-colors hover:bg-beige"
              aria-label={`Remove filter: ${c.label}`}
            >
              {c.label} <IconClose size={12} />
            </button>
          ))}
          <button type="button" onClick={() => navigate(clearAll)} className="link-u ml-1 text-[0.8rem] text-taupe hover:text-walnut">
            Clear all
          </button>
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={setOpen}
        side="bottom"
        title={`Filter${count ? ` (${count})` : ''}`}
        footer={
          <div className="flex gap-3 px-5 py-4">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => navigate(clearAll)} disabled={!count}>
              Clear
            </button>
            <button type="button" className="btn btn-primary flex-[1.6]" onClick={() => setOpen(false)}>
              {pending ? 'Updating…' : `Show ${plural(total, 'piece')}`}
            </button>
          </div>
        }
      >
        <div className="px-5 pb-6">
          <FilterPanel facets={facets} filters={filters} params={params} showCategories={showCategories} />
        </div>
      </Sheet>
    </div>
  )
}
