import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/admin/auth'
import { isSupabaseConfigured } from '@/lib/env'
import { createSupabaseServer } from '@/lib/supabase/server'

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
  if (!isSupabaseConfigured) return { '/admin/inbox': 1, '/admin/reviews': 1 }
  const db = await createSupabaseServer()
  const [messages, reviews] = await Promise.all([
    db.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    db.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return { '/admin/inbox': messages.count ?? 0, '/admin/reviews': reviews.count ?? 0 }
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
