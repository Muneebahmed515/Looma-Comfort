import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Price } from '@/components/ui/price'
import { SmartImage } from '@/components/ui/smart-image'
import type { ProductCardData } from '@/lib/data/build'
import { cn } from '@/lib/cn'
import { WishlistButton } from './wishlist-button'

interface ProductCardProps {
  product: ProductCardData
  /** Scroll reveal; turn off for cards visible on first paint. */
  reveal?: boolean
  priority?: boolean
  sizes?: string
  className?: string
  style?: CSSProperties
}

type Badge = { label: string; short?: string; tone: 'sale' | 'plain' | 'muted' }

function badges(p: ProductCardData): Badge[] {
  const out: Badge[] = []
  if (p.pricing.sale) {
    const pct = `−${p.pricing.discountPercent}%`
    out.push({ label: p.offerBadge ? `${p.offerBadge} ${pct}` : `Sale ${pct}`, short: `Sale ${pct}`, tone: 'sale' })
  }
  if (p.stock === 'out_of_stock') out.push({ label: 'Sold out', tone: 'muted' })
  else if (p.isNew) out.push({ label: 'New', tone: 'plain' })
  else if (p.isBestSeller) out.push({ label: 'Best seller', tone: 'plain' })
  if (p.stock === 'made_to_order' && out.length < 2) out.push({ label: 'Made to order', tone: 'plain' })
  return out.slice(0, 2)
}

export function ProductCard({ product: p, reveal = true, priority, sizes, className, style }: ProductCardProps) {
  const imgSizes = sizes ?? '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw'
  return (
    <article className={cn('group relative', className)} data-reveal={reveal ? 'card' : undefined} style={style}>
      <Link href={`/products/${p.slug}`} className="block" aria-label={p.name}>
        <div className="media-zoom relative aspect-square overflow-hidden bg-beige-soft">
          <SmartImage asset={p.image} fill sizes={imgSizes} priority={priority} className="object-cover" />
          {p.altImage && (
            <div className="card-alt-img absolute inset-0 max-lg:hidden">
              <SmartImage asset={p.altImage} fill sizes={imgSizes} className="object-cover" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {badges(p).map((b) => (
              <span
                key={b.label}
                className={cn(
                  't-label rounded-[2px] px-2 py-1 text-[0.62rem] tracking-[0.14em]',
                  b.tone === 'sale' && 'bg-walnut text-ivory',
                  b.tone === 'plain' && 'bg-ivory/90 text-walnut',
                  b.tone === 'muted' && 'bg-taupe text-ivory',
                )}
              >
                {b.short ? (
                  <>
                    <span className="sm:hidden">{b.short}</span>
                    <span className="max-sm:hidden">{b.label}</span>
                  </>
                ) : (
                  b.label
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="pt-4 pr-2">
          {p.categoryName && <p className="t-eyebrow text-[0.66rem] tracking-[0.2em] text-taupe">{p.categoryName}</p>}
          <h3 className="mt-1.5 line-clamp-2 font-serif text-[1.15rem] leading-[1.25] font-semibold text-walnut sm:text-[1.25rem]">{p.name}</h3>
          <Price pricing={p.pricing} fromPrice={p.fromPrice} onRequest={p.priceOnRequest} className="mt-2" />
        </div>
      </Link>
      <WishlistButton productId={p.id} productName={p.name} className="absolute top-2.5 right-2.5 lg:opacity-0 lg:transition-opacity lg:duration-300 lg:group-hover:opacity-100 lg:focus-visible:opacity-100" />
    </article>
  )
}
