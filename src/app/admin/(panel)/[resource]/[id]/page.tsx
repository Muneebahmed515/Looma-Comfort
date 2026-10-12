import { notFound } from 'next/navigation'
import { AdminHeader } from '@/components/admin/admin-shell'
import { ResourceForm } from '@/components/admin/resource-form'
import { requireAdmin } from '@/lib/admin/auth'
import { getRow, relationOptions } from '@/lib/admin/data'
import { RESOURCES } from '@/lib/admin/resources'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function ResourceEditPage(props: PageProps<'/admin/[resource]/[id]'>) {
  const { resource, id } = await props.params
  const def = RESOURCES[resource]
  if (!def) notFound()
  const admin = await requireAdmin()
  const isNew = id === 'new'
  if (isNew && !def.canCreate) notFound()
  const [row, relations] = await Promise.all([isNew ? Promise.resolve(null) : getRow(def.table, id), relationOptions()])
  if (!isNew && !row) notFound()
  const title = isNew ? `New ${def.singular.toLowerCase()}` : String(row?.[def.titleField] ?? def.singular).split('\n').join(' ')
  return (
    <>
      <AdminHeader title={title} description={isNew ? def.description : undefined} />
      <ResourceForm def={def} initial={row ?? { ...(def.defaults ?? {}) }} id={isNew ? null : id} relations={relations} demo={admin.demo} />
    </>
  )
}
