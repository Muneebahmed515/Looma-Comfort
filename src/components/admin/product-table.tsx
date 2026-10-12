'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconSearch } from '@/components/icons'
import { bulkUpdateProducts, deleteProducts, toggleResource } from '@/lib/admin/actions'
import { cn } from '@/lib/cn'
import { formatDate, formatPKR } from '@/lib/format'
import type { ImageAsset, ProductRow } from '@/lib/types'
import { Switch } from './controls'
import { Pill } from './resource-list'
import { previewUrl } from './upload'

type Row = Pick<ProductRow, 'id' | 'name' | 'slug' | 'sku' | 'category_id' | 'price' | 'sale_price' | 'price_on_request' | 'stock_status' | 'is_best_seller' | 'is_new_arrival' | 'is_featured' | 'is_visible' | 'updated_at'> & {
  image: ImageAsset | null
}

const STOCK: Record<string, string> = { in_stock: 'In stock', made_to_order: 'Made to order', out_of_stock: 'Out of stock' }

export function ProductTable({ rows: initial, categories }: { rows: Row[]; categories: { value: string; label: string }[] }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()
  const catName = useMemo(() => new Map(categories.map((c) => [c.value, c.label])), [categories])

  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase()
    if (s && !r.name.toLowerCase().includes(s) && !(r.sku ?? '').toLowerCase().includes(s)) return false
    if (cat && r.category_id !== cat) return false
    if (status === 'published' && !r.is_visible) return false
    if (status === 'draft' && r.is_visible) return false
    if (status === 'sale' && !r.sale_price) return false
    if (status === 'out' && r.stock_status !== 'out_of_stock') return false
    return true
  })

  const allOn = filtered.length > 0 && filtered.every((r) => selected.has(r.id))
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(filtered.map((r) => r.id)))
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const bulk = (patch: Parameters<typeof bulkUpdateProducts>[1]) =>
    startTransition(async () => {
      const ids = [...selected]
      const res = await bulkUpdateProducts(ids, patch)
      if (res.ok) {
        setRows((rs) => rs.map((r) => (selected.has(r.id) ? { ...r, ...patch } as Row : r)))
        setSelected(new Set())
        toast.success(res.message ?? 'Updated')
        router.refresh()
      } else toast.error(res.message)
    })

  const bulkDelete = () => {
    if (!window.confirm(`Delete ${selected.size} product(s) and their photos? This cannot be undone.`)) return
    startTransition(async () => {
      const ids = [...selected]
      const res = await deleteProducts(ids)
      if (res.ok) {
        setRows((rs) => rs.filter((r) => !selected.has(r.id)))
        setSelected(new Set())
        toast.success(res.message ?? 'Deleted')
      } else toast.error(res.message)
    })
  }

  const toggleVisible = (row: Row, v: boolean) => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_visible: v } : r)))
    startTransition(async () => {
      const res = await toggleResource('products', row.id, 'is_visible', v)
      if (res.ok) toast.success(v ? 'Published' : 'Hidden from the website')
      else {
        toast.error(res.message)
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, is_visible: !v } : r)))
      }
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-taupe" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or SKU" className="h-10 w-full rounded-[2px] border border-line-strong bg-surface pr-3 pl-9 text-[0.9rem] focus:border-walnut focus:outline-none" />
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="h-10 rounded-[2px] border border-line-strong bg-surface px-3 text-[0.9rem]" aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-[2px] border border-line-strong bg-surface px-3 text-[0.9rem]" aria-label="Status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="sale">With sale price</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-[2px] bg-walnut px-4 py-2.5 text-[0.85rem] text-ivory lg:top-2">
          <span className="mr-2">{selected.size} selected</span>
          <button disabled={pending} className="rounded-[2px] bg-ivory/12 px-3 py-1.5 hover:bg-ivory/20" onClick={() => bulk({ is_visible: true })}>
            Publish
          </button>
          <button disabled={pending} className="rounded-[2px] bg-ivory/12 px-3 py-1.5 hover:bg-ivory/20" onClick={() => bulk({ is_visible: false })}>
            Hide
          </button>
          <button disabled={pending} className="rounded-[2px] bg-ivory/12 px-3 py-1.5 hover:bg-ivory/20" onClick={() => bulk({ is_best_seller: true })}>
            Mark best seller
          </button>
          <button disabled={pending} className="rounded-[2px] bg-ivory/12 px-3 py-1.5 hover:bg-ivory/20" onClick={() => bulk({ is_new_arrival: false })}>
            Remove “New”
          </button>
          <button disabled={pending} className="rounded-[2px] bg-ivory/12 px-3 py-1.5 hover:bg-ivory/20" onClick={() => bulk({ stock_status: 'out_of_stock' })}>
            Out of stock
          </button>
          <button disabled={pending} className="ml-auto rounded-[2px] bg-error px-3 py-1.5" onClick={bulkDelete}>
            Delete
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-[2px] border border-line">
        <div className="hidden grid-cols-[32px_56px_2.4fr_1.2fr_1fr_1fr_80px] items-center gap-4 border-b border-line bg-ivory px-4 py-2.5 text-[0.72rem] tracking-wide text-taupe uppercase lg:grid">
          <input type="checkbox" checked={allOn} onChange={toggleAll} aria-label="Select all" />
          <span />
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Live</span>
        </div>
        <ul className="divide-y divide-line">
          {filtered.map((r) => (
            <li key={r.id} className={cn('grid grid-cols-[28px_56px_1fr_auto] items-center gap-3 bg-surface px-3 py-3 sm:px-4 lg:grid-cols-[32px_56px_2.4fr_1.2fr_1fr_1fr_80px] lg:gap-4', selected.has(r.id) && 'bg-beige-soft')}>
              <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} aria-label={`Select ${r.name}`} />
              <Link href={`/admin/products/${r.id}`} className="block size-14 overflow-hidden rounded-[2px] bg-beige-soft">
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl(r.image, 480)} alt="" className="h-full w-full object-cover" />
                )}
              </Link>
              <Link href={`/admin/products/${r.id}`} className="min-w-0">
                <span className="block truncate font-medium text-walnut">{r.name}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.76rem] text-taupe">
                  {r.sku && <span className="tabular">{r.sku}</span>}
                  {!r.is_visible && <Pill tone="off">Draft</Pill>}
                  {r.is_best_seller && <Pill tone="neutral">Best seller</Pill>}
                  {r.is_new_arrival && <Pill tone="neutral">New</Pill>}
                  <span className="lg:hidden">· {r.price_on_request ? 'On request' : formatPKR(r.sale_price ?? r.price)}</span>
                </span>
              </Link>
              <span className="hidden truncate text-[0.88rem] text-taupe lg:block">{(r.category_id && catName.get(r.category_id)) || '—'}</span>
              <span className="tabular hidden text-[0.88rem] text-walnut lg:block">
                {r.price_on_request ? (
                  'On request'
                ) : r.sale_price ? (
                  <>
                    {formatPKR(r.sale_price)} <s className="text-[0.78rem] text-taupe">{formatPKR(r.price)}</s>
                  </>
                ) : (
                  formatPKR(r.price)
                )}
              </span>
              <span className="hidden text-[0.85rem] lg:block">
                <Pill tone={r.stock_status === 'in_stock' ? 'live' : r.stock_status === 'made_to_order' ? 'scheduled' : 'off'}>{STOCK[r.stock_status]}</Pill>
              </span>
              <span className="justify-self-end lg:justify-self-start">
                <Switch checked={r.is_visible} onChange={(v) => toggleVisible(r, v)} />
              </span>
            </li>
          ))}
        </ul>
        {!filtered.length && <p className="bg-surface px-6 py-12 text-center text-taupe">No products match.</p>}
      </div>
      <p className="mt-3 text-[0.78rem] text-taupe">
        {filtered.length} of {rows.length} products · last updated {rows[0] ? formatDate(rows.reduce((a, b) => (a.updated_at > b.updated_at ? a : b)).updated_at) : '—'}
      </p>
    </div>
  )
}
