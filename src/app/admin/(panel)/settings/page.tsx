import { AdminHeader } from '@/components/admin/admin-shell'
import { ResourceForm } from '@/components/admin/resource-form'
import { requireAdmin } from '@/lib/admin/auth'
import { getSettingsRow, relationOptions } from '@/lib/admin/data'
import { SETTINGS_GROUPS } from '@/lib/admin/resources'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

export default async function SettingsPage() {
  const admin = await requireAdmin()
  if (admin.role !== 'owner') {
    return <AdminHeader title="Site settings" description="Only the owner account can change site settings." />
  }
  const [settings, relations] = await Promise.all([getSettingsRow(), relationOptions()])
  const synonyms = (settings.search_synonyms ?? {}) as Record<string, string>
  const initial = {
    ...settings,
    search_synonyms_text: Object.entries(synonyms)
      .map(([k, v]) => `${k} = ${v}`)
      .join('\n'),
  }
  return (
    <>
      <AdminHeader title="Site settings" description="WhatsApp, contact details, social links, analytics and defaults used across the website." />
      <ResourceForm groups={SETTINGS_GROUPS} initial={initial} id="settings" relations={relations} mode="settings" demo={admin.demo} />
    </>
  )
}
