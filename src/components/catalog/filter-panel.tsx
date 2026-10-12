'use client'

import { Slider } from 'radix-ui'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { IconCheck } from '@/components/icons'
import { AccordionItem } from '@/components/ui/accordion'
import { listingHref, type Facets, type ListingFilters } from '@/lib/data/catalog'
import { cn } from '@/lib/cn'
import { formatNumber, formatPKR } from '@/lib/format'
import { useListingNav } from './listing-shell'

type Params = Record<string, string | string[] | undefined>

interface FilterPanelProps {
  facets: Facets
  filters: ListingFilters
  params: Params
  showCategories: boolean
}

function Check({ checked, label, count, onChange, indent }: { checked: boolean; label: string; count: number; onChange: () => void; indent?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-3 py-1.5 text-[0.92rem] text-walnut', indent && 'pl-5')}>
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          'grid size-[18px] shrink-0 place-items-center rounded-[2px] border transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold',
          checked ? 'border-walnut bg-walnut text-ivory' : 'border-line-strong bg-surface',
        )}
        aria-hidden
      >
        {checked && <IconCheck size={12} weight="bold" />}
      </span>
      <span className="flex-1">{label}</span>
      <span className="tabular text-[0.8rem] text-taupe">{count}</span>
    </label>
  )
}

export function FilterPanel({ facets, filters, params, showCategories }: FilterPanelProps) {
  const pathname = usePathname()
  const { navigate } = useListingNav()
  const lo = facets.priceMin
  const hi = Math.max(facets.priceMax, lo + 1)
  const [range, setRange] = useState<[number, number]>([filters.min ?? lo, filters.max ?? hi])
  // When the URL changes (e.g. a chip is removed), reset the slider to match.
  const sourceKey = `${filters.min ?? lo}-${filters.max ?? hi}`
  const [lastKey, setLastKey] = useState(sourceKey)
  if (sourceKey !== lastKey) {
    setLastKey(sourceKey)
    setRange([filters.min ?? lo, filters.max ?? hi])
  }

  const toggleIn = (key: 'category' | 'material' | 'stock', list: string[], value: string) => {
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    navigate(listingHref(pathname, params, { [key]: next.length ? next : null }))
  }

  const applyRange = (r: [number, number]) => {
    navigate(
      listingHref(pathname, params, {
        min: r[0] > lo ? String(r[0]) : null,
        max: r[1] < hi ? String(r[1]) : null,
      }),
    )
  }

  const step = hi - lo > 200000 ? 5000 : 1000
  const quick = [
    { label: `Under ${formatPKR(25000)}`, min: null, max: 25000 },
    { label: `${formatNumber(25000)} – ${formatNumber(50000)}`, min: 25000, max: 50000 },
    { label: `${formatNumber(50000)} – ${formatNumber(100000)}`, min: 50000, max: 100000 },
    { label: `Over ${formatPKR(100000)}`, min: 100000, max: null },
  ].filter((q) => (q.max == null || q.max > lo) && (q.min == null || q.min < hi))

  return (
    <div className="space-y-0">
      {showCategories && facets.categories.length > 0 && (
        <AccordionItem title="Category" defaultOpen>
          <div className="space-y-0.5">
            {facets.categories.map((c) => (
              <Check
                key={c.slug}
                label={c.name}
                count={c.count}
                indent={c.depth > 0}
                checked={filters.categories.includes(c.slug)}
                onChange={() => toggleIn('category', filters.categories, c.slug)}
              />
            ))}
          </div>
        </AccordionItem>
      )}

      {facets.priceMax > 0 && (
        <AccordionItem title="Price" defaultOpen>
          <div className="px-1 pt-2">
            <Slider.Root
              className="relative flex h-6 touch-none items-center select-none"
              min={lo}
              max={hi}
              step={step}
              minStepsBetweenThumbs={1}
              value={range}
              onValueChange={(v) => setRange([v[0]!, v[1]!])}
              onValueCommit={(v) => applyRange([v[0]!, v[1]!])}
              aria-label="Price range"
            >
              <Slider.Track className="relative h-px grow bg-line-strong">
                <Slider.Range className="absolute h-px bg-walnut" />
              </Slider.Track>
              {[0, 1].map((i) => (
                <Slider.Thumb
                  key={i}
                  aria-label={i === 0 ? 'Minimum price' : 'Maximum price'}
                  className="block size-5 rounded-full border border-walnut bg-ivory shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                />
              ))}
            </Slider.Root>
            <div className="tabular mt-3 flex justify-between text-[0.85rem] text-taupe">
              <span>{formatPKR(range[0])}</span>
              <span>{formatPKR(range[1])}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {quick.map((q) => {
                const active = (filters.min ?? null) === q.min && (filters.max ?? null) === q.max
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() =>
                      navigate(listingHref(pathname, params, { min: q.min ? String(q.min) : null, max: q.max ? String(q.max) : null }))
                    }
                    className={cn(
                      'rounded-[2px] border px-3 py-1.5 text-[0.78rem] transition-colors',
                      active ? 'border-walnut bg-walnut text-ivory' : 'border-line-strong text-walnut hover:border-walnut',
                    )}
                  >
                    {q.label}
                  </button>
                )
              })}
            </div>
          </div>
        </AccordionItem>
      )}

      {facets.materials.length > 0 && (
        <AccordionItem title="Material" defaultOpen={filters.materials.length > 0}>
          <div className="space-y-0.5">
            {facets.materials.map((m) => (
              <Check
                key={m.slug}
                label={m.name}
                count={m.count}
                checked={filters.materials.includes(m.slug)}
                onChange={() => toggleIn('material', filters.materials, m.slug)}
              />
            ))}
          </div>
        </AccordionItem>
      )}

      {facets.stock.length > 1 && (
        <AccordionItem title="Availability" defaultOpen={filters.stock.length > 0}>
          {facets.stock.map((s) => (
            <Check
              key={s.value}
              label={s.label}
              count={s.count}
              checked={filters.stock.includes(s.value)}
              onChange={() => toggleIn('stock', filters.stock, s.value)}
            />
          ))}
        </AccordionItem>
      )}

      {facets.saleCount > 0 && (
        <AccordionItem title="Offers" defaultOpen={filters.sale}>
          <Check
            label="On sale"
            count={facets.saleCount}
            checked={filters.sale}
            onChange={() => navigate(listingHref(pathname, params, { sale: filters.sale ? null : '1' }))}
          />
        </AccordionItem>
      )}
    </div>
  )
}
