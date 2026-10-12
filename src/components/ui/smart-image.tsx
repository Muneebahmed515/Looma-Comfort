'use client'

import Image from 'next/image'
import { isStorageRef, storageLoader } from '@/lib/images'
import type { ImageAsset } from '@/lib/types'

interface SmartImageProps {
  asset: ImageAsset | null | undefined
  sizes: string
  /** Fill the parent (which must be positioned and sized). */
  fill?: boolean
  priority?: boolean
  className?: string
  alt?: string
  quality?: 70 | 80
  /** Show the blurred preview while loading (adds ~1 KB of HTML per image, so only for large, key images). */
  blur?: boolean
}

/**
 * next/image for both demo files (optimised by Next) and Supabase Storage images
 * (pre-sized at upload; served directly through a custom loader).
 */
export function SmartImage({ asset, sizes, fill, priority, className, alt, quality = 70, blur = false }: SmartImageProps) {
  if (!asset?.ref) return <div className={`bg-beige-soft ${className ?? ''}`} aria-hidden />
  const storage = isStorageRef(asset.ref)
  const common = {
    src: asset.ref,
    alt: alt ?? asset.alt ?? '',
    sizes,
    className,
    quality,
    loader: storage ? storageLoader : undefined,
    placeholder: blur && asset.blur ? ('blur' as const) : ('empty' as const),
    blurDataURL: blur ? (asset.blur ?? undefined) : undefined,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    fetchPriority: priority ? ('high' as const) : undefined,
  }
  if (fill) return <Image {...common} alt={common.alt} fill />
  return <Image {...common} alt={common.alt} width={asset.w || 1200} height={asset.h || 900} />
}
