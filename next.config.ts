import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/**
 * Vercel Blob public URL, worked out from the store token (vercel_blob_rw_<storeId>_<secret>),
 * so connecting a Blob store in Vercel is all that's needed. NEXT_PUBLIC_MEDIA_BASE_URL overrides it.
 */
function mediaBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_MEDIA_BASE_URL) return process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  const storeId =
    /^vercel_blob_rw_([a-z0-9]+)_/i.exec(process.env.BLOB_READ_WRITE_TOKEN ?? '')?.[1] ??
    /^store_([a-z0-9]+)$/i.exec(process.env.BLOB_STORE_ID ?? '')?.[1]
  return storeId ? `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com` : ''
}

const nextConfig: NextConfig = {
  // Build-time flags for client components (the values themselves are not secret).
  env: {
    NEXT_PUBLIC_DB_CONFIGURED: process.env.DATABASE_URL || process.env.POSTGRES_URL ? '1' : '',
    NEXT_PUBLIC_MEDIA_BASE_URL: mediaBaseUrl(),
  },
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    // Uploaded catalogue images are pre-sized in the browser and served through a custom
    // loader (src/lib/images.ts), so Vercel's optimisation quota is only used for local files.
    qualities: [70, 80],
    // WebP only: much faster to generate than AVIF on first request, and widely supported.
    formats: ['image/webp'],
    deviceSizes: [390, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/demo/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ]
  },
}

export default nextConfig
