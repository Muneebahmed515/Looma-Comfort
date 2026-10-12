'use client'

import { useState } from 'react'
import { IconMapPin } from '@/components/icons'

/**
 * Click-to-load Google Map. The map's scripts are heavy, so we only load them when the
 * visitor asks for the map; until then a calm placeholder keeps the page fast.
 */
export function MapEmbed({ src, address, linkUrl }: { src: string | null; address: string | null; linkUrl: string | null }) {
  const [load, setLoad] = useState(false)
  const safe = src && /^https:\/\/(www\.)?google\.[a-z.]+\/maps/.test(src) ? src : null
  if (!safe) return null
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-beige sm:aspect-[21/9]">
      {load ? (
        <iframe
          src={safe}
          title={`Map: ${address ?? 'our location'}`}
          className="absolute inset-0 h-full w-full border-0 grayscale-[35%] sepia-[15%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_40%,var(--color-beige-soft),var(--color-beige))] text-center">
          <IconMapPin size={36} className="text-gold-text" />
          {address && <p className="max-w-sm px-6 font-serif text-[1.4rem] text-walnut">{address}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setLoad(true)} className="btn btn-primary btn-sm">
              Show map
            </button>
            {linkUrl && (
              <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                Get directions
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
