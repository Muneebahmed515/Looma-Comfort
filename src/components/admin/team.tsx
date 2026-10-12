'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { inviteAdmin, removeAdmin } from '@/lib/admin/actions'
import { formatDate } from '@/lib/format'
import { adminInput } from './controls'
import { Pill } from './resource-list'

interface Member {
  user_id: string
  email: string | null
  full_name: string | null
  role: 'owner' | 'editor'
  created_at: string
}

export function Team({ members, meId, isOwner }: { members: Member[]; meId: string; isOwner: boolean }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'owner' | 'editor'>('editor')
  const [pending, start] = useTransition()

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-line self-start overflow-hidden rounded-[2px] border border-line">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-4 bg-surface px-4 py-3.5">
            <span className="min-w-0">
              <span className="block truncate font-medium text-walnut">{m.full_name || m.email}</span>
              <span className="block truncate text-[0.82rem] text-taupe">
                {m.email} · added {formatDate(m.created_at)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <Pill tone={m.role === 'owner' ? 'live' : 'neutral'}>{m.role === 'owner' ? 'Owner' : 'Editor'}</Pill>
              {isOwner && m.user_id !== meId && (
                <button
                  type="button"
                  className="text-[0.82rem] text-error"
                  onClick={() => {
                    if (!window.confirm(`Remove admin access for ${m.email}?`)) return
                    start(async () => {
                      const res = await removeAdmin(m.user_id)
                      if (res.ok) {
                        toast.success(res.message ?? 'Removed')
                        router.refresh()
                      } else toast.error(res.message)
                    })
                  }}
                >
                  Remove
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="rounded-[2px] border border-line bg-surface p-5 sm:p-6">
        <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Invite someone</h2>
        {isOwner ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              start(async () => {
                const res = await inviteAdmin(email, role, name)
                if (res.ok) {
                  toast.success(res.message ?? 'Invited')
                  setEmail('')
                  setName('')
                  router.refresh()
                } else toast.error(res.message)
              })
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-[0.85rem] text-walnut">Name</span>
              <input className={adminInput} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.85rem] text-walnut">Email</span>
              <input type="email" required className={adminInput} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.85rem] text-walnut">Role</span>
              <select className={adminInput} value={role} onChange={(e) => setRole(e.target.value as 'owner' | 'editor')}>
                <option value="editor">Editor (products, banners, content)</option>
                <option value="owner">Owner (also settings and team)</option>
              </select>
            </label>
            <button type="submit" disabled={pending} className="btn btn-primary btn-block">
              {pending ? 'Sending…' : 'Send invitation'}
            </button>
            <p className="text-[0.78rem] text-taupe">They receive an email with a link to set their password.</p>
          </form>
        ) : (
          <p className="mt-3 text-[0.9rem] text-taupe">Only the owner can invite or remove people.</p>
        )}
      </div>
    </div>
  )
}
