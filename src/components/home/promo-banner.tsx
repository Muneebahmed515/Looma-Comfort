import Link from 'next/link'
import { IconArrowRight } from '@/components/icons'
import { SmartImage } from '@/components/ui/smart-image'
import { cn } from '@/lib/cn'
import { formatDayMonth } from '@/lib/format'
import type { PromoBannerRow } from '@/lib/types'

/** Split (image + beige panel) or full-bleed promotional banner. Text never sits over small mobile images. */
export function PromoBanner({ banner, endsAt }: { banner: PromoBannerRow; endsAt?: string | null }) {
  const ends = endsAt ? `Ends ${formatDayMonth(endsAt)}` : null
  const image = banner.desktop_image ?? banner.mobile_image
  const Button = banner.button_label && banner.button_url && (
    <Link href={banner.button_url} className={cn('btn mt-8', banner.layout === 'full' ? 'btn-light' : 'btn-primary')}>
      {banner.button_label}
      <IconArrowRight size={16} className="btn-icon" />
    </Link>
  )

  if (banner.layout === 'full') {
    return (
      <section className="relative isolate overflow-hidden bg-walnut text-ivory">
        <div className="absolute inset-0" data-parallax>
          <div className="absolute inset-x-0 -top-[8%] h-[116%]" data-parallax-target>
            <SmartImage asset={image} fill sizes="100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-walnut-deep/75 via-walnut-deep/40 to-transparent" />
        </div>
        <div className="container-site relative flex min-h-[460px] items-center py-20 lg:min-h-[560px]">
          <div className="max-w-xl">
            {banner.eyebrow && (
              <p className="eyebrow-rule t-eyebrow mb-5 text-gold-soft" data-align="start" data-reveal-rule="">
                {banner.eyebrow}
              </p>
            )}
            <h2 className="t-h1" data-reveal="lines">
              {banner.heading}
            </h2>
            {banner.body && (
              <p className="t-lead mt-5 text-ivory/85" data-reveal="up">
                {banner.body}
              </p>
            )}
            {ends && <p className="t-label mt-5 text-gold-soft">{ends}</p>}
            {Button && <div data-reveal="up">{Button}</div>}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section-y">
      <div className="container-site">
        <div className="grid overflow-hidden bg-beige lg:grid-cols-12" data-curtain="beige">
          <div className="relative aspect-[4/3] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[560px]" data-reveal="image" data-parallax>
            <div className="absolute inset-x-0 -top-[8%] h-[116%]" data-parallax-target>
              <SmartImage asset={image} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
            </div>
            <div className="reveal-curtain" />
          </div>
          <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:col-span-5 lg:px-14 lg:py-16">
            {banner.eyebrow && (
              <p className="eyebrow-rule t-eyebrow mb-5 text-gold-text" data-align="start" data-reveal-rule="">
                {banner.eyebrow}
              </p>
            )}
            <h2 className="t-h2" data-reveal="lines">
              {banner.heading}
            </h2>
            {banner.body && (
              <p className="mt-5 text-taupe-deep" data-reveal="up">
                {banner.body}
              </p>
            )}
            {ends && (
              <p className="t-label mt-6 text-gold-text" data-reveal="up">
                {ends}
              </p>
            )}
            {Button && <div data-reveal="up">{Button}</div>}
          </div>
        </div>
      </div>
    </section>
  )
}
