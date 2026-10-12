'use server'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { SITE_TAG } from '../data/site'
import { slugify } from '../format'
import { STORAGE_WIDTHS, isStorageRef, withWidth } from '../images'
import { createSecretClient, hasSecretKey } from '../supabase/secret'
import { createSupabaseServer } from '../supabase/server'
import type { HomeSectionRow, ImageAsset, OptionGroup, ProductImage, Spec } from '../types'
import { adminForAction, type ActionResult } from './auth'
import { buildPayload, coerceField, coerceImage } from './coerce'
import { allFields, type FieldDef } from './fields'
import { RESOURCES, SETTINGS_GROUPS } from './resources'

type Values = Record<string, unknown>

function publish() {
  updateTag(SITE_TAG)
}

function friendlyDbError(message: string): string {
  if (/duplicate key.*slug/i.test(message)) return 'That URL is already used by another item. Please choose a different one.'
  if (/duplicate key.*sku/i.test(message)) return 'That SKU is already used by another product.'
  if (/violates foreign key/i.test(message)) return 'This item is still used elsewhere. Remove those links first.'
  if (/row-level security/i.test(message)) return 'You do not have permission to change this.'
  return 'Could not save. Please try again.'
}

/** Collects storage refs inside any value (images, lists of images, nested objects). */
function collectRefs(value: unknown, out = new Set<string>()): Set<string> {
  if (!value) return out
  if (Array.isArray(value)) value.forEach((v) => collectRefs(v, out))
  else if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    if (typeof o.ref === 'string' && isStorageRef(o.ref)) out.add(o.ref)
    Object.values(o).forEach((v) => typeof v === 'object' && collectRefs(v, out))
  }
  return out
}

/** Deletes every generated size of images that are no longer used. Never blocks a save. */
async function removeStorage(refs: string[]) {
  if (!refs.length) return
  try {
    const db = await createSupabaseServer()
    const byBucket = new Map<string, string[]>()
    for (const ref of refs) {
      const [bucket, ...rest] = ref.split('/')
      const path = rest.join('/')
      const list = byBucket.get(bucket!) ?? []
      for (const w of STORAGE_WIDTHS) list.push(withWidth(path, w))
      byBucket.set(bucket!, list)
    }
    await Promise.all([...byBucket.entries()].map(([bucket, paths]) => db.storage.from(bucket).remove(paths)))
  } catch {
    // Orphaned files are harmless; the dashboard shows storage use.
  }
}

// ---------------------------------------------------------------- generic resources

export async function saveResource(key: string, id: string | null, values: Values): Promise<ActionResult<{ id: string }>> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const def = RESOURCES[key]
  if (!def) return { ok: false, message: 'Unknown section.' }
  if (!id && !def.canCreate) return { ok: false, message: 'New items cannot be added here.' }
  const { payload, errors } = buildPayload(allFields(def), values)
  if (Object.keys(errors).length) return { ok: false, message: 'Please check the highlighted fields.', errors }
  if (def.key === 'categories' && id && payload.parent_id === id) return { ok: false, message: 'A category cannot belong to itself.', errors: { parent_id: 'Choose a different group.' } }
  if (def.key === 'offers' && payload.discount_type === 'percent' && Number(payload.discount_value) > 95)
    return { ok: false, message: 'Please check the highlighted fields.', errors: { discount_value: 'A percentage can be at most 95.' } }
  if (payload.starts_at && payload.ends_at && String(payload.ends_at) <= String(payload.starts_at))
    return { ok: false, message: 'The end must be after the start.', errors: { ends_at: 'Must be after the start time.' } }

  const db = await createSupabaseServer()
  let before: Values | null = null
  if (id) {
    const { data } = await db.from(def.table).select('*').eq('id', id).maybeSingle()
    before = data as Values | null
    const { error } = await db.from(def.table).update(payload).eq('id', id)
    if (error) return { ok: false, message: friendlyDbError(error.message) }
  } else {
    if (def.orderable) {
      const { data: last } = await db.from(def.table).select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
      payload.sort_order = ((last?.sort_order as number | undefined) ?? -1) + 1
    }
    const { data, error } = await db.from(def.table).insert({ ...(def.defaults ?? {}), ...payload }).select('id').single()
    if (error) return { ok: false, message: friendlyDbError(error.message) }
    id = data.id as string
  }
  if (before) {
    // Delete image files that this save replaced or removed.
    const after = collectRefs({ ...before, ...payload })
    await removeStorage([...collectRefs(before)].filter((r) => !after.has(r)))
  }
  publish()
  return { ok: true, message: 'Saved. The website is updated.', data: { id: id! } }
}

