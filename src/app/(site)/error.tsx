'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <section className="container-site flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow-rule t-eyebrow text-gold-text">Something went wrong</p>
      <h1 className="t-h1 mt-4">We could not load this page</h1>
      <p className="t-lead mt-4 max-w-md text-taupe">Please try again in a moment. If it keeps happening, message us on WhatsApp and we will help right away.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
    </section>
  )
}
