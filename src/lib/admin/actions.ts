'use server'

import { updateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { generateTempPassword, generateTotpSecret, hashPassword, totpUri, verifyPassword, verifyTotp } from '../auth/crypto'
import { SESSION_COOKIE } from '../auth/session'
import { SITE_TAG } from '../data/site'
import { col, dbErrorMessage, insertSql, query, queryOne, table, transaction, updateSql, type Row } from '../db'
import { slugify } from '../format'
import { isStorageRef } from '../images'
import { deleteMedia } from '../media'
import type { HomeSectionRow, ImageAsset, OptionGroup, ProductImage, Spec } from '../types'
import { actorOf, adminForAction, type ActionResult, type AdminRow } from './auth'
import { buildPayload, coerceField, coerceImage } from './coerce'
import { allFields, type FieldDef } from './fields'
import { RESOURCES, SETTINGS_GROUPS } from './resources'

type Values = Record<string, unknown>

function publish() {
  updateTag(SITE_TAG)
}

function friendlyDbError(e: unknown): string {
  const message = dbErrorMessage(e)
  if (/duplicate key.*slug/i.test(message)) return 'That URL is already used by another item. Please choose a different one.'
  if (/duplicate key.*sku/i.test(message)) return 'That SKU is already used by another product.'
  if (/duplicate key.*email/i.test(message)) return 'That email address is already in use.'
  if (/violates foreign key/i.test(message)) return 'This item is still used elsewhere. Remove those links first.'
  if (/violates check constraint/i.test(message)) return 'One of the values is not allowed. Please check the form.'
  console.error('[db]', message)
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const validIds = (ids: string[]) => (Array.isArray(ids) ? ids : []).filter((x) => typeof x === 'string' && UUID.test(x))

async function nextSortOrder(tableName: string): Promise<number> {
  const row = await queryOne<{ n: number }>(`select coalesce(max(sort_order), -1) + 1 as n from ${table(tableName)}`)
  return Number(row?.n ?? 0)
}

// ---------------------------------------------------------------- generic resources

export async function saveResource(key: string, id: string | null, values: Values): Promise<ActionResult<{ id: string }>> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const def = RESOURCES[key]
  if (!def) return { ok: false, message: 'Unknown section.' }
  if (!id && !def.canCreate) return { ok: false, message: 'New items cannot be added here.' }
  if (id && !UUID.test(id)) return { ok: false, message: 'Item not found.' }
  const { payload, errors } = buildPayload(allFields(def), values)
  if (Object.keys(errors).length) return { ok: false, message: 'Please check the highlighted fields.', errors }
  if (def.key === 'categories' && id && payload.parent_id === id) return { ok: false, message: 'A category cannot belong to itself.', errors: { parent_id: 'Choose a different group.' } }
  if (def.key === 'offers' && payload.discount_type === 'percent' && Number(payload.discount_value) > 95)
    return { ok: false, message: 'Please check the highlighted fields.', errors: { discount_value: 'A percentage can be at most 95.' } }
  if (payload.starts_at && payload.ends_at && String(payload.ends_at) <= String(payload.starts_at))
    return { ok: false, message: 'The end must be after the start.', errors: { ends_at: 'Must be after the start time.' } }

  let before: Values | null = null
  try {
    if (id) {
      before = await queryOne(`select * from ${table(def.table)} where id = $1`, [id])
      if (!before) return { ok: false, message: 'Item not found.' }
      await transaction([updateSql(def.table, payload, { column: 'id', value: id })], actorOf(auth.admin))
    } else {
      if (def.orderable) payload.sort_order = await nextSortOrder(def.table)
      const [rows] = await transaction([insertSql(def.table, { ...(def.defaults ?? {}), ...payload })], actorOf(auth.admin))
      id = String(rows![0]!.id)
    }
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  if (before) {
    // Delete image files that this save replaced or removed.
    const after = collectRefs({ ...before, ...payload })
    await deleteMedia([...collectRefs(before)].filter((r) => !after.has(r)))
  }
  publish()
  return { ok: true, message: 'Saved. The website is updated.', data: { id: id! } }
}

export async function deleteResource(key: string, id: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const def = RESOURCES[key]
  if (!def?.canDelete) return { ok: false, message: 'This cannot be deleted.' }
  if (!UUID.test(id)) return { ok: false, message: 'Item not found.' }
  let before: Row | undefined
  try {
    const [rows] = await transaction([{ text: `delete from ${table(def.table)} where id = $1 returning *`, params: [id] }], actorOf(auth.admin))
    before = rows?.[0]
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  await deleteMedia([...collectRefs(before)])
  publish()
  return { ok: true, message: 'Deleted.' }
}

export async function reorderResource(key: string, ids: string[]): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const tableName = key === 'home_sections' ? 'home_sections' : key === 'products' ? 'products' : RESOURCES[key]?.table
  if (!tableName) return { ok: false, message: 'Unknown section.' }
  const clean = validIds(ids).slice(0, 500)
  try {
    // One statement: sort_order = position in the list.
    await transaction(
      [
        {
          text: `update ${table(tableName)} t set sort_order = x.ord - 1 from unnest($1::uuid[]) with ordinality as x(id, ord) where t.id = x.id`,
          params: [clean],
        },
      ],
      actorOf(auth.admin),
    )
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  publish()
  return { ok: true, message: 'Order saved.' }
}

export async function toggleResource(key: string, id: string, field: string, value: boolean): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const tableName = key === 'products' ? 'products' : RESOURCES[key]?.table
  const allowed = ['is_visible', 'is_active', 'show_in_menu', 'is_featured', 'is_best_seller', 'is_new_arrival']
  if (!tableName || !allowed.includes(field) || !UUID.test(id)) return { ok: false, message: 'Not allowed.' }
  try {
    const statements = [updateSql(tableName, { [field]: Boolean(value) }, { column: 'id', value: id })]
    if (tableName === 'products' && field === 'is_visible' && value) {
      statements.push({ text: 'update public.products set published_at = now() where id = $1 and published_at is null', params: [id] })
    }
    await transaction(statements, actorOf(auth.admin))
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  publish()
  return { ok: true, message: value ? 'Switched on.' : 'Switched off.' }
}

export async function setReviewStatus(id: string, status: 'approved' | 'hidden' | 'pending'): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  if (!['approved', 'hidden', 'pending'].includes(status) || !UUID.test(id)) return { ok: false, message: 'Not allowed.' }
  try {
    await transaction([updateSql('reviews', { status }, { column: 'id', value: id })], actorOf(auth.admin))
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
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
  if (id && !UUID.test(id)) return { ok: false, message: 'Product not found.' }
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
  let before: Values | null = null

  try {
    if (id) {
      before = await queryOne('select * from public.products where id = $1', [id])
      if (!before) return { ok: false, message: 'Product not found.' }
      if (payload.is_visible && !before.published_at) payload.published_at = new Date().toISOString()
      payload.updated_by = auth.admin.id
      await transaction([updateSql('products', payload, { column: 'id', value: id })], actorOf(auth.admin))
    } else {
      payload.sort_order = await nextSortOrder('products')
      payload.created_by = auth.admin.id
      payload.updated_by = auth.admin.id
      if (payload.is_visible) payload.published_at = new Date().toISOString()
      const [rows] = await transaction([insertSql('products', payload)], actorOf(auth.admin))
      id = String(rows![0]!.id)
    }
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }

  if (before) {
    const keep = collectRefs(payload.images)
    await deleteMedia([...collectRefs(before.images)].filter((r) => !keep.has(r)))
  }
  publish()
  return { ok: true, message: payload.is_visible ? 'Published. The website is updated.' : 'Saved as a draft (hidden from the website).', data: { id: id!, slug: String(payload.slug) } }
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  if (!UUID.test(id)) return { ok: false, message: 'Product not found.' }
  const src = await queryOne('select * from public.products where id = $1', [id])
  if (!src) return { ok: false, message: 'Product not found.' }
  const copy = { ...src }
  for (const k of ['id', 'created_at', 'updated_at', 'published_at']) delete copy[k]
  copy.name = `${src.name} (copy)`
  copy.slug = `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`
  copy.sku = src.sku ? `${src.sku}-COPY-${Math.random().toString(36).slice(2, 5).toUpperCase()}` : null
  copy.is_visible = false
  copy.created_by = auth.admin.id
  copy.updated_by = auth.admin.id
  // The copy shares image files with the original; deleting either keeps files the other still uses.
  try {
    const [rows] = await transaction([insertSql('products', copy)], actorOf(auth.admin))
    publish()
    return { ok: true, message: 'Duplicated as a hidden draft.', data: { id: String(rows![0]!.id) } }
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
}

export async function deleteProducts(ids: string[]): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const clean = validIds(ids)
  if (!clean.length) return { ok: false, message: 'Nothing to delete.' }
  let deleted: Row[]
  try {
    const [rows] = await transaction([{ text: 'delete from public.products where id = any($1::uuid[]) returning id, images', params: [clean] }], actorOf(auth.admin))
    deleted = rows ?? []
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  // Keep files still used by other products (e.g. duplicates).
  const remaining = await query<{ images: unknown }>('select images from public.products limit 5000')
  const stillUsed = collectRefs(remaining.map((r) => r.images))
  await deleteMedia([...collectRefs(deleted.map((r) => r.images))].filter((r) => !stillUsed.has(r)))
  publish()
  return { ok: true, message: clean.length === 1 ? 'Product deleted.' : `${clean.length} products deleted.` }
}

export async function bulkUpdateProducts(ids: string[], patch: { is_visible?: boolean; is_best_seller?: boolean; is_new_arrival?: boolean; is_featured?: boolean; stock_status?: string }): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const clean: Values = {}
  for (const k of ['is_visible', 'is_best_seller', 'is_new_arrival', 'is_featured'] as const) if (typeof patch[k] === 'boolean') clean[k] = patch[k]
  if (patch.stock_status && ['in_stock', 'out_of_stock', 'made_to_order'].includes(patch.stock_status)) clean.stock_status = patch.stock_status
  const productIds = validIds(ids)
  if (!Object.keys(clean).length || !productIds.length) return { ok: false, message: 'Nothing to change.' }
  try {
    const statements = [updateSql('products', clean, { column: 'id', in: productIds })]
    if (clean.is_visible === true) {
      statements.push({ text: 'update public.products set published_at = now() where id = any($1::uuid[]) and published_at is null', params: [productIds] })
    }
    await transaction(statements, actorOf(auth.admin))
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  publish()
  return { ok: true, message: `${productIds.length} ${productIds.length === 1 ? 'product' : 'products'} updated.` }
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
  try {
    await transaction([updateSql('site_settings', payload, { column: 'id', value: 1 })], actorOf(auth.admin))
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  publish()
  return { ok: true, message: 'Settings saved. The website is updated.' }
}

export async function saveHomeSections(sections: HomeSectionRow[]): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const types = ['hero', 'categories', 'products', 'promo', 'collection', 'usps', 'testimonials', 'story']
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
      id: typeof s.id === 'string' && UUID.test(s.id) ? s.id : crypto.randomUUID(),
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
  const keep = rows.map((r) => r.id)
  try {
    await transaction(
      [
        ...rows.map((r) => {
          const ins = insertSql('home_sections', r)
          const cols = Object.keys(r).filter((k) => k !== 'id')
          return {
            text: `${ins.text.replace(/ returning id$/, '')} on conflict (id) do update set ${cols.map((c) => `${col(c)} = excluded.${col(c)}`).join(', ')}`,
            params: ins.params,
          }
        }),
        { text: 'delete from public.home_sections where not (id = any($1::uuid[]))', params: [keep] },
      ],
      actorOf(auth.admin),
    )
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  publish()
  return { ok: true, message: 'Home page saved. The website is updated.' }
}

// ---------------------------------------------------------------- inbox + subscribers

export async function setMessageStatus(id: string, status: 'new' | 'read' | 'replied' | 'archived'): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  if (!['new', 'read', 'replied', 'archived'].includes(status) || !UUID.test(id)) return { ok: false, message: 'Not allowed.' }
  try {
    await query('update public.contact_messages set status = $1 where id = $2', [status, id])
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  return { ok: true }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  if (!UUID.test(id)) return { ok: false, message: 'Message not found.' }
  try {
    await query('delete from public.contact_messages where id = $1', [id])
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  return { ok: true, message: 'Message deleted.' }
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  if (!UUID.test(id)) return { ok: false, message: 'Subscriber not found.' }
  try {
    await query('delete from public.newsletter_subscribers where id = $1', [id])
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  return { ok: true, message: 'Subscriber removed.' }
}

// ---------------------------------------------------------------- team

/**
 * Adds a team member with a one-time password that the owner passes on to them
 * (there is no email service). They change it under Account after signing in.
 */
export async function inviteAdmin(email: string, role: 'owner' | 'editor', fullName: string): Promise<ActionResult<{ password: string }>> {
  const auth = await adminForAction({ owner: true })
  if ('error' in auth) return auth.error
  const clean = String(email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, message: 'Please enter a valid email address.' }
  const existing = await queryOne('select user_id from public.admin_users where email = $1', [clean])
  if (existing) return { ok: false, message: 'This person already has access.' }
  const password = generateTempPassword()
  try {
    await query('insert into public.admin_users (email, role, full_name, password_hash) values ($1, $2, $3, $4)', [
      clean,
      role === 'owner' ? 'owner' : 'editor',
      String(fullName ?? '').trim() || null,
      await hashPassword(password),
    ])
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  return { ok: true, message: `Added ${clean}.`, data: { password } }
}

/** Owner only: gives a team member a new one-time password and signs them out everywhere. */
export async function resetMemberPassword(userId: string): Promise<ActionResult<{ password: string }>> {
  const auth = await adminForAction({ owner: true })
  if ('error' in auth) return auth.error
  if (!UUID.test(userId)) return { ok: false, message: 'Not found.' }
  if (userId === auth.admin.id) return { ok: false, message: 'Change your own password under Account.' }
  const password = generateTempPassword()
  const rows = await query(
    'update public.admin_users set password_hash = $1, totp_secret = null, totp_pending = null, session_version = session_version + 1 where user_id = $2 returning user_id',
    [await hashPassword(password), userId],
  )
  if (!rows.length) return { ok: false, message: 'Not found.' }
  return { ok: true, message: 'New one-time password created.', data: { password } }
}

export async function removeAdmin(userId: string): Promise<ActionResult> {
  const auth = await adminForAction({ owner: true })
  if ('error' in auth) return auth.error
  if (userId === auth.admin.id) return { ok: false, message: 'You cannot remove yourself.' }
  if (!UUID.test(userId)) return { ok: false, message: 'Not found.' }
  try {
    await query('delete from public.admin_users where user_id = $1', [userId])
  } catch (e) {
    return { ok: false, message: friendlyDbError(e) }
  }
  return { ok: true, message: 'Access removed.' }
}

// ---------------------------------------------------------------- account

export async function changePassword(password: string, current: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  if (String(password ?? '').length < 10) return { ok: false, message: 'Use at least 10 characters.' }
  const row = await queryOne<AdminRow>('select password_hash from public.admin_users where user_id = $1', [auth.admin.id])
  if (!(await verifyPassword(String(current ?? ''), row?.password_hash))) return { ok: false, message: 'Your current password is not correct.' }
  await query('update public.admin_users set password_hash = $1 where user_id = $2', [await hashPassword(password), auth.admin.id])
  return { ok: true, message: 'Password updated.' }
}

export async function twoStepStatus(): Promise<ActionResult<{ enabled: boolean }>> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const row = await queryOne<{ enabled: boolean }>('select (totp_secret is not null) as enabled from public.admin_users where user_id = $1', [auth.admin.id])
  return { ok: true, data: { enabled: Boolean(row?.enabled) } }
}

export async function startTwoStepSetup(): Promise<ActionResult<{ qr: string; secret: string }>> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const secret = generateTotpSecret()
  await query('update public.admin_users set totp_pending = $1 where user_id = $2', [secret, auth.admin.id])
  const qr = await QRCode.toDataURL(totpUri(secret, auth.admin.email), { margin: 1, width: 320 })
  return { ok: true, data: { qr, secret } }
}

export async function confirmTwoStepSetup(code: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const row = await queryOne<{ totp_pending: string | null }>('select totp_pending from public.admin_users where user_id = $1', [auth.admin.id])
  if (!row?.totp_pending || !verifyTotp(row.totp_pending, String(code ?? ''))) return { ok: false, message: 'That code did not work. Try again.' }
  // This session already passed sign in, so it stays valid.
  await query('update public.admin_users set totp_secret = totp_pending, totp_pending = null where user_id = $1', [auth.admin.id])
  return { ok: true, message: 'Two-step sign in is on.' }
}

export async function disableTwoStep(code: string): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  const row = await queryOne<{ totp_secret: string | null }>('select totp_secret from public.admin_users where user_id = $1', [auth.admin.id])
  if (row?.totp_secret && !verifyTotp(row.totp_secret, String(code ?? ''))) return { ok: false, message: 'That code did not work. Try again.' }
  await query('update public.admin_users set totp_secret = null, totp_pending = null where user_id = $1', [auth.admin.id])
  return { ok: true, message: 'Two-step sign in turned off.' }
}

export async function refreshWebsite(): Promise<ActionResult> {
  const auth = await adminForAction()
  if ('error' in auth) return auth.error
  publish()
  return { ok: true, message: 'The website will show the latest content on the next visit.' }
}

export async function signOut() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}

export async function suggestSlug(name: string): Promise<string> {
  return slugify(name)
}

export type { ImageAsset }