export async function deleteResource(key: string, id: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const def = RESOURCES[key]
  if (!def?.canDelete) return { ok: false, message: 'This cannot be deleted.' }
  const db = await createSupabaseServer()
  const { data: before } = await db.from(def.table).select('*').eq('id', id).maybeSingle()
  const { error } = await db.from(def.table).delete().eq('id', id)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  await removeStorage([...collectRefs(before)])
  publish()
  return { ok: true, message: 'Deleted.' }
}

export async function reorderResource(key: string, ids: string[]): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const table = key === 'home_sections' ? 'home_sections' : key === 'products' ? 'products' : RESOURCES[key]?.table
  if (!table) return { ok: false, message: 'Unknown section.' }
  const db = await createSupabaseServer()
  const results = await Promise.all(ids.slice(0, 500).map((rowId, i) => db.from(table).update({ sort_order: i }).eq('id', rowId)))
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, message: friendlyDbError(failed.error.message) }
  publish()
  return { ok: true, message: 'Order saved.' }
}

export async function toggleResource(key: string, id: string, field: string, value: boolean): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const table = key === 'products' ? 'products' : RESOURCES[key]?.table
  const allowed = ['is_visible', 'is_active', 'show_in_menu', 'is_featured', 'is_best_seller', 'is_new_arrival']
  if (!table || !allowed.includes(field)) return { ok: false, message: 'Not allowed.' }
  const db = await createSupabaseServer()
  const patch: Values = { [field]: value }
  if (table === 'products' && field === 'is_visible' && value) patch.published_at = new Date().toISOString()
  const { error } = await db.from(table).update(patch).eq('id', id)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  publish()
  return { ok: true, message: value ? 'Switched on.' : 'Switched off.' }
}

export async function setReviewStatus(id: string, status: 'approved' | 'hidden' | 'pending'): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const db = await createSupabaseServer()
  const { error } = await db.from('reviews').update({ status }).eq('id', id)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  publish()
  return { ok: true, message: status === 'approved' ? 'Review approved.' : status === 'hidden' ? 'Review hidden.' : 'Review moved back to pending.' }
}

// ---------------------------------------------------------------- products

export interface ProductInput {
  name: string
  slug: string
  sku: string
  category_id: string | null
  short_description: string
  description_html: string
  price: number | string
  sale_price: number | string | null
  price_on_request: boolean
  stock_status: string
  lead_time: string
  images: ProductImage[]
  options: OptionGroup[]
  specifications: Spec[]
  care_html: string
  delivery_html: string
  material_ids: string[]
  collection_ids: string[]
  related_ids: string[]
  tags: string[]
  is_best_seller: boolean
  is_new_arrival: boolean
  is_featured: boolean
  is_visible: boolean
  seo_title: string
  seo_description: string
}

const f = (name: string, label: string, type: FieldDef['type'], extra: Partial<FieldDef> = {}): FieldDef => ({ name, label, type, ...extra })

const PRODUCT_FIELDS: FieldDef[] = [
  f('name', 'Name', 'text', { required: true, maxLength: 160 }),
  f('slug', 'URL', 'slug', { required: true }),
  f('sku', 'SKU', 'text', { maxLength: 40 }),
  f('category_id', 'Category', 'relation'),
  f('short_description', 'Short description', 'textarea', { maxLength: 400 }),
  f('description_html', 'Description', 'richtext'),
  f('price', 'Price', 'price', { required: true, min: 0, max: 100000000 }),
  f('sale_price', 'Sale price', 'price', { min: 0 }),
  f('price_on_request', 'Price on request', 'switch'),
  f('stock_status', 'Stock', 'select', {
    options: [
      { value: 'in_stock', label: '' },
      { value: 'made_to_order', label: '' },
      { value: 'out_of_stock', label: '' },
    ],
  }),
  f('lead_time', 'Delivery time', 'text', { maxLength: 120 }),
  f('care_html', 'Care', 'richtext'),
  f('delivery_html', 'Delivery', 'richtext'),
  f('material_ids', 'Materials', 'relations'),
  f('collection_ids', 'Collections', 'relations'),
  f('related_ids', 'Related products', 'relations'),
  f('tags', 'Tags', 'tags'),
  f('is_best_seller', 'Best seller', 'switch'),
  f('is_new_arrival', 'New arrival', 'switch'),
  f('is_featured', 'Featured', 'switch'),
  f('is_visible', 'Visible', 'switch'),
  f('seo_title', 'SEO title', 'text', { maxLength: 70 }),
  f('seo_description', 'SEO description', 'textarea', { maxLength: 170 }),
]

