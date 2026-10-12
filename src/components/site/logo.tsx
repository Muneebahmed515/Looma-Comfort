import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/cn'

/** Header lockup: the house mark beside the "Looma" wordmark (cropped from the master logo). */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Looma Comfort, home" className={cn('flex items-center gap-2.5', className)}>
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={438}
        height={432}
        loading={priority ? 'eager' : undefined}
        sizes="48px"
        className="h-[34px] w-auto lg:h-[44px]"
      />
      <Image
        src="/brand/wordmark.png"
        alt="Looma Comfort"
        width={912}
        height={224}
        loading={priority ? 'eager' : undefined}
        sizes="(min-width: 1024px) 150px, 112px"
        className="h-[24px] w-auto lg:h-[32px]"
      />
    </Link>
  )
}
