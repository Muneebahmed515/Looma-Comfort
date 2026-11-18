/** Neon connection string (server only). */
export const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ''

/**
 * True when the site reads from the Neon database; otherwise it runs on the bundled demo
 * catalogue. NEXT_PUBLIC_DB_CONFIGURED is set at build time by next.config.ts so client
 * components (login form, uploads) know too.
 */
export const isDbConfigured = Boolean(DATABASE_URL) || process.env.NEXT_PUBLIC_DB_CONFIGURED === '1'

/**
 * Public base URL of the Vercel Blob store that holds uploaded images, e.g.
 * https://abc123.public.blob.vercel-storage.com (worked out from BLOB_READ_WRITE_TOKEN in next.config.ts).
 */
export const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? '').replace(/\/$/, '')

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
