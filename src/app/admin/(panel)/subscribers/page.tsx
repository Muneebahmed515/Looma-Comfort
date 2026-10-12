import { AdminHeader } from '@/components/admin/admin-shell'
import { SubscriberList } from '@/components/admin/subscriber-list'
import { requireAdmin } from '@/lib/admin/auth'
import { listSubscribers } from '@/lib/admin/data'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function SubscribersPage() {
  await requireAdmin()
  const subscribers = await listSubscribers()
  return (
    <>
      <AdminHeader
        title="Newsletter subscribers"
        description="Emails collected from the footer sign-up. Download them as a spreadsheet to use with Mailchimp, Brevo or any email tool."
        actions={
          <a href="/api/admin/subscribers" download className="btn btn-primary btn-sm">
            Download CSV
          </a>
        }
      />
      <SubscriberList subscribers={subscribers} />
    </>
  )
}
