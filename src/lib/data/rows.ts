import 'server-only'
import { queryBatch } from '../db'
import { demoSettings } from '../demo/data'
import type { ProductRow, SiteRows } from '../types'

/** Table name for each key of SiteRows, with the filter visitors see (admins see every row). */
export const TABLES = {
  categories: { table: 'categories', visible: 'is_visible' },
  materials: { table: 'materials', visible: null },
  collections: { table: 'collections', visible: 'is_visible' },
  products: { table: 'products', visible: 'is_visible' },
  offers: { table: 'offers', visible: 'is_active' },
  announcements: { table: 'announcements', visible: 'is_active' },
  hero_slides: { table: 'hero_slides', visible: 'is_active' },
  promo_banners: { table: 'promo_banners', visible: 'is_active' },
  home_sections: { table: 'home_sections', visible: 'is_visible' },
  reviews: { table: 'reviews', visible: "status = 'approved'" },
  pages: { table: 'pages', visible: null },
  faqs: { table: 'faqs', visible: 'is_visible' },
} as const

/**
 * Loads every table the public site needs. Visitors get published rows only;
 * the admin dashboard passes { includeHidden: true }.
 */
export async function fetchSiteRows(opts: { includeHidden?: boolean } = {}): Promise<SiteRows> {
  const keys = Object.keys(TABLES) as (keyof typeof TABLES)[]
  // One round trip to the database for everything.
  const [settingsRows, statsRows, ...results] = await queryBatch([
    { text: 'select * from public.site_settings where id = 1', params: [] },
    { text: 'select product_id, order_clicks from public.product_stats limit 5000', params: [] },
    ...keys.map((k) => {
      const { table, visible } = TABLES[k]
      const where = visible && !opts.includeHidden ? ` where ${visible}` : ''
      return { text: `select * from public.${table}${where} limit 5000`, params: [] }
    }),
  ])
  const settingsRow = settingsRows?.[0] ?? null
  const stats = (statsRows ?? []) as { product_id: string; order_clicks: number }[]
  const rows = {} as Record<string, unknown[]>
  results.forEach((res, i) => {
    rows[keys[i]!] = res
  })
  const clicks = new Map<string, number>(stats.map((s) => [s.product_id, s.order_clicks]))
  rows.products = (rows.products as ProductRow[]).map((p) => ({ ...p, order_clicks: clicks.get(p.id) ?? 0 }))
  const settings = { ...demoSettings, ...((settingsRow as Partial<typeof demoSettings> | null) ?? {}) }
  // Message templates and the brand name fall back to the defaults when left empty.
  for (const key of ['brand_name', 'whatsapp_order_template', 'whatsapp_general_message', 'whatsapp_custom_message'] as const) {
    if (!settings[key]) settings[key] = demoSettings[key]
  }
  return {
    settings,
    ...(rows as unknown as Omit<SiteRows, 'settings'>),
  }
}
