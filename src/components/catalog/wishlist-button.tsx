'use client'

import * as m from 'framer-motion/m'
import { IconHeart, IconHeartFill } from '@/components/icons'
import { useWishlist } from '@/lib/client-store'
import { cn } from '@/lib/cn'
import { trackEvent } from '@/lib/track'

interface WishlistButtonProps {
  productId: string
  productName: string
  selection?: Record<string, string>
  className?: string
  variant?: 'overlay' | 'outline'
}

export function WishlistButton({ productId, productName, selection, className, variant = 'overlay' }: WishlistButtonProps) {
  const { has, toggle } = useWishlist()
  const saved = has(productId)
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(productId, selection)
        if (!saved) trackEvent('add_to_wishlist', { item_id: productId, item_name: productName })
      }}
      className={cn(
        'grid place-items-center transition-colors duration-300',
        variant === 'overlay' && 'size-10 rounded-full bg-ivory/85 text-walnut hover:bg-ivory',
        variant === 'outline' && 'size-14 shrink-0 rounded-[2px] border border-walnut text-walnut hover:bg-walnut hover:text-ivory',
        className,
      )}
    >
      <m.span key={saved ? 'on' : 'off'} initial={{ scale: 0.9, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }}>
        {saved ? <IconHeartFill size={variant === 'outline' ? 22 : 19} className="text-gold-text" /> : <IconHeart size={variant === 'outline' ? 22 : 19} />}
      </m.span>
    </button>
  )
}
