import { Account } from '@/components/admin/account'
import { AdminHeader } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/admin/auth'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function AccountPage() {
  const admin = await requireAdmin()
  return (
    <>
      <AdminHeader title="My account" description={`Signed in as ${admin.email}`} />
      <Account />
    </>
  )
}
