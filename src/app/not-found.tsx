import type { Metadata } from 'next'
import { NotFoundContent } from '@/components/site/not-found-content'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
}

export default function RootNotFound() {
  return (
    <main>
      <NotFoundContent />
    </main>
  )
}
