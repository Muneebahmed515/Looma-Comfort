import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconArrowRight, IconWhatsApp } from '@/components/icons'
import { WhatsAppLink } from '@/components/site/whatsapp-link'
import { SmartImage } from '@/components/ui/smart-image'
import { cn } from '@/lib/cn'
import type { ImageAsset } from '@/lib/types'

/** Page intro used by About, Customize, Contact, FAQs: eyebrow, serif title, lead, optional image. */
export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  children,
}: {
  eyebrow: string
  title: string
  intro?: string | null
  image?: ImageAsset | null
  children?: ReactNode
}) {
  return (
    <section className="container-site pt-10 pb-14 lg:pt-16 lg:pb-20">
      <div className={cn('grid items-end gap-10', image && 'lg:grid-cols-12 lg:gap-16')}>
        <div className={cn(image ? 'lg:col-span-6' : 'max-w-3xl')}>
          <p className="eyebrow-rule t-eyebrow anim-rise mb-5 text-gold-text" data-align="start">
            {eyebrow}
          </p>
          <h1 className="t-h1 anim-rise" style={{ ['--d' as string]: '0.06s' }}>
            {title}
          </h1>
          {intro && (
            <p className="t-lead anim-rise mt-6 max-w-xl text-taupe-deep" style={{ ['--d' as string]: '0.14s' }}>
              {intro}
            </p>
          )}
          {children && (
            <div className="anim-rise mt-8" style={{ ['--d' as string]: '0.2s' }}>
              {children}
            </div>
          )}
        </div>
        {image && (
          <div className="lg:col-span-6">
            <div className="anim-fade relative aspect-[4/5] overflow-hidden rounded-t-[999px] sm:aspect-[5/5] lg:aspect-[4/5]" style={{ ['--d' as string]: '0.1s' }}>
              <SmartImage asset={image} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="anim-settle object-cover" />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export function ImageTextRow({ heading, body, image, reverse }: { heading: string; body: string; image?: ImageAsset | null; reverse?: boolean }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <div className={cn('lg:col-span-6', reverse && 'lg:order-2')}>
        <div className="relative aspect-[5/4] overflow-hidden bg-beige-soft" data-reveal="image" data-parallax>
          <div className="absolute inset-x-0 -top-[8%] h-[116%]" data-parallax-target>
            <SmartImage asset={image} fill sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
          </div>
          <div className="reveal-curtain" />
        </div>
      </div>
      <div className={cn('lg:col-span-5', reverse ? 'lg:order-1' : 'lg:col-start-8')}>
        <h2 className="t-h2" data-reveal="lines">
          {heading}
        </h2>
        <p className="t-lead mt-5 text-taupe-deep" data-reveal="up">
          {body}
        </p>
      </div>
    </div>
  )
}

export function ValuesGrid({ items, eyebrow, title }: { items: { title: string; text: string }[]; eyebrow?: string; title?: string }) {
  if (!items.length) return null
  return (
    <section className="section-y bg-beige">
      <div className="container-site">
        {title && (
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="eyebrow-rule t-eyebrow mb-4 text-gold-text" data-align="start" data-reveal-rule="">
                {eyebrow}
              </p>
            )}
            <h2 className="t-h2" data-reveal="lines">
              {title}
            </h2>
          </div>
        )}
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((v, i) => (
            <li key={v.title} className="border-t border-line-strong pt-6" data-reveal="card">
              <span className="tabular font-serif text-[1.1rem] text-gold-text">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-serif text-[1.45rem] leading-tight font-semibold text-walnut">{v.title}</h3>
              <p className="mt-3 text-[0.93rem] leading-relaxed text-taupe-deep">{v.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Numbered process with a gold line that draws as you scroll. */
export function ProcessSteps({ steps, eyebrow, title }: { steps: { title: string; text: string }[]; eyebrow?: string; title?: string }) {
  if (!steps.length) return null
  return (
    <section className="section-y">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            {eyebrow && (
              <p className="eyebrow-rule t-eyebrow mb-4 text-gold-text" data-align="start" data-reveal-rule="">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="t-h2" data-reveal="lines">
                {title}
              </h2>
            )}
          </div>
        </div>
        <ol className="relative lg:col-span-7 lg:col-start-6">
          <span className="absolute top-2 bottom-2 left-[19px] w-px bg-line-strong" aria-hidden />
          <span className="absolute top-2 bottom-2 left-[19px] w-px origin-top bg-gold" aria-hidden data-draw />
          {steps.map((s, i) => (
            <li key={s.title} className="relative grid grid-cols-[40px_1fr] gap-6 pb-12 last:pb-0" data-reveal="up">
              <span className="tabular relative z-10 grid size-10 place-items-center rounded-full border border-gold bg-ivory font-serif text-[1.05rem] text-walnut">
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="font-serif text-[1.5rem] leading-tight font-semibold text-walnut">{s.title}</h3>
                <p className="mt-2 max-w-lg text-taupe-deep">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Gallery({ images }: { images: ImageAsset[] }) {
  if (!images.length) return null
  return (
    <section className="pb-20 lg:pb-28">
      <div className="container-site grid gap-3 sm:grid-cols-3 lg:gap-6">
        {images.slice(0, 3).map((img, i) => (
          <div key={img.ref + i} className={cn('relative overflow-hidden bg-beige-soft', i === 1 ? 'aspect-[4/5] sm:translate-y-12' : 'aspect-[4/5]')} data-reveal="image">
            <SmartImage asset={img} fill sizes="(min-width: 640px) 32vw, 100vw" className="object-cover" />
            <div className="reveal-curtain" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function CtaBand({ title, text, whatsappHref }: { title: string; text: string; whatsappHref: string | null }) {
  return (
    <section className="bg-walnut text-ivory">
      <div className="container-site flex flex-col items-start gap-8 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <div className="max-w-2xl">
          <h2 className="t-h2" data-reveal="lines">
            {title}
          </h2>
          <p className="mt-4 text-ivory/75" data-reveal="up">
            {text}
          </p>
        </div>
        <div className="flex flex-wrap gap-3" data-reveal="up">
          <WhatsAppLink href={whatsappHref} context="other" className="btn btn-light">
            <IconWhatsApp size={18} /> Chat on WhatsApp
          </WhatsAppLink>
          <Link href="/shop" className="btn btn-ghost-light">
            Shop the collection <IconArrowRight size={16} className="btn-icon" />
          </Link>
        </div>
      </div>
    </section>
  )
}
