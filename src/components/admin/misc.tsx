'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { refreshWebsite } from '@/lib/admin/actions'

/** Forces the public site to rebuild its cached pages now (normally automatic after every save). */
export function RefreshButton() {
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-secondary btn-sm"
      onClick={() =>
        start(async () => {
          const res = await refreshWebsite()
          if (res.ok) toast.success(res.message ?? 'Done')
          else toast.error(res.message)
        })
      }
    >
      {pending ? 'Refreshing…' : 'Refresh website'}
    </button>
  )
}
