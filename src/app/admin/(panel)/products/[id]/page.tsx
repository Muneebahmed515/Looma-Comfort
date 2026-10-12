import { notFound } from 'next/navigation'
import { AdminHeader } from '@/components/admin/admin-shell'
import { ProductEditor } from '@/components/admin/product-editor'
import type { ProductInput } from '@/lib/admin/actions'
import { requireAdmin } from '@/lib/admin/auth'
import { getRow, relationOptions } from '@/lib/admin/data'
import type { ProductRow } from '@/lib/types'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function ProductEditPage(props: PageProps<'/admin/products/[id]'>) {
  const { id } = await props.params
  const admin = await requireAdmin()
  const isNew = id === 'new'
  const [row, relations] = await Promise.all([isNew ? Promise.resolve(null) : getRow('products', id), relationOptions()])
  if (!isNew && !row) notFound()
  const p = row as unknown as ProductRow | null
  const initial: Partial<ProductInput> | null = p
    ? {
        name: p.name,
        slug: p.slug,
        sku: p.sku ?? '',
        category_id: p.category_id,
        short_description: p.short_description ?? '',
        description_html: p.description_html ?? '',
        price: p.price,
        sale_price: p.sale_price,
        price_on_request: p.price_on_request,
        stock_status: p.stock_status,
        lead_time: p.lead_time ?? '',
        images: p.images ?? [],
        options: p.options ?? [],
        specifications: p.specifications ?? [],
        care_html: p.care_html ?? '',
        delivery_html: p.delivery_html ?? '',
        material_ids: p.material_ids ?? [],
        collection_ids: p.collection_ids ?? [],
        related_ids: p.related_ids ?? [],
        tags: p.tags ?? [],
        is_best_seller: p.is_best_seller,
        is_new_arrival: p.is_new_arrival,
        is_featured: p.is_featured,
        is_visible: p.is_visible,
        seo_title: p.seo_title ?? '',
        seo_description: p.seo_description ?? '',
      }
    : null
  return (
    <>
      <AdminHeader title={isNew ? 'New product' : (p?.name ?? 'Product')} description={isNew ? 'Fill in the basics, add photos, then publish when ready.' : undefined} />
      <ProductEditor initial={initial} id={isNew ? null : id} relations={relations} demo={admin.demo} />
    </>
  )
}
