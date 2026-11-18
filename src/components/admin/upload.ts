'use client'

import { isDbConfigured } from '@/lib/env'
import { STORAGE_WIDTHS, storagePublicUrl } from '@/lib/images'
import type { ImageAsset } from '@/lib/types'

export type Bucket = 'products' | 'categories' | 'banners' | 'content' | 'brand'

const MAX_INPUT_BYTES = 30 * 1024 * 1024

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() }
    } catch {
      // fall through to <img> decoding
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error('This photo format is not supported. Please save it as JPEG or PNG and try again.')
  }
}

function draw(source: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Compresses a photo in the browser into three sizes (480 / 960 / 1600 px wide) and uploads
 * them to Vercel Blob (through /api/admin/upload). WebP where the browser can encode it, high-quality JPEG otherwise
 * (some older iPhones). Returns the image asset to store in the database.
 */
export async function compressAndUpload(file: File, bucket: Bucket, folder: string, alt: string, onProgress?: (p: number) => void): Promise<ImageAsset> {
  if (!isDbConfigured) throw new Error('Demo mode: connect the database to upload images.')
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error('Please choose an image file.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('This photo is very large. Please use one under 30 MB.')

  const img = await decode(file)
  try {
    const id = crypto.randomUUID().slice(0, 13)
    const ratio = img.height / img.width
    const largest = Math.min(img.width, STORAGE_WIDTHS[STORAGE_WIDTHS.length - 1])

    // Work out the format once: WebP if the browser really produces it.
    const probe = await toBlob(draw(img.source, 8, 8), 'image/webp', 0.8)
    const webp = probe?.type === 'image/webp'
    const type = webp ? 'image/webp' : 'image/jpeg'
    const ext = webp ? 'webp' : 'jpg'

    let done = 0
    for (const target of STORAGE_WIDTHS) {
      const w = Math.min(target, img.width)
      const h = Math.round(w * ratio)
      const blob = await toBlob(draw(img.source, w, h), type, target >= 1600 ? 0.8 : 0.78)
      if (!blob) throw new Error('Could not process this image.')
      const path = `${folder}/${id}-${target}.${ext}`
      const body = new FormData()
      body.set('path', `${bucket}/${path}`)
      body.set('file', blob, path.split('/').pop())
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? 'Upload failed. Please try again.')
      done++
      onProgress?.(done / STORAGE_WIDTHS.length)
    }

    const tiny = draw(img.source, 16, Math.max(1, Math.round(16 * ratio)))
    const blur = tiny.toDataURL(webp ? 'image/webp' : 'image/jpeg', 0.5)

    return {
      ref: `${bucket}/${folder}/${id}.${ext}`,
      alt,
      w: largest,
      h: Math.round(largest * ratio),
      blur: blur.length < 4000 ? blur : null,
    }
  } finally {
    img.close()
  }
}

/** Preview URL for an image asset inside the admin. */
export function previewUrl(asset: ImageAsset, width = 480): string {
  if (asset.ref.startsWith('/') || /^https?:/.test(asset.ref)) return asset.ref
  const size = width <= 480 ? 480 : width <= 960 ? 960 : 1600
  return storagePublicUrl(asset.ref.replace(/(\.\w+)$/, `-${size}$1`))
}
