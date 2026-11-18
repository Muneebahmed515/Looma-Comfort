'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { inviteAdmin, removeAdmin, resetMemberPassword } from '@/lib/admin/actions'
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
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null)

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
                  className="text-[0.82rem] text-taupe"
                  onClick={() => {
                    if (!window.confirm(`Create a new one-time password for ${m.email}? Their current password stops working.`)) return
                    start(async () => {
                      const res = await resetMemberPassword(m.user_id)
                      if (res.ok && res.data) setIssued({ email: m.email ?? '', password: res.data.password })
                      else toast.error(res.ok ? 'Could not reset' : res.message)
                    })
                  }}
                >
                  New password
                </button>
              )}
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
        <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">Add someone</h2>
        {issued && (
          <div className="mt-4 space-y-2 rounded-[2px] border border-gold/50 bg-gold-soft/25 p-4" role="status">
            <p className="text-[0.85rem] text-walnut">
              One-time password for <strong>{issued.email}</strong>. Send it to them privately (e.g. WhatsApp). It is shown only once.
            </p>
            <p className="tabular rounded-[2px] bg-surface px-3 py-2 text-center font-mono text-[1.05rem] tracking-wider text-walnut select-all">{issued.password}</p>
            <button type="button" className="text-[0.82rem] text-taupe" onClick={() => setIssued(null)}>
              Done
            </button>
          </div>
        )}
        {isOwner ? (
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              start(async () => {
                const res = await inviteAdmin(email, role, name)
                if (res.ok) {
                  toast.success(res.message ?? 'Added')
                  if (res.data) setIssued({ email: email.trim().toLowerCase(), password: res.data.password })
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
              {pending ? 'Adding…' : 'Add to team'}
            </button>
            <p className="text-[0.78rem] text-taupe">You get a one-time password to give them. They sign in at /admin and choose their own under Account.</p>
          </form>
        ) : (
          <p className="mt-3 text-[0.9rem] text-taupe">Only the owner can invite or remove people.</p>
        )}
      </div>
    </div>
  )
}