function cleanOptions(raw: unknown): OptionGroup[] {
  if (!Array.isArray(raw)) return []
  const uuid = () => crypto.randomUUID()
  return raw
    .slice(0, 6)
    .map((g) => {
      const grp = g as Partial<OptionGroup>
      const values = (Array.isArray(grp.values) ? grp.values : [])
        .slice(0, 30)
        .map((v) => ({
          id: typeof v.id === 'string' && v.id ? v.id : uuid(),
          label: String(v.label ?? '').trim().slice(0, 80),
          price_delta: Math.round(Number(v.price_delta) || 0),
          swatch_hex: typeof v.swatch_hex === 'string' && /^#[0-9a-f]{6}$/i.test(v.swatch_hex) ? v.swatch_hex : null,
          is_default: Boolean(v.is_default),
          is_available: v.is_available !== false,
        }))
        .filter((v) => v.label)
      return {
        id: typeof grp.id === 'string' && grp.id ? grp.id : uuid(),
        name: String(grp.name ?? '').trim().slice(0, 60),
        display: (['buttons', 'swatches', 'dropdown'] as const).includes(grp.display as never) ? (grp.display as OptionGroup['display']) : 'buttons',
        values,
      }
    })
    .filter((g) => g.name && g.values.length)
}

function cleanSpecs(raw: unknown): Spec[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s) => ({ label: String((s as Spec).label ?? '').trim().slice(0, 60), value: String((s as Spec).value ?? '').trim().slice(0, 200) }))
    .filter((s) => s.label && s.value)
    .slice(0, 30)
}

function cleanImages(raw: unknown): ProductImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .flatMap((r): ProductImage[] => {
      const img = coerceImage(r)
      if (!img) return []
      const opt = (r as ProductImage).option_value_id
      return [{ ...img, option_value_id: typeof opt === 'string' && opt ? opt : null }]
    })
    .slice(0, 20)
}

export async function saveProduct(id: string | null, input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const values = input as unknown as Values
  const { payload, errors } = buildPayload(PRODUCT_FIELDS, values)
  if (payload.sale_price != null && payload.price != null && Number(payload.sale_price) >= Number(payload.price)) {
    errors.sale_price = 'The sale price must be lower than the regular price.'
  }
  if (!payload.price_on_request && !payload.price && payload.price !== 0) errors.price = 'Price is required.'
  if (Object.keys(errors).length) return { ok: false, message: 'Please check the highlighted fields.', errors }

  payload.images = cleanImages(input.images)
  payload.options = cleanOptions(input.options)
  payload.specifications = cleanSpecs(input.specifications)
  if (!payload.sku) payload.sku = null
  const db = await createSupabaseServer()
  let before: Values | null = null

  if (id) {
    const { data } = await db.from('products').select('*').eq('id', id).maybeSingle()
    before = data as Values | null
    if (payload.is_visible && !before?.published_at) payload.published_at = new Date().toISOString()
    payload.updated_by = auth.admin.id
    const { error } = await db.from('products').update(payload).eq('id', id)
    if (error) return { ok: false, message: friendlyDbError(error.message) }
  } else {
    const { data: last } = await db.from('products').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
    payload.sort_order = ((last?.sort_order as number | undefined) ?? -1) + 1
    payload.created_by = auth.admin.id
    payload.updated_by = auth.admin.id
    if (payload.is_visible) payload.published_at = new Date().toISOString()
    const { data, error } = await db.from('products').insert(payload).select('id').single()
    if (error) return { ok: false, message: friendlyDbError(error.message) }
    id = data.id as string
  }

  if (before) {
    const keep = collectRefs(payload.images)
    await removeStorage([...collectRefs(before.images)].filter((r) => !keep.has(r)))
  }
  publish()
  return { ok: true, message: payload.is_visible ? 'Published. The website is updated.' : 'Saved as a draft (hidden from the website).', data: { id: id!, slug: String(payload.slug) } }
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const db = await createSupabaseServer()
  const { data: src } = await db.from('products').select('*').eq('id', id).maybeSingle()
  if (!src) return { ok: false, message: 'Product not found.' }
  const copy = { ...(src as Values) }
  for (const k of ['id', 'created_at', 'updated_at', 'published_at']) delete copy[k]
  copy.name = `${src.name} (copy)`
  copy.slug = `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`
  copy.sku = src.sku ? `${src.sku}-COPY-${Math.random().toString(36).slice(2, 5).toUpperCase()}` : null
  copy.is_visible = false
  copy.created_by = auth.admin.id
  // The copy shares image files with the original; deleting either keeps files the other still uses.
  const { data, error } = await db.from('products').insert(copy).select('id').single()
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  publish()
  return { ok: true, message: 'Duplicated as a hidden draft.', data: { id: data.id as string } }
}

