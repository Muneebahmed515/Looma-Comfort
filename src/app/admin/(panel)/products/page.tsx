import Link from 'next/link'
import { AdminHeader } from '@/components/admin/admin-shell'
import { ProductTable } from '@/components/admin/product-table'
import { IconPlus } from '@/components/icons'
import { requireAdmin } from '@/lib/admin/auth'
import { listRows, relationOptions } from '@/lib/admin/data'
import type { ProductRow } from '@/lib/types'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function ProductsPage() {
  await requireAdmin()
  const [rows, relations] = await Promise.all([listRows('products', { column: 'sort_order', ascending: true }), relationOptions()])
  const products = (rows as unknown as ProductRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    category_id: p.category_id,
    price: p.price,
    sale_price: p.sale_price,
    price_on_request: p.price_on_request,
    stock_status: p.stock_status,
    is_best_seller: p.is_best_seller,
    is_new_arrival: p.is_new_arrival,
    is_featured: p.is_featured,
    is_visible: p.is_visible,
    updated_at: p.updated_at,
    image: p.images?.[0] ?? null,
  }))
  return (
    <>
      <AdminHeader
        title="Products"
        description="Everything in your catalogue. New products start as hidden drafts until you publish them."
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            <IconPlus size={14} /> Add product
          </Link>
        }
      />
      <ProductTable rows={products} categories={relations.categories} />
    </>
  )
}
