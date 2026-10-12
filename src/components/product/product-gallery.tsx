'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconZoom } from '@/components/icons'
import { SmartImage } from '@/components/ui/smart-image'
import { cn } from '@/lib/cn'
import { useProduct } from './product-context'

const Lightbox = dynamic(() => import('./product-lightbox'), { ssr: false })

/** Hover-to-magnify on desktop: the image scales and follows the cursor. */
function ZoomFrame({ children, onOpen }: { children: ReactNode; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Open full-screen gallery"
      onClick={onOpen}
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
      }}
      className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-beige-soft"
    >
      <div
        className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: zoom ? 'scale(1.9)' : 'scale(1)', transformOrigin: origin }}
      >
        {children}
      </div>
      <span className="absolute right-4 bottom-4 grid size-10 place-items-center rounded-full bg-ivory/90 text-walnut opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <IconZoom size={20} />
      </span>
    </button>
  )
}

export function ProductGallery() {
  const { product, imageIndex, setImageIndex } = useProduct()
  const images = product.images
  const [lightbox, setLightbox] = useState(false)
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: 'start' })

  // Keep the mobile carousel in sync with option-driven image changes.
  useEffect(() => {
    if (embla && embla.selectedScrollSnap() !== imageIndex) embla.scrollTo(imageIndex)
  }, [embla, imageIndex])
  useEffect(() => {
    if (!embla) return
    const onSelect = () => setImageIndex(embla.selectedScrollSnap())
    embla.on('select', onSelect)
    return () => {
      embla.off('select', onSelect)
    }
  }, [embla, setImageIndex])

  if (!images.length) return <div className="aspect-square bg-beige-soft" />
  const current = images[Math.min(imageIndex, images.length - 1)]!

  return (
    <div>
      {/* Mobile: swipe */}
      <div className="relative -mx-4 sm:mx-0 lg:hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {images.map((img, i) => (
              <button
                key={`${img.ref}-${i}`}
                type="button"
                onClick={() => setLightbox(true)}
                className="relative aspect-square min-w-0 shrink-0 grow-0 basis-full bg-beige-soft"
                aria-label={`View image ${i + 1} full screen`}
              >
                <SmartImage asset={img} fill priority={i === 0} blur={i === 0} sizes="100vw" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <span className="tabular absolute right-4 bottom-4 rounded-full bg-ivory/90 px-3 py-1 text-[0.75rem] text-walnut">
            {imageIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Desktop: thumbnails + zoom */}
      <div className={cn('hidden gap-4 lg:grid', images.length > 1 ? 'grid-cols-[76px_1fr] xl:grid-cols-[88px_1fr]' : 'grid-cols-1')}>
        {images.length > 1 && (
          <ul className="no-scrollbar flex max-h-[min(78vh,760px)] flex-col gap-3 overflow-y-auto" data-lenis-prevent>
            {images.map((img, i) => (
              <li key={`${img.ref}-${i}`}>
                <button
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === imageIndex}
                  className={cn(
                    'relative block aspect-square w-full overflow-hidden bg-beige-soft transition-opacity duration-300',
                    i === imageIndex ? 'opacity-100 ring-1 ring-walnut ring-offset-2 ring-offset-ivory' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  <SmartImage asset={img} fill sizes="96px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <ZoomFrame onOpen={() => setLightbox(true)}>
          <AnimatePresence initial={false} mode="popLayout">
            <m.div
              key={current.ref + imageIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SmartImage asset={current} fill priority={imageIndex === 0} blur sizes="(min-width: 1280px) 52vw, 56vw" className="object-cover" quality={80} />
            </m.div>
          </AnimatePresence>
        </ZoomFrame>
      </div>

      {lightbox && (
        <Lightbox
          open={lightbox}
          index={imageIndex}
          slides={images.map((img) => ({ src: img.full, alt: img.alt, width: img.w, height: img.h }))}
          onClose={() => setLightbox(false)}
          onIndex={setImageIndex}
        />
      )}
    </div>
  )
}
