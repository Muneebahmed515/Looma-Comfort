'use client'

import { useSyncExternalStore } from 'react'

/**
 * Tiny localStorage-backed store shared across components and browser tabs.
 * Storage access is wrapped in try/catch: private windows can throw.
 */
export function createLocalStore<T>(key: string, fallback: T) {
  let cache: T = fallback
  let loaded = false
  const listeners = new Set<() => void>()

  const read = (): T => {
    if (!loaded && typeof window !== 'undefined') {
      loaded = true
      try {
        const raw = window.localStorage.getItem(key)
        if (raw) cache = JSON.parse(raw) as T
      } catch {
        cache = fallback
      }
    }
    return cache
  }

  const write = (next: T) => {
    cache = next
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Storage full or blocked: keep the in-memory value for this visit.
    }
    listeners.forEach((l) => l())
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      try {
        cache = e.newValue ? (JSON.parse(e.newValue) as T) : fallback
      } catch {
        cache = fallback
      }
      listeners.forEach((l) => l())
    }
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, read, () => fallback)
  }

  return { read, write, useStore }
}

// ---------------------------------------------------------------- wishlist
export interface WishlistItem {
  id: string
  /** Option selection (group id → value id) when saved from a product page. */
  selection?: Record<string, string>
  addedAt: number
}

const wishlist = createLocalStore<WishlistItem[]>('lc-wishlist', [])

export function useWishlist() {
  const items = wishlist.useStore()
  return {
    items,
    count: items.length,
    has: (id: string) => items.some((i) => i.id === id),
    toggle(id: string, selection?: Record<string, string>) {
      const current = wishlist.read()
      if (current.some((i) => i.id === id)) wishlist.write(current.filter((i) => i.id !== id))
      else wishlist.write([{ id, selection, addedAt: Date.now() }, ...current].slice(0, 40))
    },
    remove(id: string) {
      wishlist.write(wishlist.read().filter((i) => i.id !== id))
    },
    clear() {
      wishlist.write([])
    },
  }
}

// ---------------------------------------------------------------- recently viewed
const recent = createLocalStore<string[]>('lc-recent', [])

export function useRecentlyViewed() {
  return recent.useStore()
}

export function rememberViewed(id: string) {
  recent.write([id, ...recent.read().filter((x) => x !== id)].slice(0, 12))
}
