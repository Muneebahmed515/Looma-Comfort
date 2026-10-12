'use client'

import { useState, useSyncExternalStore } from 'react'
import { IconCheck, IconCopy, IconFacebook, IconShare, IconWhatsApp } from '@/components/icons'
import { trackEvent } from '@/lib/track'

const noopSubscribe = () => () => {}

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  // The native share sheet only exists in the browser (mostly on phones).
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches,
    () => false,
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackEvent('share', { method: 'copy', item_id: url })
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked
    }
  }

  const btn = 'grid size-10 place-items-center rounded-full border border-line-strong text-walnut transition-colors duration-300 hover:border-walnut hover:bg-walnut hover:text-ivory'

  return (
    <div className="flex items-center gap-3">
      <span className="t-label mr-1 text-[0.7rem] text-taupe">Share</span>
      {canShare && (
        <button
          type="button"
          className={btn}
          aria-label="Share"
          onClick={() => navigator.share({ title, url }).then(() => trackEvent('share', { method: 'native' })).catch(() => {})}
        >
          <IconShare size={18} />
        </button>
      )}
      <a
        className={btn}
        href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        onClick={() => trackEvent('share', { method: 'whatsapp' })}
      >
        <IconWhatsApp size={18} />
      </a>
      <a
        className={btn}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        onClick={() => trackEvent('share', { method: 'facebook' })}
      >
        <IconFacebook size={18} />
      </a>
      <button type="button" className={btn} onClick={copy} aria-label={copied ? 'Link copied' : 'Copy link'}>
        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  )
}
