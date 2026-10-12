import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminHeader } from '@/components/admin/admin-shell'
import { ResourceList } from '@/components/admin/resource-list'
import { IconPlus } from '@/components/icons'
import { requireAdmin } from '@/lib/admin/auth'
import { listRows, relationOptions } from '@/lib/admin/data'
import { RESOURCES } from '@/lib/admin/resources'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function ResourceListPage(props: PageProps<'/admin/[resource]'>) {
  const { resource } = await props.params
  const def = RESOURCES[resource]
  if (!def) notFound()
  await requireAdmin()
  const [rows, relations] = await Promise.all([listRows(def.table, def.defaultSort), relationOptions()])
  // Resolve ids to names for list columns (e.g. a category's group).
  const lookup = Object.fromEntries(Object.values(relations).flatMap((list) => list.map((o) => [o.value, o.label])))
  const display = def.key === 'offers'
    ? rows.map((r) => ({ ...r, discount_value: r.discount_type === 'percent' ? `${r.discount_value}% off` : `Rs. ${Number(r.discount_value).toLocaleString('en-US')} off` }))
    : rows
  return (
    <>
      <AdminHeader
        title={def.label}
        description={def.description}
        actions={
          def.canCreate ? (
            <Link href={`/admin/${def.key}/new`} className="btn btn-primary btn-sm">
              <IconPlus size={14} /> Add {def.singular.toLowerCase()}
            </Link>
          ) : null
        }
      />
      <ResourceList def={def} rows={display} lookup={lookup} />
    </>
  )
}
