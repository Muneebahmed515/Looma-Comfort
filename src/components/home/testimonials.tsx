import Link from 'next/link'
import { Carousel } from '@/components/catalog/carousel'
import { IconStar } from '@/components/icons'
import { SectionHeading } from '@/components/ui/section-heading'
import type { CatalogProduct } from '@/lib/data/build'
import type { ReviewRow } from '@/lib/types'

export function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5 text-gold" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} size={size} className={n <= Math.round(rating) ? '' : 'opacity-25'} />
      ))}
    </span>
  )
}

interface Props {
  eyebrow?: string | null
  title?: string | null
  reviews: ReviewRow[]
  products: CatalogProduct[]
}

export function Testimonials({ eyebrow, title, reviews, products }: Props) {
  if (!reviews.length) return null
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return (
    <section className="section-y overflow-hidden">
      <div className="container-site">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <p className="mt-4 flex items-center gap-3 text-[0.9rem] text-taupe" data-reveal="up">
          <Stars rating={average} />
          <span className="tabular">
            {average.toFixed(1)} average from {reviews.length} reviews
          </span>
        </p>
        <div className="mt-10 lg:mt-12">
          <Carousel label="Customer reviews" slideClassName="basis-[86%] sm:basis-[48%] lg:basis-1/3">
            {reviews.map((r) => {
              const product = r.product_id ? products.find((p) => p.id === r.product_id) : undefined
              return (
                <figure key={r.id} className="flex h-full flex-col border border-line bg-surface p-7 lg:p-9" data-reveal="card">
                  <Stars rating={r.rating} />
                  <blockquote className="mt-5 flex-1 font-serif text-[1.25rem] leading-[1.45] text-walnut lg:text-[1.35rem]">
                    “{r.body}”
                  </blockquote>
                  <figcaption className="mt-7 border-t border-line pt-5 text-[0.88rem]">
                    <span className="font-medium text-walnut">{r.customer_name}</span>
                    {r.city && <span className="text-taupe">, {r.city}</span>}
                    {product && (
                      <Link href={`/products/${product.slug}`} className="link-u mt-1 block text-[0.8rem] text-gold-text">
                        {product.name}
                      </Link>
                    )}
                  </figcaption>
                </figure>
              )
            })}
          </Carousel>
        </div>
      </div>
    </section>
  )
}
