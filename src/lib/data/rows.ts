import type { SupabaseClient } from '@supabase/supabase-js'
import { demoSettings } from '../demo/data'
import type { ProductRow, SiteRows } from '../types'

/** Table name for each key of SiteRows. */
export const TABLES = {
  categories: 'categories',
  materials: 'materials',
  collections: 'collections',
  products: 'products',
  offers: 'offers',
  announcements: 'announcements',
  hero_slides: 'hero_slides',
  promo_banners: 'promo_banners',
  home_sections: 'home_sections',
  reviews: 'reviews',
  pages: 'pages',
  faqs: 'faqs',
} as const

/** Loads every table the public site needs. RLS decides which rows each client sees. */
export async function fetchSiteRows(client: SupabaseClient): Promise<SiteRows> {
  const keys = Object.keys(TABLES) as (keyof typeof TABLES)[]
  const [settingsRes, statsRes, ...results] = await Promise.all([
    client.from('site_settings').select('*').eq('id', 1).maybeSingle(),
    client.from('product_stats').select('product_id, order_clicks').limit(5000),
    ...keys.map((k) => client.from(TABLES[k]).select('*').limit(5000)),
  ])
  if (settingsRes.error) throw new Error(`Supabase site_settings: ${settingsRes.error.message}`)
  const rows = {} as Record<string, unknown[]>
  results.forEach((res, i) => {
    if (res.error) throw new Error(`Supabase ${TABLES[keys[i]!]}: ${res.error.message}`)
    rows[keys[i]!] = res.data ?? []
  })
  const clicks = new Map<string, number>(
    ((statsRes.data ?? []) as { product_id: string; order_clicks: number }[]).map((s) => [s.product_id, s.order_clicks]),
  )
  rows.products = (rows.products as ProductRow[]).map((p) => ({ ...p, order_clicks: clicks.get(p.id) ?? 0 }))
  const settings = { ...demoSettings, ...(settingsRes.data ?? {}) }
  // Message templates and the brand name fall back to the defaults when left empty.
  for (const key of ['brand_name', 'whatsapp_order_template', 'whatsapp_general_message', 'whatsapp_custom_message'] as const) {
    if (!settings[key]) settings[key] = demoSettings[key]
  }
  return {
    settings,
    ...(rows as unknown as Omit<SiteRows, 'settings'>),
  }
}
