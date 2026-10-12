'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import { useActionState, useState } from 'react'
import { IconStar } from '@/components/icons'
import { Honeypot, Turnstile } from '@/components/ui/turnstile'
import { submitReview } from '@/lib/actions/public'
import { cn } from '@/lib/cn'
import { Field, inputClass } from '@/components/ui/field'

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [state, action, pending] = useActionState(submitReview, null)

  if (state?.ok) {
    return <p className="border border-line bg-surface px-5 py-4 text-[0.95rem] text-walnut">{state.message}</p>
  }

  return (
    <div>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary">
          Write a review
        </button>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <m.form
            action={action}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative overflow-hidden"
          >
            <div className="grid gap-5 border border-line bg-surface p-5 sm:grid-cols-2 sm:p-7">
              <input type="hidden" name="productId" value={productId} />
              <input type="hidden" name="rating" value={rating} />
              <Honeypot />
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-[0.85rem] text-walnut">Your rating</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      aria-pressed={rating === n}
                      className="grid size-10 place-items-center"
                    >
                      <IconStar size={24} className={cn('transition-colors', n <= rating ? 'text-gold' : 'text-line-strong')} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <Field label="Name" error={state?.errors?.name}>
                <input name="name" required maxLength={80} autoComplete="name" className={inputClass} defaultValue={state?.values?.name} />
              </Field>
              <Field label="City" optional>
                <input name="city" maxLength={60} autoComplete="address-level2" className={inputClass} defaultValue={state?.values?.city} />
              </Field>
              <Field label="Your review" error={state?.errors?.body} className="sm:col-span-2">
                <textarea name="body" required rows={4} maxLength={2000} className={cn(inputClass, 'h-auto py-3')} defaultValue={state?.values?.body} />
              </Field>
              <div className="sm:col-span-2">
                <Turnstile />
                {state && !state.ok && <p className="mb-3 text-[0.85rem] text-error">{state.message}</p>}
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? 'Sending…' : 'Submit review'}
                </button>
                <p className="mt-3 text-[0.78rem] text-taupe">Reviews are checked before they appear.</p>
              </div>
            </div>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  )
}
