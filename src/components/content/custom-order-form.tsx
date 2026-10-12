'use client'

import * as m from 'framer-motion/m'
import { useActionState } from 'react'
import { IconCheck, IconWhatsApp } from '@/components/icons'
import { Field, inputClass } from '@/components/ui/field'
import { Honeypot, Turnstile } from '@/components/ui/turnstile'
import { submitCustomOrder } from '@/lib/actions/public'
import { cn } from '@/lib/cn'
import { trackWhatsApp } from '@/lib/track'
import { buildCustomOrderMessage, whatsappLink } from '@/lib/whatsapp'
import { PK_CITIES } from './contact-form'

const BUDGETS = ['Under Rs. 50,000', 'Rs. 50,000 – 100,000', 'Rs. 100,000 – 200,000', 'Above Rs. 200,000', 'Not sure yet']

export function CustomOrderForm({ whatsappNumber, baseMessage }: { whatsappNumber: string | null; baseMessage: string }) {
  const [state, action, pending] = useActionState(submitCustomOrder, null)
  const v = state?.values ?? {}

  if (state?.ok) {
    const text = buildCustomOrderMessage(baseMessage, {
      'Furniture': v.furniture ?? '',
      'Approximate size': v.size ?? '',
      'Material / finish': v.material ?? '',
      'Budget': v.budget ?? '',
      'City': v.city ?? '',
      'Notes': v.notes ?? '',
      'Name': v.name ?? '',
    })
    const href = whatsappLink(whatsappNumber, `${text}\n\nI can share photos or a sketch here.`)
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="border border-line bg-surface p-8 lg:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-walnut text-ivory">
          <IconCheck size={22} />
        </span>
        <h3 className="t-h3 mt-6">Your request is with our workshop</h3>
        <p className="mt-3 text-taupe-deep">
          {state.message} Send it on WhatsApp too, and share any photos or sketches. That is where we will discuss the details and price.
        </p>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('customize')} className="btn btn-primary mt-8">
            <IconWhatsApp size={18} /> Continue on WhatsApp
          </a>
        )}
      </m.div>
    )
  }

  return (
    <form action={action} className="relative grid gap-5 sm:grid-cols-2" noValidate>
      <Honeypot />
      <Field label="What would you like us to make?" error={state?.errors?.furniture} className="sm:col-span-2">
        <input name="furniture" required placeholder="e.g. L-shaped sofa, 8-seater dining table" defaultValue={v.furniture} className={inputClass} />
      </Field>
      <Field label="Approximate size" optional>
        <input name="size" placeholder="e.g. 9 ft × 6 ft" defaultValue={v.size} className={inputClass} />
      </Field>
      <Field label="Material or finish" optional>
        <input name="material" placeholder="e.g. sheesham, velvet in beige" defaultValue={v.material} className={inputClass} />
      </Field>
      <Field label="Budget" optional>
        <select name="budget" defaultValue={v.budget ?? ''} className={cn(inputClass, 'appearance-none')}>
          <option value="">Select a range</option>
          {BUDGETS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </Field>
      <Field label="City" optional>
        <select name="city" defaultValue={v.city ?? ''} className={cn(inputClass, 'appearance-none')}>
          <option value="">Select your city</option>
          {PK_CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Your name" error={state?.errors?.name}>
        <input name="name" required autoComplete="name" defaultValue={v.name} className={inputClass} />
      </Field>
      <Field label="Mobile number" error={state?.errors?.phone}>
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" defaultValue={v.phone} className={inputClass} />
      </Field>
      <Field label="Anything else?" optional className="sm:col-span-2">
        <textarea name="notes" rows={4} placeholder="Tell us about your space, colours you love, or a design you have seen." defaultValue={v.notes} className={cn(inputClass, 'h-auto py-3')} />
      </Field>
      <div className="sm:col-span-2">
        <Turnstile />
        {state && !state.ok && (
          <p className="mb-4 text-[0.88rem] text-error" role="alert">
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg w-full sm:w-auto">
          {pending ? 'Sending…' : 'Send my request'}
        </button>
      </div>
    </form>
  )
}
