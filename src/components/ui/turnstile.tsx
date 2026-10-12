'use client'

import { useEffect, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '@/lib/env'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
    }
    __turnstileLoading?: Promise<void>
  }
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (!window.__turnstileLoading) {
    window.__turnstileLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('turnstile'))
      document.head.appendChild(s)
    })
  }
  return window.__turnstileLoading
}

/**
 * Cloudflare Turnstile (free, usually invisible). Adds a hidden "cf-turnstile-response"
 * field to the surrounding form. Renders nothing when no site key is configured.
 */
export function Turnstile() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return
    let id: string | null = null
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return
        id = window.turnstile.render(ref.current, { sitekey: TURNSTILE_SITE_KEY, appearance: 'interaction-only', theme: 'light' })
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (id && window.turnstile) window.turnstile.remove(id)
    }
  }, [])
  if (!TURNSTILE_SITE_KEY) return null
  return <div ref={ref} className="min-h-0" />
}

/** Hidden field bots tend to fill in. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Company
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}
