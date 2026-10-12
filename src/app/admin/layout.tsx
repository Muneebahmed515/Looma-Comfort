import type { Metadata } from 'next'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Looma Admin' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#4a3022', color: '#f8f5ef', border: 'none', borderRadius: '2px', fontFamily: 'var(--font-sans)' },
        }}
      />
    </>
  )
}
