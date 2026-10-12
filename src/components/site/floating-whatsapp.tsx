'use client'

import { usePathname } from 'next/navigation'
import { IconWhatsAppFill } from '@/components/icons'
import { cn } from '@/lib/cn'
import { trackWhatsApp } from '@/lib/track'
import { whatsappLink } from '@/lib/whatsapp'

/**
 * Floating chat button on every page. Uses WhatsApp green for instant recognition.
 * The message includes the page the visitor is on. On product pages it sits higher so
 * it never covers the sticky "Order on WhatsApp" bar.
 */
export function FloatingWhatsApp({ number, message, siteUrl }: { number: string | null; message: string; siteUrl: string }) {
  const pathname = usePathname()
  const onProduct = pathname.startsWith('/products/')
  const href = whatsappLink(number, pathname === '/' ? message : `${message}\n${siteUrl}${pathname}`)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsApp('floating')}
      aria-label="Chat with us on WhatsApp"
      className={cn(
        'anim-fade group fixed right-4 z-30 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-[0_10px_30px_-8px_rgb(37_211_102/0.55)] transition-transform duration-300 hover:-translate-y-0.5 md:right-6',
        onProduct ? 'bottom-[calc(88px+env(safe-area-inset-bottom))] lg:bottom-6' : 'bottom-[calc(16px+env(safe-area-inset-bottom))] md:bottom-6',
      )}
      style={{ ['--d' as string]: '1.2s' }}
    >
      <IconWhatsAppFill size={30} />
      <span className="pointer-events-none absolute right-[calc(100%+12px)] hidden translate-x-1 rounded-[2px] bg-walnut px-3 py-1.5 text-[0.75rem] whitespace-nowrap text-ivory opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 lg:block">
        Chat with us
      </span>
    </a>
  )
}
