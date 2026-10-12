import { ViewTransition, type ReactNode } from 'react'

/**
 * Soft cross-fade between pages using the browser's View Transitions API. The header is
 * anchored (see globals.css). Browsers without support simply navigate instantly.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  )
}
