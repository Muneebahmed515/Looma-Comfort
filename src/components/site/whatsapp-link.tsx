'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackWhatsApp } from '@/lib/track'

interface WhatsAppLinkProps {
  href: string | null
  context: Parameters<typeof trackWhatsApp>[0]
  productId?: string
  productName?: string
  value?: number
  className?: string
  children: ReactNode
  'aria-label'?: string
}

/**
 * A plain link to wa.me (never window.open, so pop-up blockers can't interfere).
 * Falls back to the contact page if no WhatsApp number is configured.
 */
export function WhatsAppLink({ href, context, productId, productName, value, className, children, ...rest }: WhatsAppLinkProps) {
  if (!href) {
    return (
      <Link href="/contact" className={className} aria-label={rest['aria-label']}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={rest['aria-label']}
      onClick={() => trackWhatsApp(context, { productId, productName, value })}
    >
      {children}
    </a>
  )
}
