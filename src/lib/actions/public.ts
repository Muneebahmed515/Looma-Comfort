'use server'

import { z } from 'zod'
import { normalizePkPhone } from '../format'
import { clientIpHash, memoryRateLimit, verifyTurnstile } from '../server/spam'
import { createSecretClient, hasSecretKey } from '../supabase/secret'

export interface FormState {
  ok: boolean
  message: string
  errors?: Record<string, string>
  /** Echo of the submitted values so the form can offer a WhatsApp hand-off. */
  values?: Record<string, string>
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim()

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

async function guard(fd: FormData, bucket: string): Promise<{ ipHash: string } | FormState> {
  // Honeypot: real visitors never fill the hidden "company" field.
  if (str(fd, 'company')) return { ok: true, message: 'Thank you.' }
  if (!(await verifyTurnstile(str(fd, 'cf-turnstile-response')))) {
    return { ok: false, message: 'Please confirm you are not a robot and try again.' }
  }
  const ipHash = await clientIpHash()
  if (!memoryRateLimit(`${bucket}:${ipHash}`, 5, 10 * 60 * 1000)) {
    return { ok: false, message: 'Too many attempts. Please wait a few minutes, or message us on WhatsApp.' }
  }
  return { ipHash }
}

async function recentCount(table: string, ipHash: string, minutes: number): Promise<number> {
  const db = createSecretClient()
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString()
  const { count } = await db.from(table).select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', since)
  return count ?? 0
}

// ---------------------------------------------------------------- newsletter
const emailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address.').max(200)

export async function subscribeNewsletter(_prev: FormState | null, fd: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(str(fd, 'email'))
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message }
  const g = await guard(fd, 'newsletter')
  if ('ok' in g) return g
  if (!hasSecretKey) return { ok: true, message: 'Thank you for subscribing. (Demo mode: not saved.)' }
  const db = createSecretClient()
  const { error } = await db
    .from('newsletter_subscribers')
    .upsert({ email: parsed.data, source: str(fd, 'source') || 'footer', ip_hash: g.ipHash, unsubscribed_at: null }, { onConflict: 'email' })
  if (error) return { ok: false, message: 'Something went wrong. Please try again.' }
  return { ok: true, message: 'Thank you. You will hear about new arrivals and private offers first.' }
}

// ---------------------------------------------------------------- contact + custom orders
const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = normalizePkPhone(v)
      if (!n) ctx.addIssue({ code: 'custom', message: 'Please enter a valid mobile number, e.g. 0300 1234567.' })
      return n ?? v
    }),
  email: z.union([z.literal(''), z.string().trim().email('Please enter a valid email address.').max(200)]),
  city: z.string().trim().max(60),
  subject: z.string().trim().max(80),
  message: z.string().trim().min(5, 'Please write a short message.').max(4000),
})

export async function submitContact(_prev: FormState | null, fd: FormData): Promise<FormState> {
  const raw = {
    name: str(fd, 'name'),
    phone: str(fd, 'phone'),
    email: str(fd, 'email'),
    city: str(fd, 'city'),
    subject: str(fd, 'subject'),
    message: str(fd, 'message'),
  }
  const parsed = contactSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error), values: raw }
  const g = await guard(fd, 'contact')
  if ('ok' in g) return { ...g, values: raw }
  if (hasSecretKey) {
    if ((await recentCount('contact_messages', g.ipHash, 60)) >= 6) {
      return { ok: false, message: 'We have received several messages from you already. Please message us on WhatsApp.', values: raw }
    }
    const db = createSecretClient()
    const { error } = await db.from('contact_messages').insert({
      type: 'contact',
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      city: parsed.data.city || null,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
      ip_hash: g.ipHash,
    })
    if (error) return { ok: false, message: 'Something went wrong. Please try again or message us on WhatsApp.', values: raw }
  }
  return { ok: true, message: 'Thank you. We have received your message and will reply soon.', values: raw }
}

const customSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  phone: contactSchema.shape.phone,
  city: z.string().trim().max(60),
  furniture: z.string().trim().min(2, 'What would you like us to make?').max(120),
  size: z.string().trim().max(200),
  material: z.string().trim().max(200),
  budget: z.string().trim().max(60),
  notes: z.string().trim().max(3000),
})

export async function submitCustomOrder(_prev: FormState | null, fd: FormData): Promise<FormState> {
  const raw = {
    name: str(fd, 'name'),
    phone: str(fd, 'phone'),
    city: str(fd, 'city'),
    furniture: str(fd, 'furniture'),
    size: str(fd, 'size'),
    material: str(fd, 'material'),
    budget: str(fd, 'budget'),
    notes: str(fd, 'notes'),
  }
  const parsed = customSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error), values: raw }
  const g = await guard(fd, 'custom')
  if ('ok' in g) return { ...g, values: raw }
  if (hasSecretKey) {
    if ((await recentCount('contact_messages', g.ipHash, 60)) >= 6) {
      return { ok: false, message: 'We have received several requests from you already. Please message us on WhatsApp.', values: raw }
    }
    const d = parsed.data
    const db = createSecretClient()
    const { error } = await db.from('contact_messages').insert({
      type: 'custom_order',
      name: d.name,
      phone: d.phone,
      city: d.city || null,
      subject: `Custom: ${d.furniture}`,
      message: d.notes || `Custom ${d.furniture}`,
      details: { furniture: d.furniture, size: d.size, material: d.material, budget: d.budget },
      ip_hash: g.ipHash,
    })
    if (error) return { ok: false, message: 'Something went wrong. Please try again or message us on WhatsApp.', values: raw }
  }
  return { ok: true, message: 'Thank you. Your request is with our workshop team.', values: raw }
}

// ---------------------------------------------------------------- reviews
const reviewSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().trim().min(2, 'Please enter your name.').max(80),
  city: z.string().trim().max(60),
  rating: z.coerce.number().int().min(1, 'Please choose a rating.').max(5),
  body: z.string().trim().min(10, 'Please write at least a sentence.').max(2000),
})

export async function submitReview(_prev: FormState | null, fd: FormData): Promise<FormState> {
  const raw = { productId: str(fd, 'productId'), name: str(fd, 'name'), city: str(fd, 'city'), rating: str(fd, 'rating'), body: str(fd, 'body') }
  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error), values: raw }
  const g = await guard(fd, 'review')
  if ('ok' in g) return g
  if (hasSecretKey) {
    if ((await recentCount('reviews', g.ipHash, 24 * 60)) >= 3) {
      return { ok: false, message: 'Thank you, we already have your reviews for today.' }
    }
    const d = parsed.data
    const db = createSecretClient()
    const { error } = await db.from('reviews').insert({
      product_id: d.productId,
      customer_name: d.name,
      city: d.city || null,
      rating: d.rating,
      body: d.body,
      source: 'website',
      status: 'pending',
      ip_hash: g.ipHash,
    })
    if (error) return { ok: false, message: 'Something went wrong. Please try again.' }
  }
  return { ok: true, message: 'Thank you! Your review will appear once it has been approved.' }
}
