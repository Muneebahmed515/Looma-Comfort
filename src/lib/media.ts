import 'server-only'
import { del, list, put } from '@vercel/blob'
import { STORAGE_WIDTHS, withWidth } from './images'

/** Image folders (the first part of every storage ref). */
export const BUCKETS = ['products', 'categories', 'banners', 'content', 'brand'] as const
export type Bucket = (typeof BUCKETS)[number]

export const hasMediaStore = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024
export const UPLOAD_TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/avif': 'avif' }

/** Uploads one pre-sized image file. Paths look like "products/<folder>/<id>-960.webp". */
export async function putMedia(path: string, file: Blob, contentType: string): Promise<string> {
  const res = await put(path, file, { access: 'public', contentType, addRandomSuffix: false, cacheControlMaxAge: 31536000 })
  return res.url
}

/** Deletes every generated size of the given refs. Never throws (orphaned files are harmless). */
export async function deleteMedia(refs: string[]): Promise<void> {
  if (!refs.length || !hasMediaStore) return
  try {
    const paths = refs.flatMap((ref) => STORAGE_WIDTHS.map((w) => withWidth(ref, w)))
    for (let i = 0; i < paths.length; i += 100) await del(paths.slice(i, i + 100))
  } catch {
    // The dashboard shows storage use; nothing else depends on this.
  }
}

/** Total size of uploaded images, for the dashboard meter. */
export async function mediaUsageBytes(): Promise<number | null> {
  if (!hasMediaStore) return null
  try {
    let total = 0
    let cursor: string | undefined
    for (let page = 0; page < 20; page++) {
      const res = await list({ cursor, limit: 1000 })
      total += res.blobs.reduce((sum, b) => sum + b.size, 0)
      if (!res.hasMore || !res.cursor) break
      cursor = res.cursor
    }
    return total
  } catch {
    return null
  }
}
