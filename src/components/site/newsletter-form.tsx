'use client'

import { useActionState } from 'react'
import { IconArrowRight } from '@/components/icons'
import { Honeypot, Turnstile } from '@/components/ui/turnstile'
import { subscribeNewsletter } from '@/lib/actions/public'

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, null)
  return (
    <form action={action} className="relative">
      <input type="hidden" name="source" value="footer" />
      <Honeypot />
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex items-center border-b border-ivory/40 focus-within:border-gold">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          className="min-w-0 flex-1 bg-transparent py-3 text-[0.95rem] text-ivory placeholder:text-ivory/50 focus:outline-none"
        />
        <button type="submit" disabled={pending} className="link-arrow t-label py-3 pl-4 text-[0.72rem] text-gold disabled:opacity-60" aria-label="Subscribe">
          {pending ? 'Sending' : 'Subscribe'} <IconArrowRight size={14} />
        </button>
      </div>
      <Turnstile />
      {state && (
        <p role="status" className={`mt-3 text-[0.85rem] ${state.ok ? 'text-gold-soft' : 'text-[#f0b8ad]'}`}>
          {state.message}
        </p>
      )}
    </form>
  )
}
