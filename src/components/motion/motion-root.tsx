'use client'

import { LazyMotion, MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'
import { DUR, EASE_LOOMA } from '@/lib/motion-tokens'

// Features load once the browser is idle; until then elements simply render in their final state.
const loadFeatures = () =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') return resolve()
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300))
    idle(() => resolve(), { timeout: 1500 })
  }).then(() => import('@/lib/motion-features').then((m) => m.default))

/** Motion settings for the site: lazy features, calm tween easing (never springy), honours reduced motion. */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: DUR.ui, ease: EASE_LOOMA }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
