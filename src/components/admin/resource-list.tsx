'use client'

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition, useId } from 'react'
import { toast } from 'sonner'
import { IconArrowUpRight, IconPlus, IconSearch, IconStar } from '@/components/icons'
import { reorderResource, setReviewStatus, toggleResource } from '@/lib/admin/actions'
import type { ResourceDef } from '@/lib/admin/fields'
import { cn } from '@/lib/cn'
import { formatDate, formatDateTime, formatPKR } from '@/lib/format'
import type { ImageAsset } from '@/lib/types'
import { Switch } from './controls'
import { previewUrl } from './upload'

type Row = Record<string, unknown> & { id: string }

export function scheduleStatus(row: Row): { label: string; tone: 'live' | 'scheduled' | 'ended' | 'off' } {
  const active = row.is_active !== false
  const now = Date.now()
  const start = row.starts_at ? Date.parse(String(row.starts_at)) : null
  const end = row.ends_at ? Date.parse(String(row.ends_at)) : null
  if (!active) return { label: 'Off', tone: 'off' }
  if (start && start > now) return { label: `Starts ${formatDate(String(row.starts_at))}`, tone: 'scheduled' }
  if (end && end <= now) return { label: 'Ended', tone: 'ended' }
  if (end) return { label: `Live · until ${formatDate(String(row.ends_at))}`, tone: 'live' }
  return { label: 'Live', tone: 'live' }
}

export function Pill({ tone, children }: { tone: 'live' | 'scheduled' | 'ended' | 'off' | 'pending' | 'neutral'; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.74rem] whitespace-nowrap',
        tone === 'live' && 'bg-success/12 text-success',
        tone === 'scheduled' && 'bg-gold/18 text-gold-text',
        tone === 'ended' && 'bg-line text-taupe',
        tone === 'off' && 'bg-line text-taupe',
        tone === 'pending' && 'bg-gold/25 text-walnut',
        tone === 'neutral' && 'bg-beige-soft text-walnut',
      )}
    >
      {(tone === 'live' || tone === 'scheduled' || tone === 'pending') && <span className={cn('size-1.5 rounded-full', tone === 'live' ? 'bg-success' : 'bg-gold')} />}
      {children}
    </span>
  )
}

function Cell({ kind, value, row, lookup }: { kind?: string; value: unknown; row: Row; lookup: Record<string, string> }) {
  switch (kind) {
    case 'image': {
      const img = value as ImageAsset | null
      return img?.ref ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl(img, 480)} alt="" className="size-12 rounded-[2px] object-cover" />
      ) : (
        <span className="block size-12 rounded-[2px] bg-beige-soft" />
      )
    }
    case 'bool':
      return <span className={value ? 'text-success' : 'text-taupe'}>{value ? 'Yes' : 'No'}</span>
    case 'date':
      return <span className="text-taupe">{value ? formatDate(String(value)) : '—'}</span>
    case 'price':
      return <span className="tabular">{value != null ? formatPKR(Number(value)) : '—'}</span>
    case 'badge':
      return value ? <Pill tone="neutral">{String(value).replace(/_/g, ' ')}</Pill> : <span className="text-taupe">—</span>
    case 'schedule': {
      const s = scheduleStatus(row)
      return <Pill tone={s.tone}>{s.label}</Pill>
    }
    case 'status':
      return <Pill tone={value === 'approved' ? 'live' : value === 'pending' ? 'pending' : 'off'}>{String(value)}</Pill>
    case 'rating':
      return (
        <span className="flex text-gold">
          {Array.from({ length: Number(value) || 0 }).map((_, i) => (
            <IconStar key={i} size={13} />
          ))}
        </span>
      )
    default: {
      if (typeof value === 'string' && lookup[value]) return <span className="text-taupe">{lookup[value]}</span>
      if (value == null || value === '') return <span className="text-taupe">—</span>
      const s = String(value)
      return <span className="line-clamp-2">{s.length > 120 ? `${s.slice(0, 120)}…` : s}</span>
    }
  }
}

