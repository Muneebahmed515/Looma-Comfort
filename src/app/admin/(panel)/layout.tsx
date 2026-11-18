import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/admin/auth'
import { queryOne } from '@/lib/db'
import { isDbConfigured } from '@/lib/env'

// The admin is per-user and always rendered on request.
export const instant = false

export default function PanelLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate>{children}</Gate>
    </Suspense>
  )
}

function AdminLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-ivory">
      <p className="t-label animate-pulse text-[0.72rem] text-taupe">Loading admin…</p>
    </div>
  )
}

async function counts() {
  if (!isDbConfigured) return { '/admin/inbox': 1, '/admin/reviews': 1 }
  const row = await queryOne<{ messages: number; reviews: number }>(
    `select (select count(*)::int from public.contact_messages where status = 'new') as messages,
            (select count(*)::int from public.reviews where status = 'pending') as reviews`,
  )
  return { '/admin/inbox': row?.messages ?? 0, '/admin/reviews': row?.reviews ?? 0 }
}

async function Gate({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  const badges = await counts()
  return (
    <AdminShell user={{ email: user.email, role: user.role, demo: user.demo }} badges={badges}>
      {children}
    </AdminShell>
  )
}
