import Link from 'next/link'
import { IconArrowRight } from '@/components/icons'
import { SectionHeading } from '@/components/ui/section-heading'
import { SmartImage } from '@/components/ui/smart-image'
import { lean, type CategoryNode } from '@/lib/data/build'
import { cn } from '@/lib/cn'
import { plural } from '@/lib/format'

interface Props {
  eyebrow?: string | null
  title?: string | null
  categories: CategoryNode[]
  link?: { label: string; href: string } | null
}

/** Editorial grid: one large tile + smaller tiles on desktop, a tidy 2-column grid on phones. */
export function CategoryShowcase({ eyebrow, title, categories, link }: Props) {
  if (!categories.length) return null
  // 5 → one large tile + four; 3, 6 or 9 → three columns; otherwise four columns.
  const editorial = categories.length === 5
  const threeCol = !editorial && categories.length % 3 === 0 && categories.length <= 9
  return (
    <section className="section-y">
      <div className="container-site">
        <SectionHeading eyebrow={eyebrow} title={title} link={link} />
        <div className={cn('mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:mt-14 lg:gap-x-6', threeCol ? 'lg:grid-cols-3' : 'lg:grid-cols-4')}>
          {categories.slice(0, threeCol ? 9 : 8).map((c, i) => {
            const big = editorial && i === 0
            return (
              <Link
                key={c.id}
                href={`/shop/${c.slug}`}
                className={cn('group block', big && 'col-span-2 lg:row-span-2')}
                data-reveal="card"
              >
                <div className={cn('media-zoom relative overflow-hidden bg-beige-soft', big ? 'aspect-[4/5] lg:aspect-auto lg:h-[calc(100%-5.25rem)]' : threeCol ? 'aspect-[4/5] lg:aspect-[6/5]' : 'aspect-[4/5]')}>
                  <SmartImage
                    asset={lean(c.image)}
                    fill
                    sizes={big ? '(min-width: 1024px) 46vw, 46vw' : threeCol ? '(min-width: 1024px) 30vw, 46vw' : '(min-width: 1024px) 22vw, 46vw'}
                    className="object-cover"
                  />
                </div>
                <div className="flex items-end justify-between gap-3 pt-4">
                  <div>
                    <h3 className={cn('font-serif leading-tight text-walnut', big ? 'text-[1.5rem] lg:text-[2rem]' : 'text-[1.3rem] lg:text-[1.5rem]')}>
                      {c.name}
                    </h3>
                    <span className="card-underline mt-1.5 block h-px w-12 bg-gold" aria-hidden />
                    <p className="mt-2 text-[0.8rem] text-taupe">{plural(c.productCount, 'piece')}</p>
                  </div>
                  <IconArrowRight size={18} className="card-arrow mb-7 shrink-0 text-walnut" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
