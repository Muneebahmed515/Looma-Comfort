import { Carousel } from '@/components/catalog/carousel'
import { ProductCard } from '@/components/catalog/product-card'
import { SectionHeading } from '@/components/ui/section-heading'
import type { ProductCardData } from '@/lib/data/build'
import { cn } from '@/lib/cn'

interface Props {
  eyebrow?: string | null
  title?: string | null
  products: ProductCardData[]
  layout?: 'carousel' | 'grid'
  link?: { label: string; href: string } | null
  tone?: 'ivory' | 'beige'
}

export function ProductSection({ eyebrow, title, products: initialProducts, layout = 'carousel', link, tone = 'ivory' }: Props) {
  let products = initialProducts
  if (!products.length) return null
  // Grids look best as complete rows of four on desktop.
  if (layout === 'grid' && products.length > 4) products = products.slice(0, products.length - (products.length % 4))
  return (
    <section className={cn('section-y overflow-hidden', tone === 'beige' && 'bg-beige-soft')}>
      <div className="container-site">
        <SectionHeading eyebrow={eyebrow} title={title} link={layout === 'grid' ? link : null} />
        {layout === 'carousel' ? (
          <div className="mt-10 lg:mt-14">
            <Carousel label={title ?? 'Products'}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </Carousel>
            {link && (
              <div className="mt-10 flex justify-center">
                <a href={link.href} className="btn btn-secondary">
                  {link.label}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:mt-14 lg:grid-cols-4 lg:gap-x-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
