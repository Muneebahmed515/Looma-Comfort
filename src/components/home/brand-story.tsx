import Link from 'next/link'
import { IconArrowRight } from '@/components/icons'
import { SmartImage } from '@/components/ui/smart-image'
import { formatNumber } from '@/lib/format'
import type { HomeSectionSettings } from '@/lib/types'

export function StatRow({ stats, tone = 'light' }: { stats: NonNullable<HomeSectionSettings['stats']>; tone?: 'light' | 'beige' }) {
  if (!stats.length) return null
  return (
    <dl className={`grid grid-cols-3 gap-4 border-t pt-8 ${tone === 'beige' ? 'border-line-strong' : 'border-line'}`}>
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="sr-only">{s.label}</dt>
          <dd className="tabular font-serif text-[2rem] leading-none text-walnut lg:text-[2.6rem]" data-count={s.value} data-count-suffix={s.suffix ?? ''}>
            {formatNumber(s.value)}
            {s.suffix}
          </dd>
          <dd className="mt-2 text-[0.8rem] tracking-wide text-taupe" aria-hidden>
            {s.label}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function BrandStory({ eyebrow, title, settings }: { eyebrow?: string | null; title?: string | null; settings: HomeSectionSettings }) {
  const paragraphs = (settings.body ?? '').split(/\n{2,}/).filter(Boolean)
  return (
    <section className="section-y">
      <div className="container-site grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-6">
          <div className="relative mx-auto aspect-[4/5] max-w-[560px] overflow-hidden rounded-t-[999px]" data-reveal="image" data-parallax>
            <div className="absolute inset-x-0 -top-[8%] h-[116%]" data-parallax-target>
              <SmartImage asset={settings.image} fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
            </div>
            <div className="reveal-curtain" />
          </div>
        </div>
        <div className="lg:col-span-6">
          {eyebrow && (
            <p className="eyebrow-rule t-eyebrow mb-5 text-gold-text" data-align="start" data-reveal-rule="">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="t-h1" data-reveal="lines">
              {title}
            </h2>
          )}
          <div className="mt-6 max-w-xl space-y-4 text-taupe-deep" data-reveal="up">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-6" data-reveal="up">
            {settings.button_label && settings.button_url && (
              <Link href={settings.button_url} className="btn btn-primary">
                {settings.button_label} <IconArrowRight size={16} className="btn-icon" />
              </Link>
            )}
            <Link href="/about" className="link-u link-arrow t-label text-walnut">
              About us <IconArrowRight size={14} />
            </Link>
          </div>
          {settings.stats && settings.stats.length > 0 && (
            <div className="mt-12 max-w-xl">
              <StatRow stats={settings.stats} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
