import { cn } from '@/lib/cn'
import { formatPKR } from '@/lib/format'
import type { PriceResult } from '@/lib/pricing'

interface PriceProps {
  pricing: PriceResult
  fromPrice?: boolean
  onRequest?: boolean
  size?: 'sm' | 'lg'
  className?: string
}

export function Price({ pricing, fromPrice, onRequest, size = 'sm', className }: PriceProps) {
  if (onRequest) {
    return <p className={cn('tabular text-walnut', size === 'lg' ? 'text-xl' : 'text-[0.95rem]', className)}>Price on request</p>
  }
  const big = size === 'lg'
  return (
    <p className={cn('tabular flex flex-wrap items-baseline gap-x-2.5 gap-y-1', className)}>
      {fromPrice && <span className={cn('text-taupe', big ? 'text-sm' : 'text-[0.8rem]')}>From</span>}
      <span className={cn('font-medium text-walnut', big ? 'text-[1.6rem] leading-none' : 'text-[0.95rem]')}>
        <span className="sr-only">{pricing.sale ? 'Sale price ' : 'Price '}</span>
        {formatPKR(pricing.final)}
      </span>
      {pricing.sale != null && (
        <>
          <s className={cn('text-taupe decoration-taupe/60', big ? 'text-base' : 'text-[0.8rem]')}>
            <span className="sr-only">Regular price </span>
            {formatPKR(pricing.regular)}
          </s>
          {big && <span className="t-label text-gold-text">Save {pricing.discountPercent}%</span>}
        </>
      )}
    </p>
  )
}
