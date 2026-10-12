import { SITE_URL, SUPABASE_URL } from './env'

/** Widths generated in the browser for every uploaded image. */
export const STORAGE_WIDTHS = [480, 960, 1600] as const

/** Storage refs look like "products/<product-id>/<image-id>.webp" (bucket first). */
export function isStorageRef(ref: string): boolean {
  return !ref.startsWith('/') && !/^(https?:|data:|blob:)/.test(ref)
}

export function withWidth(ref: string, width: number): string {
  return ref.replace(/(\.\w+)$/, `-${width}$1`)
}

export function pickStorageWidth(requested: number): number {
  return STORAGE_WIDTHS.find((w) => w >= requested) ?? STORAGE_WIDTHS[STORAGE_WIDTHS.length - 1]
}

export function storagePublicUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${path}`
}

/** Full URL of an image at a given width (used for Open Graph, JSON-LD, WhatsApp previews). */
export function absoluteImageUrl(ref: string, width = 1600): string {
  if (/^https?:/.test(ref)) return ref
  if (isStorageRef(ref)) return storagePublicUrl(withWidth(ref, pickStorageWidth(width)))
  return `${SITE_URL}${ref}`
}

/** next/image loader for storage refs: picks the closest pre-generated size. */
export function storageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  return storagePublicUrl(withWidth(src, pickStorageWidth(width)))
}
