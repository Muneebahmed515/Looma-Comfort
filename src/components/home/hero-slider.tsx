'use client'

import Fade from 'embla-carousel-fade'
import useEmblaCarousel from 'embla-carousel-react'
import { getImageProps } from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { IconArrowLeft, IconArrowRight } from '@/components/icons'
import { cn } from '@/lib/cn'
import { isStorageRef, storageLoader } from '@/lib/images'
import type { HeroSlideRow, ImageAsset } from '@/lib/types'

type Slide = Pick<
  HeroSlideRow,
  'id' | 'eyebrow' | 'heading' | 'subheading' | 'button_label' | 'button_url' | 'desktop_image' | 'mobile_image' | 'text_align' | 'text_tone' | 'overlay'
>

const DURATION = 6.5
const REDUCED = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function ArtImage({ desktop, mobile, eager }: { desktop: ImageAsset | null; mobile: ImageAsset | null; eager: boolean }) {
  const main = desktop ?? mobile
  if (!main) return <div className="absolute inset-0 bg-beige" />
  const opts = (a: ImageAsset, quality: 70 | 80) => ({
    src: a.ref,
    alt: a.alt ?? '',
    width: a.w || 1600,
    height: a.h || 900,
    sizes: '100vw',
    quality,
    loader: isStorageRef(a.ref) ? storageLoader : undefined,
    loading: eager ? ('eager' as const) : ('lazy' as const),
    fetchPriority: eager ? ('high' as const) : undefined,
  })
  const { props: d } = getImageProps(opts(main, 80))
  const m = mobile && desktop ? getImageProps(opts(mobile, 70)).props : null
  const { srcSet: desktopSet, ...rest } = d
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSet} />
      {m && <source media="(max-width: 767px)" srcSet={m.srcSet} />}
      <img {...rest} srcSet={desktopSet} alt={main.alt ?? ''} className="absolute inset-0 h-full w-full object-cover" />
    </picture>
  )
}

