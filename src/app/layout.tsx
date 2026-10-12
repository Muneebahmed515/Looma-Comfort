import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { getSettings } from '@/lib/data/site'
import { SITE_URL } from '@/lib/env'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
})

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin'],
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  const title = s.default_seo_title || `${s.brand_name} | Premium Furniture in Pakistan`
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${s.brand_name}` },
    description: s.default_seo_description ?? undefined,
    applicationName: s.brand_name,
    openGraph: {
      type: 'website',
      siteName: s.brand_name,
      locale: 'en_PK',
      title,
      description: s.default_seo_description ?? undefined,
    },
    twitter: { card: 'summary_large_image' },
    verification: s.gsc_verification ? { google: s.gsc_verification } : undefined,
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = {
  themeColor: '#f8f5ef',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Runs before first paint. Decides whether scroll reveals may pre-hide content (JS available,
// no reduced motion, no Data Saver) and whether the home intro plays (first visit per session).
// If animation code hasn't started within 4 s, everything is simply shown.
const BOOT = `(function(){try{var d=document.documentElement,n=navigator,rm=matchMedia('(prefers-reduced-motion: reduce)').matches,sd=n.connection&&n.connection.saveData,bot=/bot|crawl|spider|slurp|facebookexternalhit|whatsapp/i.test(n.userAgent);if(rm||sd||bot)return;d.classList.add('motion-ok');setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.remove('motion-ok')},4000);if(location.pathname==='/'&&d.getAttribute('data-intro')!=='off'&&!sessionStorage.getItem('lc-intro')){sessionStorage.setItem('lc-intro','1');d.classList.add('intro-play');setTimeout(function(){d.classList.remove('intro-play')},2000)}}catch(e){}})()`

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const settings = await getSettings()
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable}`}
      data-intro={settings.intro_enabled ? 'on' : 'off'}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