export async function deleteProducts(ids: string[]): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const db = await createSupabaseServer()
  const { data: rows } = await db.from('products').select('id, images').in('id', ids)
  const { error } = await db.from('products').delete().in('id', ids)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  // Keep files still used by other products (e.g. duplicates).
  const { data: remaining } = await db.from('products').select('images').limit(5000)
  const stillUsed = collectRefs((remaining ?? []).map((r) => r.images))
  await removeStorage([...collectRefs((rows ?? []).map((r) => r.images))].filter((r) => !stillUsed.has(r)))
  publish()
  return { ok: true, message: ids.length === 1 ? 'Product deleted.' : `${ids.length} products deleted.` }
}

export async function bulkUpdateProducts(ids: string[], patch: { is_visible?: boolean; is_best_seller?: boolean; is_new_arrival?: boolean; is_featured?: boolean; stock_status?: string }): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const clean: Values = {}
  for (const k of ['is_visible', 'is_best_seller', 'is_new_arrival', 'is_featured'] as const) if (typeof patch[k] === 'boolean') clean[k] = patch[k]
  if (patch.stock_status && ['in_stock', 'out_of_stock', 'made_to_order'].includes(patch.stock_status)) clean.stock_status = patch.stock_status
  if (!Object.keys(clean).length || !ids.length) return { ok: false, message: 'Nothing to change.' }
  const db = await createSupabaseServer()
  const { error } = await db.from('products').update(clean).in('id', ids)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  publish()
  return { ok: true, message: `${ids.length} ${ids.length === 1 ? 'product' : 'products'} updated.` }
}

// ---------------------------------------------------------------- settings + homepage

export async function saveSettings(values: Values): Promise<ActionResult> {
  const auth = await adminForAction({ owner: true })
  if ('error' in auth) return auth.error
  const fields = SETTINGS_GROUPS.flatMap((g) => g.fields).filter((x) => x.name !== 'search_synonyms_text')
  const { payload, errors } = buildPayload(fields, values)
  if (payload.ga4_id && !/^G-[A-Z0-9]{4,16}$/.test(String(payload.ga4_id))) errors.ga4_id = 'Should look like G-XXXXXXXXXX.'
  if (payload.meta_pixel_id && !/^\d{6,20}$/.test(String(payload.meta_pixel_id))) errors.meta_pixel_id = 'Should be numbers only.'
  if (payload.whatsapp_number && String(payload.whatsapp_number).replace(/\D/g, '').length < 10) errors.whatsapp_number = 'Please include the country code, e.g. +92 300 1234567.'
  if (payload.map_embed_url && !/^https:\/\/(www\.)?google\.[a-z.]+\/maps/.test(String(payload.map_embed_url))) errors.map_embed_url = 'Paste the https://www.google.com/maps/embed?… link.'
  if (Object.keys(errors).length) return { ok: false, message: 'Please check the highlighted fields.', errors }
  const synonyms: Record<string, string> = {}
  for (const line of String(values.search_synonyms_text ?? '').split('\n')) {
    const [from, to] = line.split('=').map((s) => s.trim().toLowerCase())
    if (from && to) synonyms[from.slice(0, 40)] = to.slice(0, 40)
  }
  payload.search_synonyms = synonyms
  payload.updated_by = auth.admin.id
  const db = await createSupabaseServer()
  const { error } = await db.from('site_settings').update(payload).eq('id', 1)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  publish()
  return { ok: true, message: 'Settings saved. The website is updated.' }
}