export function HeroSlider({ slides, headingLevel = 'h1' }: { slides: Slide[]; headingLevel?: 'h1' | 'h2' }) {
  const [ref, api] = useEmblaCarousel({ loop: true, duration: 38 }, [Fade()])
  const [selected, setSelected] = useState(0)
  const [initial, setInitial] = useState(true)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED).matches, () => true)
  const autoplay = !reduceMotion && slides.length > 1
  // Images for the other slides load only once the page is idle, so they never slow the first one.
  const [restReady, setRestReady] = useState(false)

  useEffect(() => {
    const go = () => window.setTimeout(() => setRestReady(true), 1200)
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
  }, [])

  const onSelect = useCallback(() => {
    if (!api) return
    setSelected(api.selectedScrollSnap())
    setInitial(false)
  }, [api])

  useEffect(() => {
    if (!api) return
    api.on('select', onSelect)
    const stop = () => setPaused(true)
    api.on('pointerDown', stop)
    return () => {
      api.off('select', onSelect)
      api.off('pointerDown', stop)
    }
  }, [api, onSelect])

  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (!slides.length) return null
  const Heading = headingLevel

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="hero-intro-delay relative isolate h-[calc(100svh-var(--header-h)-var(--announce-h))] max-h-[880px] min-h-[540px] overflow-hidden bg-walnut lg:min-h-[600px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={ref} className="h-full overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {slides.map((s, i) => {
            const light = s.text_tone === 'light'
            const lines = s.heading.split('\n')
            const active = i === selected
            // Only the first slide's heading is the page's H1.
            const SlideHeading = i === 0 ? Heading : 'h2'
            return (
              <div
                key={s.id}
                className={cn('hero-slide relative h-full min-w-0 shrink-0 grow-0 basis-full', initial && i === 0 && 'is-initial')}
                data-active={active ? 'true' : 'false'}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                aria-hidden={!active}
              >
                <div className="hero-slide-media absolute inset-0 overflow-hidden">
                  {(i === 0 || restReady || active) && <ArtImage desktop={s.desktop_image} mobile={s.mobile_image} eager={i === 0} />}
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    background: light
                      ? `linear-gradient(180deg, rgb(30 20 14 / ${(s.overlay / 100) * 0.3}) 0%, rgb(30 20 14 / ${(s.overlay / 100) * 0.35}) 35%, rgb(30 20 14 / ${Math.min(0.85, s.overlay / 100 + 0.32)}) 100%)`
                      : `linear-gradient(180deg, rgb(248 245 239 / 0) 30%, rgb(248 245 239 / ${Math.min(0.92, s.overlay / 100 + 0.35)}) 100%)`,
                  }}
                  aria-hidden
                />
                <div
                  className={cn(
                    'container-site relative flex h-full flex-col justify-end pb-24 lg:pb-28',
                    s.text_align === 'center' && 'items-center text-center',
                    s.text_align === 'right' && 'items-end text-right',
                  )}
                >
                  <div
                    className={cn('max-w-[640px]', light ? 'text-ivory' : 'text-walnut')}
                    style={light ? { textShadow: '0 1px 18px rgb(20 12 8 / 0.28)' } : undefined}
                  >
                    {s.eyebrow && (
                      <p className="hero-fade eyebrow-rule t-eyebrow mb-5" data-align={s.text_align === 'center' ? undefined : 'start'} style={{ ['--d' as string]: '0.05s' }}>
                        {s.eyebrow}
                      </p>
                    )}
                    <SlideHeading className="t-display">
                      {lines.map((line, li) => (
                        <span key={li} className="hero-line line-mask">
                          <span style={{ ['--d' as string]: `${0.12 + li * 0.12}s` }}>{line}</span>
                        </span>
                      ))}
                    </SlideHeading>
                    {s.subheading && (
                      <p
                        className={cn('hero-fade t-lead mt-5 max-w-[30rem]', light ? 'text-ivory/85' : 'text-taupe-deep', s.text_align === 'center' && 'mx-auto')}
                        style={{ ['--d' as string]: `${0.3 + lines.length * 0.12}s` }}
                      >
                        {s.subheading}
                      </p>
                    )}
                    {s.button_label && s.button_url && (
                      <div className="hero-fade mt-8" style={{ ['--d' as string]: `${0.42 + lines.length * 0.12}s` }}>
                        <Link href={s.button_url} tabIndex={active ? 0 : -1} className={cn('btn', light ? 'btn-light' : 'btn-primary')}>
                          {s.button_label}
                          <IconArrowRight size={16} className="btn-icon" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <div className="container-site flex items-center justify-between pb-8 lg:pb-10">
            <div className="pointer-events-auto flex items-center gap-4 text-ivory">
              <span className="tabular t-label text-[0.72rem]">
                {String(selected + 1).padStart(2, '0')}
                <span className="mx-2 opacity-50">/</span>
                {String(slides.length).padStart(2, '0')}
              </span>
              <div className="flex gap-2">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === selected}
                    className="group relative h-6 w-10 sm:w-14"
                  >
                    <span className="absolute inset-x-0 top-1/2 h-px bg-ivory/35" />
                    <span
                      className="hero-progress absolute inset-x-0 top-1/2 h-px bg-ivory"
                      data-running={autoplay && i === selected ? 'true' : 'false'}
                      style={{
                        ['--hero-duration' as string]: `${DURATION}s`,
                        animationPlayState: paused ? 'paused' : 'running',
                        transform: !autoplay && i === selected ? 'scaleX(1)' : undefined,
                      }}
                      onAnimationEnd={() => api?.scrollNext()}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="pointer-events-auto hidden gap-2 lg:flex">
              <button
                type="button"
                onClick={() => api?.scrollPrev()}
                aria-label="Previous slide"
                className="grid size-11 place-items-center rounded-full border border-ivory/40 text-ivory transition-colors duration-300 hover:bg-ivory hover:text-walnut"
              >
                <IconArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => api?.scrollNext()}
                aria-label="Next slide"
                className="grid size-11 place-items-center rounded-full border border-ivory/40 text-ivory transition-colors duration-300 hover:bg-ivory hover:text-walnut"
              >
                <IconArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
