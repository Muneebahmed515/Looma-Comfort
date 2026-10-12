'use client'

type WaContext = 'product' | 'question' | 'wishlist' | 'floating' | 'header' | 'contact' | 'customize' | 'banner' | 'other'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

/**
 * Records a WhatsApp click without delaying the navigation: a beacon to /api/wa
 * (dashboard counts), plus GA4 and Meta Pixel events when those are configured.
 */
export function trackWhatsApp(context: WaContext, detail: { productId?: string; productName?: string; value?: number } = {}) {
  try {
    const body = JSON.stringify({ context, productId: detail.productId ?? null, path: location.pathname })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/wa', new Blob([body], { type: 'application/json' }))
    else void fetch('/api/wa', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })
  } catch {
    // Tracking must never block the customer.
  }
  try {
    window.gtag?.('event', 'generate_lead', {
      method: 'whatsapp',
      context,
      item_id: detail.productId,
      item_name: detail.productName,
      currency: 'PKR',
      value: detail.value,
    })
    window.fbq?.('track', 'Contact', { content_name: detail.productName, currency: 'PKR', value: detail.value })
  } catch {
    // ignore
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  try {
    window.gtag?.('event', name, params)
  } catch {
    // ignore
  }
}