export async function saveHomeSections(sections: HomeSectionRow[]): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const types = ['hero', 'categories', 'products', 'promo', 'collection', 'usps', 'testimonials', 'story']
  const db = await createSupabaseServer()
  const rows = sections.slice(0, 30).map((s, i) => {
    const settings = (s.settings ?? {}) as Values
    const img = coerceImage(settings.image)
    const items = Array.isArray(settings.items)
      ? (settings.items as Values[]).slice(0, 8).map((it) => ({ icon: String(it.icon ?? 'craft'), title: String(it.title ?? '').slice(0, 80), text: String(it.text ?? '').slice(0, 240) }))
      : undefined
    const stats = Array.isArray(settings.stats)
      ? (settings.stats as Values[]).slice(0, 4).map((st) => ({ value: Number(st.value) || 0, suffix: String(st.suffix ?? '').slice(0, 4), label: String(st.label ?? '').slice(0, 40) }))
      : undefined
    const [category_ids] = coerceField({ name: 'c', label: 'c', type: 'relations' }, settings.category_ids)
    const [product_ids] = coerceField({ name: 'p', label: 'p', type: 'relations' }, settings.product_ids)
    return {
      id: s.id,
      type: types.includes(s.type) ? s.type : 'products',
      eyebrow: s.eyebrow?.trim() || null,
      title: s.title?.trim() || null,
      subtitle: s.subtitle?.trim() || null,
      is_visible: Boolean(s.is_visible),
      sort_order: i,
      settings: {
        ...settings,
        image: img ?? undefined,
        items,
        stats,
        category_ids,
        product_ids,
        limit: Math.min(24, Math.max(1, Number(settings.limit) || 8)),
      },
    }
  })
  const { error } = await db.from('home_sections').upsert(rows, { onConflict: 'id' })
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  const keep = rows.map((r) => r.id)
  if (keep.length) await db.from('home_sections').delete().not('id', 'in', `(${keep.join(',')})`)
  publish()
  return { ok: true, message: 'Home page saved. The website is updated.' }
}

// ---------------------------------------------------------------- inbox + subscribers

export async function setMessageStatus(id: string, status: 'new' | 'read' | 'replied' | 'archived'): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const db = await createSupabaseServer()
  const { error } = await db.from('contact_messages').update({ status }).eq('id', id)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  return { ok: true }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const db = await createSupabaseServer()
  const { error } = await db.from('contact_messages').delete().eq('id', id)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  return { ok: true, message: 'Message deleted.' }
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const db = await createSupabaseServer()
  const { error } = await db.from('newsletter_subscribers').delete().eq('id', id)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  return { ok: true, message: 'Subscriber removed.' }
}

// ---------------------------------------------------------------- team + account

export async function inviteAdmin(email: string, role: 'owner' | 'editor', fullName: string): Promise<ActionResult> {
  const auth = await adminForAction({ owner: true })
  if ('error' in auth) return auth.error
  const clean = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, message: 'Please enter a valid email address.' }
  if (!hasSecretKey) return { ok: false, message: 'Add SUPABASE_SECRET_KEY to the environment to invite people from here.' }
  const admin = createSecretClient()
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const { data, error } = await admin.auth.admin.inviteUserByEmail(clean, { redirectTo: `${site}/auth/callback?next=/admin/reset-password` })
  let userId = data?.user?.id
  if (error) {
    // Already registered: look the user up and just grant access.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    userId = list?.users.find((u) => u.email?.toLowerCase() === clean)?.id
    if (!userId) return { ok: false, message: error.message }
  }
  const { error: insertError } = await admin
    .from('admin_users')
    .upsert({ user_id: userId, email: clean, role: role === 'owner' ? 'owner' : 'editor', full_name: fullName.trim() || null }, { onConflict: 'user_id' })
  if (insertError) return { ok: false, message: friendlyDbError(insertError.message) }
  return { ok: true, message: `Invitation sent to ${clean}.` }
}

export async function removeAdmin(userId: string): Promise<ActionResult> {
  const auth = await adminForAction({ owner: true })
  if ('error' in auth) return auth.error
  if (userId === auth.admin.id) return { ok: false, message: 'You cannot remove yourself.' }
  const db = await createSupabaseServer()
  const { error } = await db.from('admin_users').delete().eq('user_id', userId)
  if (error) return { ok: false, message: friendlyDbError(error.message) }
  return { ok: true, message: 'Access removed.' }
}

export async function changePassword(password: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  if (password.length < 10) return { ok: false, message: 'Use at least 10 characters.' }
  const db = await createSupabaseServer()
  const { error } = await db.auth.updateUser({ password })
  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Password updated.' }
}

export async function refreshWebsite(): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  publish()
  return { ok: true, message: 'The website will show the latest content on the next visit.' }
}

export async function signOut() {
  const db = await createSupabaseServer()
  await db.auth.signOut()
  redirect('/admin/login')
}

export async function suggestSlug(name: string): Promise<string> {
  return slugify(name)
}

export type { ImageAsset }
