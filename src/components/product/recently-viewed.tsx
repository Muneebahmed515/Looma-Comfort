'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Carousel } from '@/components/catalog/carousel'
import { Price } from '@/components/ui/price'
import { SmartImage } from '@/components/ui/smart-image'
import { rememberViewed, useRecentlyViewed } from '@/lib/client-store'
import type { ProductCardData } from '@/lib/data/build'

/** Remembers this product and shows the visitor's other recently viewed pieces (stored in the browser only). */
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const ids = useRecentlyViewed()
  const [items, setItems] = useState<ProductCardData[]>([])

  useEffect(() => {
    rememberViewed(currentId)
  }, [currentId])

  const others = ids.filter((id) => id !== currentId).slice(0, 8)
  const key = others.join(',')

  useEffect(() => {
    if (!key) return
    const ctrl = new AbortController()
    fetch(`/api/products?ids=${key}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products: ProductCardData[] }) => setItems(d.products))
      .catch(() => {})
    return () => ctrl.abort()
  }, [key])

  if (!key || !items.length) return null
  return (
    <section className="section-y border-t border-line" aria-labelledby="recent-heading">
      <div className="container-site">
        <h2 id="recent-heading" className="t-h3">
          Recently viewed
        </h2>
        <div className="mt-8">
          <Carousel label="Recently viewed" slideClassName="basis-[40%] sm:basis-[26%] lg:basis-[16%]" arrows={false}>
            {items.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group block">
                <div className="media-zoom relative aspect-square overflow-hidden bg-beige-soft">
                  <SmartImage asset={p.image} fill sizes="(min-width: 1024px) 16vw, 40vw" className="object-cover" />
                </div>
                <p className="mt-3 line-clamp-2 text-[0.88rem] leading-snug text-walnut">{p.name}</p>
                <Price pricing={p.pricing} onRequest={p.priceOnRequest} className="mt-1" />
              </Link>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  )
}
