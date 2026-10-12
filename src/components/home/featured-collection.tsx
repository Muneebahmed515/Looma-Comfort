import Link from 'next/link'
import { ProductCard } from '@/components/catalog/product-card'
import { IconArrowRight } from '@/components/icons'
import { SmartImage } from '@/components/ui/smart-image'
import type { ProductCardData } from '@/lib/data/build'
import type { CollectionRow } from '@/lib/types'

interface Props {
  eyebrow?: string | null
  collection: CollectionRow
  products: ProductCardData[]
  layout?: 'editorial' | 'horizontal'
}

export function FeaturedCollection({ eyebrow, collection, products, layout = 'editorial' }: Props) {
  if (!products.length) return null
  const href = `/collections/${collection.slug}`

  if (layout === 'horizontal') {
    return (
      <section className="overflow-hidden bg-beige-soft" data-hscroll>
        <div className="flex h-auto flex-col justify-center py-16 lg:h-[100svh] lg:py-0">
          <div
            data-hscroll-track
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:px-6 lg:gap-8 lg:overflow-visible lg:px-10"
          >
            <div className="flex w-[80vw] shrink-0 snap-start flex-col justify-center sm:w-[50vw] lg:w-[34vw] lg:pr-8">
              {eyebrow && <p className="eyebrow-rule t-eyebrow mb-5 text-gold-text" data-align="start">{eyebrow}</p>}
              <h2 className="t-h1">{collection.name}</h2>
              {collection.description && <p className="t-lead mt-5 text-taupe-deep">{collection.description}</p>}
              <Link href={href} className="btn btn-primary mt-8 self-start">
                Explore the collection <IconArrowRight size={16} className="btn-icon" />
              </Link>
            </div>
            <div className="relative aspect-[4/5] w-[78vw] shrink-0 snap-start overflow-hidden sm:w-[46vw] lg:aspect-auto lg:h-[70vh] lg:w-[34vw]">
              <SmartImage asset={collection.image} fill sizes="(min-width: 1024px) 34vw, 78vw" className="object-cover" />
            </div>
            {products.map((p) => (
              <div key={p.id} className="w-[64vw] shrink-0 snap-start self-center sm:w-[38vw] lg:w-[22vw]">
                <ProductCard product={p} reveal={false} />
              </div>
            ))}
            <div className="w-4 shrink-0 lg:w-10" aria-hidden />
          </div>
          <div className="container-site mt-10 hidden lg:block">
            <div className="h-px bg-line">
              <div className="h-px origin-left scale-x-0 bg-gold" data-hscroll-progress />
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-y bg-beige-soft">
      <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <div className="relative aspect-[4/5] overflow-hidden" data-reveal="image" data-parallax data-curtain="beige">
              <div className="absolute inset-x-0 -top-[8%] h-[116%]" data-parallax-target>
                <SmartImage asset={collection.image} fill sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
              </div>
              <div className="reveal-curtain !bg-beige-soft" />
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center lg:col-span-6">
          {eyebrow && (
            <p className="eyebrow-rule t-eyebrow mb-5 text-gold-text" data-align="start" data-reveal-rule="">
              {eyebrow}
            </p>
          )}
          <h2 className="t-h1" data-reveal="lines">
            {collection.name}
          </h2>
          {collection.description && (
            <p className="t-lead mt-5 max-w-lg text-taupe-deep" data-reveal="up">
              {collection.description}
            </p>
          )}
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} sizes="(min-width: 1024px) 22vw, 46vw" />
            ))}
          </div>
          <div className="mt-10" data-reveal="up">
            <Link href={href} className="btn btn-secondary">
              Explore the collection <IconArrowRight size={16} className="btn-icon" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
