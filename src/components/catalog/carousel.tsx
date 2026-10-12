'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { Children, useCallback, useEffect, useState, type ReactNode } from 'react'
import { IconArrowLeft, IconArrowRight } from '@/components/icons'
import { cn } from '@/lib/cn'

interface CarouselProps {
  children: ReactNode
  /** Tailwind width classes for each slide (controls how many show per breakpoint). */
  slideClassName?: string
  label: string
  className?: string
  /** Show arrows (desktop) above the track, aligned right. */
  arrows?: boolean
}

/** Touch-native carousel (Embla) with a thin progress line and desktop arrows. */
export function Carousel({ children, slideClassName, label, className, arrows = true }: CarouselProps) {
  const [ref, api] = useEmblaCarousel({ align: 'start', dragFree: false, containScroll: 'trimSnaps', skipSnaps: true })
  const [progress, setProgress] = useState(0)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  const update = useCallback(() => {
    if (!api) return
    setProgress(Math.max(0, Math.min(1, api.scrollProgress())))
    setCanPrev(api.canScrollPrev())
    setCanNext(api.canScrollNext())
  }, [api])

  useEffect(() => {
    if (!api) return
    const frame = requestAnimationFrame(update)
    api.on('scroll', update).on('reInit', update).on('select', update)
    return () => {
      cancelAnimationFrame(frame)
      api.off('scroll', update).off('reInit', update).off('select', update)
    }
  }, [api, update])

  const slides = Children.toArray(children)
  const scrollable = canPrev || canNext

  return (
    <div className={cn('relative', className)} role="region" aria-roledescription="carousel" aria-label={label}>
      {arrows && scrollable && (
        <div className="absolute -top-[4.25rem] right-0 hidden gap-2 lg:flex">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Previous"
            className="grid size-11 place-items-center rounded-full border border-line-strong text-walnut transition-colors duration-300 hover:border-walnut hover:bg-walnut hover:text-ivory disabled:pointer-events-none disabled:opacity-35"
          >
            <IconArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            disabled={!canNext}
            aria-label="Next"
            className="grid size-11 place-items-center rounded-full border border-line-strong text-walnut transition-colors duration-300 hover:border-walnut hover:bg-walnut hover:text-ivory disabled:pointer-events-none disabled:opacity-35"
          >
            <IconArrowRight size={18} />
          </button>
        </div>
      )}
      <div ref={ref} className="overflow-hidden">
        <div className="-ml-3 flex touch-pan-y sm:-ml-5 lg:-ml-6">
          {slides.map((child, i) => (
            <div
              key={i}
              className={cn('min-w-0 shrink-0 grow-0 pl-3 sm:pl-5 lg:pl-6', slideClassName ?? 'basis-[46%] sm:basis-[34%] lg:basis-1/4')}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      {scrollable && (
        <div className="mt-8 h-px w-full bg-line" aria-hidden>
          <div className="h-px origin-left bg-walnut transition-transform duration-300 ease-out" style={{ transform: `scaleX(${Math.max(0.12, progress)})` }} />
        </div>
      )}
    </div>
  )
}
