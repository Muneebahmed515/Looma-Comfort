import Link from 'next/link'
import { AdminHeader } from '@/components/admin/admin-shell'
import { HomeSectionsEditor } from '@/components/admin/home-sections-editor'
import { IconArrowUpRight } from '@/components/icons'
import { requireAdmin } from '@/lib/admin/auth'
import { listRows, relationOptions } from '@/lib/admin/data'
import type { HomeSectionRow } from '@/lib/types'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function HomepageAdmin() {
  await requireAdmin()
  const [rows, relations] = await Promise.all([listRows('home_sections', { column: 'sort_order', ascending: true }), relationOptions()])
  return (
    <>
      <AdminHeader
        title="Home page"
        description="Drag sections to reorder, switch them on or off, and choose what each one shows."
        actions={
          <Link href="/" target="_blank" className="btn btn-secondary btn-sm">
            View home page <IconArrowUpRight size={14} />
          </Link>
        }
      />
      <HomeSectionsEditor initial={rows as unknown as HomeSectionRow[]} relations={relations} />
    </>
  )
}
