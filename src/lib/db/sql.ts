// Builds parameterised INSERT/UPDATE statements with checked table and column names.

export type Row = Record<string, unknown>

// ---------------------------------------------------------------- safe dynamic SQL

/** Every table the app writes to. Table and column names are checked before use in SQL. */
const TABLES = new Set([
  'site_settings', 'categories', 'materials', 'collections', 'products', 'product_stats', 'offers',
  'announcements', 'hero_slides', 'promo_banners', 'home_sections', 'reviews', 'pages', 'faqs',
  'contact_messages', 'newsletter_subscribers', 'whatsapp_clicks', 'slug_redirects', 'activity_log', 'admin_users',
])

/** jsonb columns: values are sent as JSON. Every other array is a Postgres array (uuid[] / text[]). */
const JSON_COLUMNS = new Set([
  'logo', 'og_image', 'search_synonyms', 'image', 'banner', 'images', 'options', 'specifications',
  'desktop_image', 'mobile_image', 'settings', 'blocks', 'hero_image', 'details',
])

export function table(name: string): string {
  if (!TABLES.has(name)) throw new Error(`Unknown table: ${name}`)
  return `public.${name}`
}

export function col(name: string): string {
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(name)) throw new Error(`Invalid column: ${name}`)
  return `"${name}"`
}

function param(column: string, value: unknown, params: unknown[]): string {
  if (value === undefined) value = null
  if (JSON_COLUMNS.has(column)) {
    params.push(value === null ? null : JSON.stringify(value))
    return `$${params.length}::jsonb`
  }
  params.push(value)
  return `$${params.length}`
}

export interface Statement {
  text: string
  params: unknown[]
}

export function insertSql(tableName: string, values: Row, returning = 'id'): Statement {
  const params: unknown[] = []
  const keys = Object.keys(values).filter((k) => values[k] !== undefined)
  const text = keys.length
    ? `insert into ${table(tableName)} (${keys.map(col).join(', ')}) values (${keys.map((k) => param(k, values[k], params)).join(', ')}) returning ${returning}`
    : `insert into ${table(tableName)} default values returning ${returning}`
  return { text, params }
}

export function updateSql(tableName: string, values: Row, where: { column: string; value: unknown } | { column: string; in: unknown[] }): Statement {
  const params: unknown[] = []
  const keys = Object.keys(values).filter((k) => values[k] !== undefined)
  if (!keys.length) throw new Error('Nothing to update')
  const set = keys.map((k) => `${col(k)} = ${param(k, values[k], params)}`).join(', ')
  if ('in' in where) {
    params.push(where.in)
    return { text: `update ${table(tableName)} set ${set} where ${col(where.column)} = any($${params.length})`, params }
  }
  params.push(where.value)
  return { text: `update ${table(tableName)} set ${set} where ${col(where.column)} = $${params.length}`, params }
}
