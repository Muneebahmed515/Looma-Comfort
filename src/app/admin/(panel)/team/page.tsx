import { AdminHeader } from '@/components/admin/admin-shell'
import { Team } from '@/components/admin/team'
import { requireAdmin } from '@/lib/admin/auth'
import { listTeam } from '@/lib/admin/data'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function TeamPage() {
  const admin = await requireAdmin()
  const members = await listTeam()
  return (
    <>
      <AdminHeader title="Team" description="People who can sign in to this admin. Keep at least two accounts so you are never locked out." />
      <Team members={members} meId={admin.id} isOwner={admin.role === 'owner' && !admin.demo} />
    </>
  )
}
