'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconPhone, IconWhatsApp } from '@/components/icons'
import { deleteMessage, setMessageStatus } from '@/lib/admin/actions'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import type { ContactMessageRow, MessageStatus } from '@/lib/types'
import { whatsappLink } from '@/lib/whatsapp'
import { Pill } from './resource-list'

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'custom', label: 'Custom orders' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
] as const

export function Inbox({ messages: initial }: { messages: ContactMessageRow[] }) {
  const [messages, setMessages] = useState(initial)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('open')
  const [openId, setOpenId] = useState<string | null>(null)
  const [, start] = useTransition()

  const list = messages.filter((m) =>
    filter === 'open' ? m.status !== 'archived' : filter === 'custom' ? m.type === 'custom_order' && m.status !== 'archived' : filter === 'archived' ? m.status === 'archived' : true,
  )

  const setStatus = (m: ContactMessageRow, status: MessageStatus) => {
    setMessages((ms) => ms.map((x) => (x.id === m.id ? { ...x, status } : x)))
    start(async () => {
      const res = await setMessageStatus(m.id, status)
      if (!res.ok) toast.error(res.message)
    })
  }

  const open = (m: ContactMessageRow) => {
    setOpenId(openId === m.id ? null : m.id)
    if (m.status === 'new') setStatus(m, 'read')
  }

  const remove = (m: ContactMessageRow) => {
    if (!window.confirm('Delete this message permanently?')) return
    setMessages((ms) => ms.filter((x) => x.id !== m.id))
    start(async () => {
      const res = await deleteMessage(m.id)
      if (res.ok) toast.success('Message deleted')
      else toast.error(res.message)
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn('rounded-[2px] border px-3.5 py-1.5 text-[0.85rem]', filter === f.value ? 'border-walnut bg-walnut text-ivory' : 'border-line-strong text-walnut')}
          >
            {f.label}
          </button>
        ))}
      </div>
      {!list.length ? (
        <div className="rounded-[2px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center text-taupe">No messages here.</div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[2px] border border-line">
          {list.map((m) => {
            const firstName = m.name.split(' ')[0]
            const reply = whatsappLink(m.phone, `Assalam o Alaikum ${firstName}, thank you for contacting Looma Comfort. `)
            const isOpen = openId === m.id
            return (
              <li key={m.id} className={cn('bg-surface', m.status === 'new' && 'bg-gold-soft/20')}>
                <button type="button" onClick={() => open(m)} className="flex w-full items-start gap-4 px-4 py-3.5 text-left">
                  <span className={cn('mt-2 size-2 shrink-0 rounded-full', m.status === 'new' ? 'bg-gold' : 'bg-transparent')} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-walnut">{m.name}</span>
                      {m.type === 'custom_order' && <Pill tone="scheduled">Custom order</Pill>}
                      {m.status === 'replied' && <Pill tone="live">Replied</Pill>}
                      {m.city && <span className="text-[0.8rem] text-taupe">{m.city}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.88rem] text-taupe">{m.subject ? `${m.subject} · ` : ''}{m.message}</span>
                  </span>
                  <span className="shrink-0 text-[0.76rem] text-taupe">{formatDateTime(m.created_at)}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-line px-4 py-5 pl-10">
                    <p className="text-[0.95rem] whitespace-pre-line text-walnut">{m.message}</p>
                    {Object.keys(m.details ?? {}).length > 0 && (
                      <dl className="mt-4 grid max-w-xl grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 text-[0.88rem]">
                        {Object.entries(m.details).map(([k, v]) =>
                          v ? (
                            <div key={k} className="contents">
                              <dt className="text-taupe capitalize">{k}</dt>
                              <dd className="text-walnut">{v}</dd>
                            </div>
                          ) : null,
                        )}
                      </dl>
                    )}
                    <p className="mt-4 text-[0.85rem] text-taupe">
                      {m.phone}
                      {m.email ? ` · ${m.email}` : ''}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {reply && (
                        <a href={reply} target="_blank" rel="noopener noreferrer" onClick={() => setStatus(m, 'replied')} className="btn btn-primary btn-sm">
                          <IconWhatsApp size={16} /> Reply on WhatsApp
                        </a>
                      )}
                      <a href={`tel:${m.phone}`} className="btn btn-secondary btn-sm">
                        <IconPhone size={16} /> Call
                      </a>
                      {m.email && (
                        <a href={`mailto:${m.email}`} className="btn btn-secondary btn-sm">
                          Email
                        </a>
                      )}
                      {m.status !== 'archived' ? (
                        <button type="button" onClick={() => setStatus(m, 'archived')} className="btn btn-secondary btn-sm">
                          Archive
                        </button>
                      ) : (
                        <button type="button" onClick={() => setStatus(m, 'read')} className="btn btn-secondary btn-sm">
                          Move to open
                        </button>
                      )}
                      <button type="button" onClick={() => remove(m)} className="btn btn-sm text-error">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
