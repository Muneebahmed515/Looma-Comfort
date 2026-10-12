import 'server-only'
import { demoRows } from '../demo/data'
import { isSupabaseConfigured } from '../env'
import { stableId } from '../ids'
import { createSupabaseServer } from '../supabase/server'
import type { ActivityRow, ContactMessageRow, SubscriberRow } from '../types'
import type { RelationSource } from './fields'

type Row = Record<string, unknown> & { id: string }

const DEMO_TABLES: Record<string, Row[]> = {
  categories: demoRows.categories as unknown as Row[],
  materials: demoRows.materials as unknown as Row[],
  collections: demoRows.collections as unknown as Row[],
  products: demoRows.products as unknown as Row[],
  offers: demoRows.offers as unknown as Row[],
  announcements: demoRows.announcements as unknown as Row[],
  hero_slides: demoRows.hero_slides as unknown as Row[],
  promo_banners: demoRows.promo_banners as unknown as Row[],
  home_sections: demoRows.home_sections as unknown as Row[],
  reviews: demoRows.reviews as unknown as Row[],
  pages: demoRows.pages as unknown as Row[],
  faqs: demoRows.faqs as unknown as Row[],
}

export async function listRows(table: string, sort: { column: string; ascending: boolean }): Promise<Row[]> {
  if (!isSupabaseConfigured) {
    const rows = [...(DEMO_TABLES[table] ?? [])]
    return rows.sort((a, b) => {
      const x = a[sort.column] as string | number | null
      const y = b[sort.column] as string | number | null
      if (x == null) return 1
      if (y == null) return -1
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.ascending ? 1 : -1)
    })
  }
  const db = await createSupabaseServer()
  const { data, error } = await db.from(table).select('*').order(sort.column, { ascending: sort.ascending, nullsFirst: false }).limit(2000)
  if (error) throw new Error(error.message)
  return (data ?? []) as Row[]
}

export async function getRow(table: string, id: string): Promise<Row | null> {
  if (!isSupabaseConfigured) return DEMO_TABLES[table]?.find((r) => r.id === id) ?? null
  const db = await createSupabaseServer()
  const { data } = await db.from(table).select('*').eq('id', id).maybeSingle()
  return (data as Row | null) ?? null
}

export type RelationOptions = Record<RelationSource, { value: string; label: string; hint?: string }[]>

export async function relationOptions(): Promise<RelationOptions> {
  const [categories, collections, products, offers, materials] = await Promise.all([
    listRows('categories', { column: 'sort_order', ascending: true }),
    listRows('collections', { column: 'sort_order', ascending: true }),
    listRows('products', { column: 'name', ascending: true }),
    listRows('offers', { column: 'name', ascending: true }),
    listRows('materials', { column: 'sort_order', ascending: true }),
  ])
  const catName = new Map(categories.map((c) => [c.id, c.name as string]))
  return {
    categories: categories.map((c) => ({
      value: c.id,
      label: c.parent_id ? `${catName.get(c.parent_id as string) ?? ''} › ${c.name}` : (c.name as string),
    })),
    collections: collections.map((c) => ({ value: c.id, label: c.name as string })),
    products: products.map((p) => ({ value: p.id, label: p.name as string, hint: (p.sku as string) ?? undefined })),
    offers: offers.map((o) => ({ value: o.id, label: o.name as string })),
    materials: materials.map((m) => ({ value: m.id, label: m.name as string })),
  }
}

export async function getSettingsRow(): Promise<Record<string, unknown>> {
  if (!isSupabaseConfigured) return demoRows.settings as unknown as Record<string, unknown>
  const db = await createSupabaseServer()
  const { data } = await db.from('site_settings').select('*').eq('id', 1).maybeSingle()
  return { ...(demoRows.settings as unknown as Record<string, unknown>), ...(data ?? {}) }
}

// ---------------------------------------------------------------- inbox, subscribers, activity

const DEMO_MESSAGES: ContactMessageRow[] = [
  {
    id: stableId('msg:1'),
    type: 'custom_order',
    name: 'Zainab Ali',
    phone: '+923001234567',
    email: null,
    city: 'Lahore',
    subject: 'Custom: L-shaped sofa',
    message: 'I need an L-shaped sofa for a 10 by 8 ft lounge, in beige velvet.',
    product_id: null,
    details: { furniture: 'L-shaped sofa', size: '10 ft × 8 ft', material: 'Beige velvet', budget: 'Rs. 100,000 – 200,000' },
    status: 'new',
    created_at: '2026-10-11T14:20:00.000Z',
  },
  {
    id: stableId('msg:2'),
    type: 'contact',
    name: 'Omar Farooq',
    phone: '+923211234567',
    email: 'omar@example.com',
    city: 'Karachi',
    subject: 'Delivery',
    message: 'Do you deliver to DHA Karachi, and how long would the Regal bed take?',
    product_id: null,
    details: {},
    status: 'read',
    created_at: '2026-10-10T09:05:00.000Z',
  },
]

