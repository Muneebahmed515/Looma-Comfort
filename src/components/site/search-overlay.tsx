'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { IconArrowRight, IconClose, IconSearch } from '@/components/icons'
import { SmartImage } from '@/components/ui/smart-image'
import { Dialog } from 'radix-ui'
import { formatPKR } from '@/lib/format'
import { EASE_LOOMA } from '@/lib/motion-tokens'
import type { ImageAsset } from '@/lib/types'

interface Suggestion {
  products: { name: string; slug: string; image: ImageAsset | null; price: number | null; category: string | null }[]
  categories: { name: string; slug: string }[]
}

export function SearchOverlay({ open, onOpenChange, popular }: { open: boolean; onOpenChange: (o: boolean) => void; popular: string[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [result, setResult] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  // Short queries show the popular searches instead of stale results.
  const shown = q.trim().length >= 2 ? result : null

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) return
    const id = window.setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        if (res.ok) setResult((await res.json()) as Suggestion)
      } catch {
        // aborted or offline
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => window.clearTimeout(id)
  }, [q])

  const go = (term: string) => {
    if (!term.trim()) return
    onOpenChange(false)
    router.push(`/search?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-[60] bg-walnut-deep/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <m.div
                data-lenis-prevent
                className="fixed inset-x-0 top-0 z-[61] max-h-[100svh] overflow-y-auto bg-ivory outline-none max-lg:h-[100svh]"
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease: EASE_LOOMA }}
              >
                <Dialog.Title className="sr-only">Search</Dialog.Title>
                <div className="container-site py-5 lg:py-10">
                  <form
                    role="search"
                    onSubmit={(e) => {
                      e.preventDefault()
                      go(q)
                    }}
                    className="flex items-center gap-3 border-b border-walnut/70 pb-3"
                  >
                    <IconSearch size={24} className="shrink-0 text-walnut" />
                    <input
                      autoFocus
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search sofas, coffee tables, sheesham…"
                      aria-label="Search products"
                      enterKeyHint="search"
                      className="min-w-0 flex-1 bg-transparent font-serif text-[1.6rem] text-walnut placeholder:text-taupe/70 focus:outline-none lg:text-[2.2rem]"
                    />
                    <Dialog.Close className="grid size-11 place-items-center text-walnut" aria-label="Close search">
                      <IconClose size={24} />
                    </Dialog.Close>
                  </form>

                  <div className="min-h-40 py-8">
                    {!shown && (
                      <div>
                        <p className="t-eyebrow text-gold-text">Popular searches</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {popular.map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => go(term)}
                              className="rounded-[2px] border border-line-strong px-4 py-2 text-[0.9rem] text-walnut transition-colors hover:border-walnut"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {shown && (
                      <m.div
                        key={q}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: loading ? 0.6 : 1 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-10 lg:grid-cols-[1fr_2.2fr]"
                      >
                        <div>
                          <p className="t-eyebrow text-gold-text">Categories</p>
                          {shown.categories.length ? (
                            <ul className="mt-4 space-y-2.5">
                              {shown.categories.map((c) => (
                                <li key={c.slug}>
                                  <Link href={`/shop/${c.slug}`} onClick={() => onOpenChange(false)} className="link-u font-serif text-[1.35rem] text-walnut">
                                    {c.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-4 text-taupe">No matching categories</p>
                          )}
                        </div>
                        <div>
                          <p className="t-eyebrow text-gold-text">Products</p>
                          {shown.products.length ? (
                            <ul className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                              {shown.products.map((p) => (
                                <li key={p.slug}>
                                  <Link href={`/products/${p.slug}`} onClick={() => onOpenChange(false)} className="group flex items-center gap-4">
                                    <span className="media-zoom relative size-20 shrink-0 overflow-hidden bg-beige-soft">
                                      <SmartImage asset={p.image} fill sizes="80px" className="object-cover" />
                                    </span>
                                    <span>
                                      <span className="block text-[0.95rem] leading-snug text-walnut">{p.name}</span>
                                      <span className="tabular mt-1 block text-[0.85rem] text-taupe">
                                        {p.price != null ? formatPKR(p.price) : 'Price on request'}
                                      </span>
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-4 text-taupe">
                              Nothing found for “{q}”. Try another word, or{' '}
                              <Link href="/customize" onClick={() => onOpenChange(false)} className="link-u text-walnut">
                                ask us to make it
                              </Link>
                              .
                            </p>
                          )}
                          {shown.products.length > 0 && (
                            <button type="button" onClick={() => go(q)} className="link-arrow link-u t-label mt-8 text-walnut">
                              See all results <IconArrowRight size={14} />
                            </button>
                          )}
                        </div>
                      </m.div>
                    )}
                  </div>
                </div>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
