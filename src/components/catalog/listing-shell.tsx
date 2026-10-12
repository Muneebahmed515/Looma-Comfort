'use client'

import { useRouter } from 'next/navigation'
import { createContext, use, useTransition, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ListingNav {
  pending: boolean
  navigate: (href: string) => void
}

const Ctx = createContext<ListingNav>({ pending: false, navigate: () => {} })

export function useListingNav() {
  return use(Ctx)
}

/** Shares one transition between the filters and the grid so the grid softly dims while results load. */
export function ListingShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }))
  return <Ctx value={{ pending, navigate }}>{children}</Ctx>
}

export function ListingResults({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useListingNav()
  return (
    <div aria-busy={pending} className={cn('transition-opacity duration-200', pending && 'pointer-events-none opacity-45', className)}>
      {children}
    </div>
  )
}
