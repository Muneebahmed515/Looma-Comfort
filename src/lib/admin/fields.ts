// Declarative field + resource definitions for the admin. Shared by the client (forms, lists)
// and the server (validation, saving), so they are plain serialisable objects.

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'price'
  | 'switch'
  | 'select'
  | 'slug'
  | 'image'
  | 'datetime'
  | 'date'
  | 'url'
  | 'tags'
  | 'relation'
  | 'relations'
  | 'color'
  | 'list'
  | 'rating'
  | 'icon'

export type RelationSource = 'categories' | 'collections' | 'products' | 'offers' | 'materials'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required?: boolean
  help?: string
  placeholder?: string
  options?: { value: string; label: string }[]
  source?: RelationSource
  /** For slug fields: the field it is generated from. */
  from?: string
  /** Storage bucket for image fields. */
  bucket?: 'products' | 'categories' | 'banners' | 'content' | 'brand'
  min?: number
  max?: number
  maxLength?: number
  half?: boolean
  /** Sub-fields for "list" (repeatable rows). */
  item?: FieldDef[]
  /** Show only when another field has one of these values. */
  showWhen?: { field: string; in: (string | boolean)[] }
  rows?: number
}

export interface FieldGroup {
  title: string
  description?: string
  fields: FieldDef[]
}

export type ColumnKind = 'image' | 'text' | 'badge' | 'date' | 'bool' | 'price' | 'status' | 'schedule' | 'rating'

export interface ResourceDef {
  key: string
  table: string
  label: string
  singular: string
  description: string
  groups: FieldGroup[]
  columns: { field: string; label: string; kind?: ColumnKind }[]
  titleField: string
  orderable?: boolean
  /** Toggle shown in the list (e.g. is_visible / is_active). */
  toggle?: { field: string; label: string }
  defaultSort: { column: string; ascending: boolean }
  canCreate?: boolean
  canDelete?: boolean
  /** e.g. "/shop/{slug}" */
  viewUrl?: string
  defaults?: Record<string, unknown>
  /** Public-facing slug changes create redirects automatically (DB trigger). */
  hasSlug?: boolean
}

export function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const [head, ...rest] = path.split('.')
  if (!rest.length) return { ...obj, [head!]: value }
  const child = (obj[head!] && typeof obj[head!] === 'object' ? obj[head!] : {}) as Record<string, unknown>
  return { ...obj, [head!]: setPath(child, rest.join('.'), value) }
}

export function allFields(def: Pick<ResourceDef, 'groups'>): FieldDef[] {
  return def.groups.flatMap((g) => g.fields)
}
