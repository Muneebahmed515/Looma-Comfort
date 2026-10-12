'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IconCaretLeft, IconCaretRight } from '@/components/icons'

interface Message {
  id: string
  message: string
  link_url: string | null
}

/** Rotating offer bar. Pauses on hover/focus; arrows on desktop. */
export function AnnouncementBar({ messages }: { messages: Message[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = messages.length

  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => window.clearInterval(id)
  }, [count, paused])

  if (!count) return null
  const current = messages[index % count]!
  const content = (
    <span className="block truncate px-10 text-center">{current.message}</span>
  )

  return (
    <div
      className="relative z-50 h-[var(--announce-h)] bg-walnut text-ivory"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container-site relative flex h-full items-center justify-center">
        {count > 1 && (
          <button
            type="button"
            className="absolute left-2 hidden size-8 place-items-center text-ivory/70 hover:text-ivory md:grid"
            aria-label="Previous message"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
          >
            <IconCaretLeft size={14} />
          </button>
        )}
        <div className="t-eyebrow relative h-full w-full max-w-3xl overflow-hidden text-[0.7rem] md:text-[0.72rem]" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={current.id}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {current.link_url ? (
                <Link href={current.link_url} className="link-u max-w-full">
                  {content}
                </Link>
              ) : (
                content
              )}
            </m.div>
          </AnimatePresence>
        </div>
        {count > 1 && (
          <button
            type="button"
            className="absolute right-2 hidden size-8 place-items-center text-ivory/70 hover:text-ivory md:grid"
            aria-label="Next message"
            onClick={() => setIndex((i) => (i + 1) % count)}
          >
            <IconCaretRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
