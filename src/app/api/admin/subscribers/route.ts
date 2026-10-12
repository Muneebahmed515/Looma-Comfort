import { requireAdmin } from '@/lib/admin/auth'
import { listSubscribers } from '@/lib/admin/data'

/** CSV download of newsletter subscribers (admins only). */
export async function GET() {
  await requireAdmin()
  const rows = await listSubscribers()
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv = ['email,source,subscribed_at', ...rows.filter((r) => !r.unsubscribed_at).map((r) => [escape(r.email), escape(r.source ?? ''), r.created_at].join(','))].join('\n')
  return new Response(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="looma-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
