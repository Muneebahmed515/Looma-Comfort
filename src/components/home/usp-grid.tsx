import { USP_ICONS, type UspIconName } from '@/components/icons'
import { SectionHeading } from '@/components/ui/section-heading'
import type { UspItem } from '@/lib/types'

export function UspGrid({ eyebrow, title, items }: { eyebrow?: string | null; title?: string | null; items: UspItem[] }) {
  if (!items.length) return null
  return (
    <section className="section-y bg-beige">
      <div className="container-site">
        {(eyebrow || title) && <SectionHeading eyebrow={eyebrow} title={title} align="center" />}
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:mt-16 lg:grid-cols-4 lg:gap-0">
          {items.map((item, i) => {
            const Icon = USP_ICONS[item.icon as UspIconName] ?? USP_ICONS.craft
            return (
              <li
                key={item.title}
                className="flex flex-col items-center px-2 text-center lg:border-l lg:border-line-strong lg:px-8 lg:first:border-l-0"
                data-reveal="card"
                style={{ ['--i' as string]: i }}
              >
                <Icon size={36} className="text-gold-text" />
                <h3 className="mt-5 font-serif text-[1.3rem] leading-tight font-semibold text-walnut lg:text-[1.45rem]">{item.title}</h3>
                <p className="mt-2.5 max-w-[16rem] text-[0.9rem] leading-relaxed text-taupe-deep">{item.text}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
