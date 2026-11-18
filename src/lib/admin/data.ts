import 'server-only'
import { demoRows } from '../demo/data'
import { col, query, queryOne, table as tableName } from '../db'
import { isDbConfigured } from '../env'
import { stableId } from '../ids'
import type { ActivityRow, ContactMessageRow, SubscriberRow } from '../types'
import type { RelationSource } from './fields'
import { mediaUsageBytes } from '../media'

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
  if (!isDbConfigured) {
    const rows = [...(DEMO_TABLES[table] ?? [])]
    return rows.sort((a, b) => {
      const x = a[sort.column] as string | number | null
      const y = b[sort.column] as string | number | null
      if (x == null) return 1
      if (y == null) return -1
      return (x < y ? -1 : x > y ? 1 : 0) * (sort.ascending ? 1 : -1)
    })
  }
  return query<Row>(`select * from ${tableName(table)} order by ${col(sort.column)} ${sort.ascending ? 'asc' : 'desc'} nulls last limit 2000`)
}

export async function getRow(table: string, id: string): Promise<Row | null> {
  if (!isDbConfigured) return DEMO_TABLES[table]?.find((r) => r.id === id) ?? null
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  return queryOne<Row>(`select * from ${tableName(table)} where id = $1`, [id])
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
  if (!isDbConfigured) return demoRows.settings as unknown as Record<string, unknown>
  const data = await queryOne('select * from public.site_settings where id = 1')
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
  if (!isDbConfigured) return DEMO_MESSAGES
  return query<ContactMessageRow>('select * from public.contact_messages order by created_at desc limit 500')
}

export async function listSubscribers(): Promise<SubscriberRow[]> {
  if (!isDbConfigured)
    return [
      { id: stableId('sub:1'), email: 'ayesha@example.com', source: 'footer', created_at: '2026-10-09T10:00:00.000Z', unsubscribed_at: null },
      { id: stableId('sub:2'), email: 'hamza@example.com', source: 'footer', created_at: '2026-10-07T18:30:00.000Z', unsubscribed_at: null },
    ]
  return query<SubscriberRow>('select * from public.newsletter_subscribers order by created_at desc limit 5000')
}

export async function listActivity(limit = 12): Promise<ActivityRow[]> {
  if (!isDbConfigured)
    return [
      { id: 3, user_id: null, user_email: 'demo@loomacomfort.com', action: 'update', entity_type: 'products', entity_id: null, entity_label: 'Round Sheesham Coffee Table', created_at: '2026-10-11T16:02:00.000Z' },
      { id: 2, user_id: null, user_email: 'demo@loomacomfort.com', action: 'insert', entity_type: 'offers', entity_id: null, entity_label: 'White Friday Sofa Sale', created_at: '2026-10-10T11:40:00.000Z' },
      { id: 1, user_id: null, user_email: 'demo@loomacomfort.com', action: 'update', entity_type: 'hero_slides', entity_id: null, entity_label: 'Crafted for the way you live', created_at: '2026-10-09T08:15:00.000Z' },
    ]
  return query<ActivityRow>('select * from public.activity_log order by created_at desc limit $1', [limit])
}

export async function topRequested(days = 30): Promise<{ product_id: string; name: string; slug: string; clicks: number }[]> {
  const products = await listRows('products', { column: 'name', ascending: true })
  const byId = new Map(products.map((p) => [p.id, p]))
  if (!isDbConfigured) {
    return demoRows.products
      .slice()
      .sort((a, b) => b.order_clicks - a.order_clicks)
      .slice(0, 6)
      .map((p) => ({ product_id: p.id, name: p.name, slug: p.slug, clicks: p.order_clicks }))
  }
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const data = await query<{ product_id: string; clicks: number }>(
    `select product_id, count(*)::int as clicks from public.whatsapp_clicks
     where context = 'product' and product_id is not null and created_at >= $1
     group by product_id order by clicks desc limit 6`,
    [since],
  )
  return data.map(({ product_id: id, clicks }) => ({ product_id: id, name: (byId.get(id)?.name as string) ?? 'Deleted product', slug: (byId.get(id)?.slug as string) ?? '', clicks }))
}

export async function clickTotals(days = 30): Promise<{ total: number; product: number }> {
  if (!isDbConfigured) return { total: 412, product: 318 }
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const row = await queryOne<{ total: number; product: number }>(
    `select count(*)::int as total, (count(*) filter (where context = 'product'))::int as product
     from public.whatsapp_clicks where created_at >= $1`,
    [since],
  )
  return { total: row?.total ?? 0, product: row?.product ?? 0 }
}

export async function storageUsageBytes(): Promise<number | null> {
  if (!isDbConfigured) return 6_200_000
  return mediaUsageBytes()
}

export async function listTeam(): Promise<{ user_id: string; email: string | null; full_name: string | null; role: 'owner' | 'editor'; created_at: string }[]> {
  if (!isDbConfigured) return [{ user_id: 'demo', email: 'demo@loomacomfort.com', full_name: 'Demo admin', role: 'owner', created_at: '2026-10-01T09:00:00.000Z' }]
  return query('select user_id, email, full_name, role, created_at, last_sign_in_at, (totp_secret is not null) as two_step from public.admin_users order by created_at asc') as never
}
