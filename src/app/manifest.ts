import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Looma Comfort',
    short_name: 'Looma',
    description: 'Premium furniture, delivered across Pakistan.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f5ef',
    theme_color: '#4a3022',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
