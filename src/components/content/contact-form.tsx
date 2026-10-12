'use client'

import { AnimatePresence } from 'framer-motion'
import * as m from 'framer-motion/m'
import { useActionState } from 'react'
import { IconCheck, IconWhatsApp } from '@/components/icons'
import { Field, inputClass } from '@/components/ui/field'
import { Honeypot, Turnstile } from '@/components/ui/turnstile'
import { submitContact } from '@/lib/actions/public'
import { cn } from '@/lib/cn'
import { trackWhatsApp } from '@/lib/track'
import { whatsappLink } from '@/lib/whatsapp'

export const PK_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Gujranwala',
  'Sialkot',
  'Hyderabad',
  'Quetta',
  'Bahawalpur',
  'Sargodha',
  'Abbottabad',
  'Other',
]

const SUBJECTS = ['General question', 'Order', 'Custom furniture', 'Delivery', 'After-sales', 'Other']

export function ContactForm({ whatsappNumber }: { whatsappNumber: string | null }) {
  const [state, action, pending] = useActionState(submitContact, null)
  const v = state?.values ?? {}

  if (state?.ok) {
    const text = [
      'Hello Looma Comfort, I just sent a message on your website:',
      '',
      v.subject ? `Subject: ${v.subject}` : '',
      v.message ?? '',
      '',
      `${v.name ?? ''}${v.city ? `, ${v.city}` : ''}`,
    ]
      .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
      .join('\n')
    const href = whatsappLink(whatsappNumber, text)
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="border border-line bg-surface p-8 lg:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-walnut text-ivory">
          <IconCheck size={22} />
        </span>
        <h2 className="t-h3 mt-6">Thank you{v.name ? `, ${v.name.split(' ')[0]}` : ''}</h2>
        <p className="mt-3 text-taupe-deep">{state.message} For the fastest reply, continue the conversation on WhatsApp. Your message is ready to send.</p>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('contact')} className="btn btn-primary mt-8">
            <IconWhatsApp size={18} /> Continue on WhatsApp
          </a>
        )}
      </m.div>
    )
  }

  return (
    <form action={action} className="relative grid gap-5 sm:grid-cols-2" noValidate>
      <Honeypot />
      <Field label="Your name" error={state?.errors?.name}>
        <input name="name" required autoComplete="name" defaultValue={v.name} className={inputClass} aria-invalid={Boolean(state?.errors?.name)} />
      </Field>
      <Field label="Mobile number" error={state?.errors?.phone} hint="We will reply on WhatsApp or call">
        <input
          name="phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0300 1234567"
          defaultValue={v.phone}
          className={inputClass}
          aria-invalid={Boolean(state?.errors?.phone)}
        />
      </Field>
      <Field label="Email" optional error={state?.errors?.email}>
        <input name="email" type="email" autoComplete="email" defaultValue={v.email} className={inputClass} aria-invalid={Boolean(state?.errors?.email)} />
      </Field>
      <Field label="City" optional>
        <select name="city" defaultValue={v.city ?? ''} className={cn(inputClass, 'appearance-none')}>
          <option value="">Select your city</option>
          {PK_CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label="Subject" optional className="sm:col-span-2">
        <select name="subject" defaultValue={v.subject ?? ''} className={cn(inputClass, 'appearance-none')}>
          <option value="">What is this about?</option>
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Message" error={state?.errors?.message} className="sm:col-span-2">
        <textarea name="message" required rows={5} defaultValue={v.message} className={cn(inputClass, 'h-auto py-3')} aria-invalid={Boolean(state?.errors?.message)} />
      </Field>
      <div className="sm:col-span-2">
        <Turnstile />
        <AnimatePresence>
          {state && !state.ok && (
            <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-[0.88rem] text-error" role="alert">
              {state.message}
            </m.p>
          )}
        </AnimatePresence>
        <button type="submit" disabled={pending} className="btn btn-primary btn-lg w-full sm:w-auto">
          {pending ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
