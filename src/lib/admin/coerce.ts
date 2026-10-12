import 'server-only'
import { sanitizeRichText } from '../sanitize'
import type { ImageAsset } from '../types'
import { getPath, type FieldDef } from './fields'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function coerceImage(v: unknown): ImageAsset | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.ref !== 'string' || !o.ref) return null
  const ref = o.ref.trim()
  // Only our storage keys or our own static files.
  if (!/^(products|categories|banners|content|brand)\/[\w\-/.]+$/.test(ref) && !/^\/(demo|brand)\/[\w\-.]+$/.test(ref)) return null
  return {
    ref,
    alt: typeof o.alt === 'string' ? o.alt.slice(0, 200) : '',
    w: Number(o.w) || 1600,
    h: Number(o.h) || 1200,
    blur: typeof o.blur === 'string' && o.blur.startsWith('data:image/') && o.blur.length < 4000 ? o.blur : null,
  }
}

function isEmpty(v: unknown) {
  return v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)
}

/** Validates and normalises one field value. Returns [value, error?]. */
export function coerceField(f: FieldDef, raw: unknown): [unknown, string?] {
  const label = f.label
  if (f.required && isEmpty(raw) && f.type !== 'switch') return [null, `${label} is required.`]
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'select':
    case 'color':
    case 'icon': {
      if (isEmpty(raw)) return [null]
      const s = String(raw).trim()
      if (f.maxLength && s.length > f.maxLength) return [s, `${label} must be ${f.maxLength} characters or fewer.`]
      if (f.options && !f.options.some((o) => o.value === s)) return [null, `Choose a valid ${label.toLowerCase()}.`]
      return [s]
    }
    case 'url': {
      if (isEmpty(raw)) return [null]
      const s = String(raw).trim()
      if (!/^(\/[^\s]*|https?:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)$/.test(s)) return [s, `${label} should start with / or https://`]
      return [s]
    }
    case 'slug': {
      const s = String(raw ?? '').trim().toLowerCase()
      if (!SLUG.test(s)) return [s, `${label} can only use lowercase letters, numbers and dashes.`]
      return [s]
    }
    case 'richtext':
      return [isEmpty(raw) ? null : sanitizeRichText(String(raw))]
    case 'number':
    case 'price':
    case 'rating': {
      if (isEmpty(raw)) return [null]
      const n = Number(raw)
      if (!Number.isFinite(n)) return [null, `${label} must be a number.`]
      const v = f.type === 'price' || f.type === 'rating' ? Math.round(n) : n
      if (f.min != null && v < f.min) return [v, `${label} must be at least ${f.min}.`]
      if (f.max != null && v > f.max) return [v, `${label} must be at most ${f.max}.`]
      if (f.type === 'rating' && (v < 1 || v > 5)) return [v, 'Rating must be 1 to 5.']
      return [v]
    }
    case 'switch':
      return [raw === true || raw === 'true' || raw === 'on']
    case 'datetime': {
      if (isEmpty(raw)) return [null]
      const d = new Date(String(raw))
      return Number.isNaN(d.getTime()) ? [null, `${label} is not a valid date.`] : [d.toISOString()]
    }
    case 'date': {
      if (isEmpty(raw)) return [null]
      const s = String(raw).slice(0, 10)
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? [s] : [null, `${label} is not a valid date.`]
    }
    case 'tags': {
      const list = Array.isArray(raw) ? raw : []
      return [[...new Set(list.map((t) => String(t).trim()).filter(Boolean))].slice(0, 40)]
    }
    case 'relation': {
      if (isEmpty(raw)) return [null]
      return UUID.test(String(raw)) ? [String(raw)] : [null, `Choose a valid ${label.toLowerCase()}.`]
    }
    case 'relations': {
      const list = Array.isArray(raw) ? raw : []
      return [[...new Set(list.map(String).filter((x) => UUID.test(x)))]]
    }
    case 'image': {
      const img = coerceImage(raw)
      if (f.required && !img) return [null, `${label} is required.`]
      return [img]
    }
    case 'list': {
      const list = Array.isArray(raw) ? raw : []
      const out: Record<string, unknown>[] = []
      for (const item of list.slice(0, 30)) {
        if (!item || typeof item !== 'object') continue
        const row: Record<string, unknown> = {}
        for (const sub of f.item ?? []) {
          const [v] = coerceField({ ...sub, required: false }, (item as Record<string, unknown>)[sub.name])
          if (v != null) row[sub.name] = v
        }
        if (Object.keys(row).length) out.push(row)
      }
      return [out]
    }
    default:
      return [raw]
  }
}

function isVisible(f: FieldDef, values: Record<string, unknown>) {
  if (!f.showWhen) return true
  return f.showWhen.in.includes(getPath(values, f.showWhen.field) as string | boolean)
}

/** Builds the database payload for a set of fields. Dotted names (blocks.steps) merge into their jsonb column. */
export function buildPayload(fields: FieldDef[], values: Record<string, unknown>): { payload: Record<string, unknown>; errors: Record<string, string> } {
  const payload: Record<string, unknown> = {}
  const errors: Record<string, string> = {}
  for (const f of fields) {
    if (!isVisible(f, values)) continue
    const [value, error] = coerceField(f, getPath(values, f.name))
    if (error) errors[f.name] = error
    const [top, ...rest] = f.name.split('.')
    if (!rest.length) payload[top!] = value
    else {
      const base = (payload[top!] ?? values[top!] ?? {}) as Record<string, unknown>
      payload[top!] = { ...base, [rest.join('.')]: value }
    }
  }
  return { payload, errors }
}