function SortableRow({ id, disabled, children }: { id: string; disabled: boolean; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  const handle = disabled ? null : (
    <button type="button" {...attributes} {...listeners} className="grid size-9 cursor-grab touch-none place-items-center text-taupe hover:text-walnut active:cursor-grabbing" aria-label="Drag to reorder">
      <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden fill="currentColor">
        {[2, 8, 14].map((y) => [3, 9].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" />))}
      </svg>
    </button>
  )
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative bg-surface', isDragging && 'z-10 shadow-[0_8px_24px_-8px_rgb(58_37_25/0.35)]')}
    >
      {children(handle)}
    </li>
  )
}

export function ResourceList({ def, rows: initial, lookup = {}, readOnly }: { def: ResourceDef; rows: Row[]; lookup?: Record<string, string>; readOnly?: boolean }) {
  const router = useRouter()
  const [rows, setRows] = useState(initial)
  const [q, setQ] = useState('')
  const [, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const dndId = useId()

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((r) => def.columns.some((c) => String(r[c.field] ?? '').toLowerCase().includes(s)) || String(r[def.titleField] ?? '').toLowerCase().includes(s))
  }, [rows, q, def])

  const canDrag = Boolean(def.orderable) && !q && !readOnly

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const from = rows.findIndex((r) => r.id === e.active.id)
    const to = rows.findIndex((r) => r.id === e.over!.id)
    const next = arrayMove(rows, from, to)
    setRows(next)
    startTransition(async () => {
      const res = await reorderResource(def.key, next.map((r) => r.id))
      if (res.ok) toast.success(res.message ?? 'Saved')
      else {
        toast.error(res.message)
        setRows(rows)
      }
    })
  }

  const toggle = (row: Row, value: boolean) => {
    if (!def.toggle) return
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [def.toggle!.field]: value } : r)))
    startTransition(async () => {
      const res = await toggleResource(def.key, row.id, def.toggle!.field, value)
      if (res.ok) {
        toast.success(res.message ?? 'Saved')
        router.refresh()
      } else {
        toast.error(res.message)
        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [def.toggle!.field]: !value } : r)))
      }
    })
  }

  const quickReview = (row: Row, status: 'approved' | 'hidden') => {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)))
    startTransition(async () => {
      const res = await setReviewStatus(row.id, status)
      if (res.ok) toast.success(res.message ?? 'Saved')
      else toast.error(res.message)
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-taupe" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${def.label.toLowerCase()}`} className="h-10 w-full rounded-[2px] border border-line-strong bg-surface pr-3 pl-9 text-[0.9rem] focus:border-walnut focus:outline-none" />
        </label>
        {canDrag && <p className="text-[0.8rem] text-taupe">Drag ⋮⋮ to reorder</p>}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[2px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
          <p className="font-serif text-[1.4rem] text-walnut">{q ? 'Nothing matches your search' : `No ${def.label.toLowerCase()} yet`}</p>
          {!q && def.canCreate && !readOnly && (
            <Link href={`/admin/${def.key}/new`} className="btn btn-primary btn-sm mt-6">
              <IconPlus size={14} /> Add {def.singular.toLowerCase()}
            </Link>
          )}
        </div>
      ) : (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={filtered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-line overflow-hidden rounded-[2px] border border-line">
              {filtered.map((row) => (
                <SortableRow key={row.id} id={row.id} disabled={!canDrag}>
                  {(handle) => (
                    <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
                      {handle}
                      <Link href={`/admin/${def.key}/${row.id}`} className="grid min-w-0 flex-1 grid-cols-1 items-center gap-x-6 gap-y-1 text-[0.9rem] text-walnut sm:grid-flow-col sm:auto-cols-fr">
                        {def.columns.map((c, i) => (
                          <span key={c.field} className={cn('min-w-0', i === 0 && c.kind !== 'image' && 'font-medium', c.kind === 'image' ? 'sm:max-w-12' : '', i > 1 && 'max-sm:text-[0.82rem]')}>
                            <Cell kind={c.kind} value={row[c.field]} row={row} lookup={lookup} />
                          </span>
                        ))}
                      </Link>
                      {def.key === 'reviews' && row.status === 'pending' && !readOnly && (
                        <div className="flex shrink-0 gap-1.5">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => quickReview(row, 'approved')}>
                            Approve
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => quickReview(row, 'hidden')}>
                            Hide
                          </button>
                        </div>
                      )}
                      {def.toggle && (
                        <span className="shrink-0" title={def.toggle.label}>
                          <Switch checked={row[def.toggle.field] !== false} onChange={(v) => toggle(row, v)} />
                        </span>
                      )}
                      {def.viewUrl && typeof row.slug === 'string' && (
                        <Link href={def.viewUrl.replace('{slug}', row.slug)} target="_blank" className="hidden size-9 shrink-0 place-items-center text-taupe hover:text-walnut sm:grid" aria-label="View on website">
                          <IconArrowUpRight size={16} />
                        </Link>
                      )}
                    </div>
                  )}
                </SortableRow>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <p className="mt-3 text-[0.78rem] text-taupe">
        {filtered.length} of {rows.length} · Times shown in Pakistan time ({formatDateTime(new Date().toISOString()).split(', ').pop()})
      </p>
    </div>
  )
}
