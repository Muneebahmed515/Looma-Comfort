'use client'

import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { slugify } from '@/lib/format'
import { defaultSelection, type AppliedOffer, type Selection } from '@/lib/pricing'
import type { OptionGroup, ProductImage, StockStatus } from '@/lib/types'

export interface ProductClientData {
  id: string
  name: string
  slug: string
  sku: string | null
  url: string
  categoryName: string | null
  categorySlug: string | null
  images: (ProductImage & { full: string })[]
  options: OptionGroup[]
  price: number
  sale_price: number | null
  offer: AppliedOffer | null
  priceOnRequest: boolean
  stock: StockStatus
  leadTime: string | null
}

interface ProductState {
  product: ProductClientData
  selection: Selection
  select: (groupId: string, valueId: string) => void
  quantity: number
  setQuantity: (n: number) => void
  imageIndex: number
  setImageIndex: (i: number) => void
}

const Ctx = createContext<ProductState | null>(null)

export function useProduct() {
  const ctx = use(Ctx)
  if (!ctx) throw new Error('useProduct must be used inside ProductProvider')
  return ctx
}

/** "?size=36-round&finish=dark-walnut" → selection, so shared WhatsApp links reopen with the same options. */
function selectionFromQuery(options: OptionGroup[], search: string): Selection {
  const params = new URLSearchParams(search)
  const sel: Selection = {}
  for (const g of options) {
    const wanted = params.get(slugify(g.name))
    const v = wanted ? g.values.find((x) => slugify(x.label) === wanted && x.is_available !== false) : undefined
    if (v) sel[g.id] = v.id
  }
  return sel
}

export function optionQuery(options: OptionGroup[], selection: Selection): string {
  const params = new URLSearchParams()
  for (const g of options) {
    const v = g.values.find((x) => x.id === selection[g.id])
    if (v) params.set(slugify(g.name), slugify(v.label))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function ProductProvider({ product, children }: { product: ProductClientData; children: ReactNode }) {
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(product.options))
  const [quantity, setQuantity] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)

  // Options from a shared link (?size=king) are applied right after hydration, so the server
  // HTML (default options) and the first client render always match.
  useEffect(() => {
    const fromUrl = selectionFromQuery(product.options, window.location.search)
    if (!Object.keys(fromUrl).length) return
    const frame = requestAnimationFrame(() => setSelection((s) => ({ ...s, ...fromUrl })))
    return () => cancelAnimationFrame(frame)
  }, [product.options])

  const value = useMemo<ProductState>(
    () => ({
      product,
      selection,
      select(groupId, valueId) {
        setSelection((s) => ({ ...s, [groupId]: valueId }))
        // Show the photo linked to this colour/finish, if there is one.
        const idx = product.images.findIndex((img) => img.option_value_id === valueId)
        if (idx >= 0) setImageIndex(idx)
      },
      quantity,
      setQuantity: (n) => setQuantity(Math.max(1, Math.min(20, Math.floor(n) || 1))),
      imageIndex,
      setImageIndex,
    }),
    [product, selection, quantity, imageIndex],
  )

  return <Ctx value={value}>{children}</Ctx>
}