export async function listMessages(): Promise<ContactMessageRow[]> {
  if (!isSupabaseConfigured) return DEMO_MESSAGES
  const db = await createSupabaseServer()
  const { data } = await db.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(500)
  return (data ?? []) as ContactMessageRow[]
}

export async function listSubscribers(): Promise<SubscriberRow[]> {
  if (!isSupabaseConfigured)
    return [
      { id: stableId('sub:1'), email: 'ayesha@example.com', source: 'footer', created_at: '2026-10-09T10:00:00.000Z', unsubscribed_at: null },
      { id: stableId('sub:2'), email: 'hamza@example.com', source: 'footer', created_at: '2026-10-07T18:30:00.000Z', unsubscribed_at: null },
    ]
  const db = await createSupabaseServer()
  const { data } = await db.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }).limit(5000)
  return (data ?? []) as SubscriberRow[]
}

export async function listActivity(limit = 12): Promise<ActivityRow[]> {
  if (!isSupabaseConfigured)
    return [
      { id: 3, user_id: null, user_email: 'demo@loomacomfort.com', action: 'update', entity_type: 'products', entity_id: null, entity_label: 'Round Sheesham Coffee Table', created_at: '2026-10-11T16:02:00.000Z' },
      { id: 2, user_id: null, user_email: 'demo@loomacomfort.com', action: 'insert', entity_type: 'offers', entity_id: null, entity_label: 'White Friday Sofa Sale', created_at: '2026-10-10T11:40:00.000Z' },
      { id: 1, user_id: null, user_email: 'demo@loomacomfort.com', action: 'update', entity_type: 'hero_slides', entity_id: null, entity_label: 'Crafted for the way you live', created_at: '2026-10-09T08:15:00.000Z' },
    ]
  const db = await createSupabaseServer()
  const { data } = await db.from('activity_log').select('*').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []) as ActivityRow[]
}

export async function topRequested(days = 30): Promise<{ product_id: string; name: string; slug: string; clicks: number }[]> {
  const products = await listRows('products', { column: 'name', ascending: true })
  const byId = new Map(products.map((p) => [p.id, p]))
  if (!isSupabaseConfigured) {
    return demoRows.products
      .slice()
      .sort((a, b) => b.order_clicks - a.order_clicks)
      .slice(0, 6)
      .map((p) => ({ product_id: p.id, name: p.name, slug: p.slug, clicks: p.order_clicks }))
  }
  const db = await createSupabaseServer()
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data } = await db.from('whatsapp_clicks').select('product_id').eq('context', 'product').gte('created_at', since).limit(20000)
  const counts = new Map<string, number>()
  for (const r of (data ?? []) as { product_id: string | null }[]) if (r.product_id) counts.set(r.product_id, (counts.get(r.product_id) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, clicks]) => ({ product_id: id, name: (byId.get(id)?.name as string) ?? 'Deleted product', slug: (byId.get(id)?.slug as string) ?? '', clicks }))
}

export async function clickTotals(days = 30): Promise<{ total: number; product: number }> {
  if (!isSupabaseConfigured) return { total: 412, product: 318 }
  const db = await createSupabaseServer()
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const [all, product] = await Promise.all([
    db.from('whatsapp_clicks').select('id', { count: 'exact', head: true }).gte('created_at', since),
    db.from('whatsapp_clicks').select('id', { count: 'exact', head: true }).eq('context', 'product').gte('created_at', since),
  ])
  return { total: all.count ?? 0, product: product.count ?? 0 }
}

export async function storageUsageBytes(): Promise<number | null> {
  if (!isSupabaseConfigured) return 6_200_000
  const db = await createSupabaseServer()
  const { data, error } = await db.rpc('storage_usage_bytes')
  if (error) return null
  return Number(data ?? 0)
}

export async function listTeam(): Promise<{ user_id: string; email: string | null; full_name: string | null; role: 'owner' | 'editor'; created_at: string }[]> {
  if (!isSupabaseConfigured) return [{ user_id: 'demo', email: 'demo@loomacomfort.com', full_name: 'Demo admin', role: 'owner', created_at: '2026-10-01T09:00:00.000Z' }]
  const db = await createSupabaseServer()
  const { data } = await db.from('admin_users').select('*').order('created_at', { ascending: true })
  return (data ?? []) as never
}
