'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconTrash } from '@/components/icons'
import { deleteSubscriber } from '@/lib/admin/actions'
import { formatDate } from '@/lib/format'
import type { SubscriberRow } from '@/lib/types'

export function SubscriberList({ subscribers: initial }: { subscribers: SubscriberRow[] }) {
  const [rows, setRows] = useState(initial)
  const [, start] = useTransition()
  if (!rows.length) return <div className="rounded-[2px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center text-taupe">No subscribers yet.</div>
  return (
    <div>
      <ul className="divide-y divide-line overflow-hidden rounded-[2px] border border-line">
        {rows.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 bg-surface px-4 py-3 text-[0.9rem]">
            <span className="min-w-0 truncate text-walnut">{s.email}</span>
            <span className="flex shrink-0 items-center gap-4 text-[0.8rem] text-taupe">
              {formatDate(s.created_at)}
              <button
                type="button"
                aria-label={`Remove ${s.email}`}
                className="grid size-8 place-items-center text-error"
                onClick={() => {
                  if (!window.confirm(`Remove ${s.email}?`)) return
                  setRows((r) => r.filter((x) => x.id !== s.id))
                  start(async () => {
                    const res = await deleteSubscriber(s.id)
                    if (!res.ok) toast.error(res.message)
                  })
                }}
              >
                <IconTrash size={15} />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.78rem] text-taupe">{rows.length} subscribers</p>
    </div>
  )
}
