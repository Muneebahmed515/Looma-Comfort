import { AdminHeader } from '@/components/admin/admin-shell'
import { Inbox } from '@/components/admin/inbox'
import { requireAdmin } from '@/lib/admin/auth'
import { listMessages } from '@/lib/admin/data'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function InboxPage() {
  await requireAdmin()
  const messages = await listMessages()
  return (
    <>
      <AdminHeader title="Inbox" description="Messages from the contact form and custom furniture requests. Reply on WhatsApp in one tap." />
      <Inbox messages={messages} />
    </>
  )
}
