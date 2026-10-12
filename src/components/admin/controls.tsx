'use client'

import { Popover, Switch as RadixSwitch } from 'radix-ui'
import { useId, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { IconArrowLeft, IconArrowRight, IconCaretDown, IconCheck, IconClose, IconPlus, IconStar, IconTrash } from '@/components/icons'
import { cn } from '@/lib/cn'
import { isoToPktLocal, pktLocalToIso, slugify } from '@/lib/format'
import type { FieldDef } from '@/lib/admin/fields'
import { getPath } from '@/lib/admin/fields'
import type { RelationOptions } from '@/lib/admin/data'
import type { ImageAsset } from '@/lib/types'
import { RichTextEditor } from './rich-text-editor'
import { compressAndUpload, previewUrl, type Bucket } from './upload'

export const adminInput =
  'h-11 w-full rounded-[2px] border border-line-strong bg-surface px-3.5 text-[0.95rem] text-walnut placeholder:text-taupe/60 transition-colors focus:border-walnut focus:outline-none aria-[invalid=true]:border-error'

export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label?: string; id?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-[0.92rem] text-walnut">
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors duration-200 data-[state=checked]:bg-walnut focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <RadixSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-ivory shadow-sm transition-transform duration-200 data-[state=checked]:translate-x-[22px]" />
      </RadixSwitch.Root>
      {label && <span>{label}</span>}
    </label>
  )
}

// ---------------------------------------------------------------- image

export function ImageInput({
  value,
  onChange,
  bucket,
  folder,
  compact,
}: {
  value: ImageAsset | null
  onChange: (v: ImageAsset | null) => void
  bucket: Bucket
  folder: string
  compact?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const upload = async (file: File) => {
    setProgress(0)
    try {
      const asset = await compressAndUpload(file, bucket, folder, value?.alt || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), setProgress)
      onChange(asset)
      toast.success('Image uploaded')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setProgress(null)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className={cn('flex gap-4', compact ? 'items-center' : 'flex-col sm:flex-row sm:items-start')}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) void upload(file)
        }}
        className={cn(
          'relative grid shrink-0 place-items-center overflow-hidden rounded-[2px] border border-dashed border-line-strong bg-beige-soft text-[0.8rem] text-taupe transition-colors hover:border-walnut',
          compact ? 'size-20' : 'aspect-[4/3] w-full sm:w-56',
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl(value, 480)} alt={value.alt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 px-3 text-center">
            <IconPlus size={20} />
            {compact ? 'Add' : 'Click or drop an image'}
          </span>
        )}
        {progress != null && (
          <span className="absolute inset-0 grid place-items-center bg-ivory/80 text-walnut">
            <span className="tabular text-[0.85rem]">Uploading {Math.round(progress * 100)}%</span>
          </span>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {value && (
        <div className="min-w-0 flex-1 space-y-2">
          {!compact && (
            <label className="block">
              <span className="mb-1 block text-[0.78rem] text-taupe">Alt text (describes the image for Google and screen readers)</span>
              <input className={adminInput} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
            </label>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => input.current?.click()}>
              Replace
            </button>
            <button type="button" className="btn btn-sm text-error" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- relations

export function RelationPicker({
  options,
  value,
  onChange,
  multiple,
  placeholder = 'Choose…',
  exclude,
}: {
  options: { value: string; label: string; hint?: string }[]
  value: string | string[] | null
  onChange: (v: string | string[] | null) => void
  multiple?: boolean
  placeholder?: string
  exclude?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const selected = multiple ? ((value as string[] | null) ?? []) : value ? [value as string] : []
  const opts = options.filter((o) => o.value !== exclude)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? opts.filter((o) => o.label.toLowerCase().includes(s) || o.hint?.toLowerCase().includes(s)) : opts
  }, [q, opts])
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? 'Removed item'

  const toggle = (v: string) => {
    if (multiple) onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
    else {
      onChange(selected[0] === v ? null : v)
      setOpen(false)
    }
  }

  return (
    <div>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button type="button" className={cn(adminInput, 'flex items-center justify-between text-left')}>
            <span className={cn('truncate', !selected.length && 'text-taupe/70')}>
              {multiple ? (selected.length ? `${selected.length} selected` : placeholder) : selected[0] ? labelOf(selected[0]) : placeholder}
            </span>
            <IconCaretDown size={14} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={4} className="z-[80] w-[var(--radix-popover-trigger-width)] min-w-64 rounded-[2px] border border-line-strong bg-ivory shadow-[0_12px_32px_-12px_rgb(58_37_25/0.3)]">
            <div className="border-b border-line p-2">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={cn(adminInput, 'h-9')} />
            </div>
            <ul className="max-h-72 overflow-y-auto py-1" data-lenis-prevent>
              {!multiple && selected.length > 0 && (
                <li>
                  <button type="button" onClick={() => { onChange(null); setOpen(false) }} className="w-full px-3 py-2 text-left text-[0.85rem] text-taupe hover:bg-beige-soft">
                    Clear selection
                  </button>
                </li>
              )}
              {filtered.map((o) => {
                const on = selected.includes(o.value)
                return (
                  <li key={o.value}>
                    <button type="button" onClick={() => toggle(o.value)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-[0.9rem] text-walnut hover:bg-beige-soft">
                      <span className={cn('grid size-4 shrink-0 place-items-center rounded-[2px] border', on ? 'border-walnut bg-walnut text-ivory' : 'border-line-strong')}>
                        {on && <IconCheck size={10} weight="bold" />}
                      </span>
                      <span className="flex-1 truncate">{o.label}</span>
                      {o.hint && <span className="text-[0.75rem] text-taupe">{o.hint}</span>}
                    </button>
                  </li>
                )
              })}
              {!filtered.length && <li className="px-3 py-3 text-[0.85rem] text-taupe">Nothing found</li>}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {multiple && selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <span key={v} className="flex items-center gap-1.5 rounded-[2px] bg-beige-soft px-2.5 py-1 text-[0.8rem] text-walnut">
              {labelOf(v)}
              <button type="button" onClick={() => toggle(v)} aria-label={`Remove ${labelOf(v)}`}>
                <IconClose size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function TagsInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[2px] border border-line-strong bg-surface px-2 py-1.5 focus-within:border-walnut">
      {value.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-[2px] bg-beige-soft px-2 py-1 text-[0.82rem] text-walnut">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
            <IconClose size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
        }}
        onBlur={add}
        placeholder={value.length ? '' : (placeholder ?? 'Type and press Enter')}
        className="min-w-24 flex-1 bg-transparent px-1 py-1 text-[0.92rem] text-walnut focus:outline-none"
      />
    </div>
  )
}

// ---------------------------------------------------------------- generic field

interface FieldControlProps {
  field: FieldDef
  value: unknown
  onChange: (v: unknown) => void
  values: Record<string, unknown>
  relations: RelationOptions
  error?: string
  folder: string
  rowId?: string | null
}

export function FieldControl({ field: f, value, onChange, values, relations, error, folder, rowId }: FieldControlProps) {
  const id = useId()
  const invalid = Boolean(error)
  const common = { id, 'aria-invalid': invalid, className: adminInput, placeholder: f.placeholder }
  let control: React.ReactNode
  switch (f.type) {
    case 'text':
    case 'url':
      control = <input {...common} type={f.type === 'url' ? 'text' : 'text'} maxLength={f.maxLength} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
      break
    case 'slug':
      control = (
        <div className="flex gap-2">
          <input {...common} value={(value as string) ?? ''} onChange={(e) => onChange(slugify(e.target.value).replace(/-$/, '') + (e.target.value.endsWith('-') ? '-' : ''))} />
          {f.from && (
            <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={() => onChange(slugify(String(getPath(values, f.from!) ?? '')))}>
              From name
            </button>
          )}
        </div>
      )
      break
    case 'textarea':
      control = (
        <textarea {...common} className={cn(adminInput, 'h-auto py-2.5 leading-relaxed')} rows={f.rows ?? 4} maxLength={f.maxLength} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
      )
      break
    case 'richtext':
      control = <RichTextEditor id={id} value={(value as string) ?? ''} onChange={onChange} />
      break
    case 'number':
    case 'price':
      control = (
        <div className="relative">
          {f.type === 'price' && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.9rem] text-taupe">Rs.</span>}
          <input
            {...common}
            className={cn(adminInput, 'tabular', f.type === 'price' && 'pl-11')}
            type="number"
            inputMode="numeric"
            min={f.min}
            max={f.max}
            value={value == null ? '' : String(value)}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
      )
      break
    case 'switch':
      control = <Switch id={id} checked={Boolean(value)} onChange={onChange} label={f.label} />
      break
    case 'select':
      control = (
        <select {...common} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)}>
          {!f.required && <option value="">—</option>}
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'datetime':
      control = (
        <input {...common} type="datetime-local" value={isoToPktLocal(value as string | null)} onChange={(e) => onChange(pktLocalToIso(e.target.value))} />
      )
      break
    case 'date':
      control = <input {...common} type="date" value={((value as string) ?? '').slice(0, 10)} onChange={(e) => onChange(e.target.value || null)} />
      break
    case 'tags':
      control = <TagsInput value={(value as string[]) ?? []} onChange={onChange} placeholder={f.placeholder} />
      break
    case 'relation':
    case 'relations':
      control = (
        <RelationPicker
          options={relations[f.source!] ?? []}
          value={(value as string | string[] | null) ?? (f.type === 'relations' ? [] : null)}
          onChange={onChange}
          multiple={f.type === 'relations'}
          exclude={f.source === 'categories' ? (rowId ?? undefined) : undefined}
        />
      )
      break
    case 'image':
      control = <ImageInput value={(value as ImageAsset | null) ?? null} onChange={onChange} bucket={f.bucket ?? 'content'} folder={folder} />
      break
    case 'rating':
      control = (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} stars`} className="grid size-9 place-items-center">
              <IconStar size={22} className={n <= Number(value ?? 0) ? 'text-gold' : 'text-line-strong'} />
            </button>
          ))}
        </div>
      )
      break
    case 'list':
      control = <ListInput field={f} value={(value as Record<string, unknown>[]) ?? []} onChange={onChange} relations={relations} folder={folder} />
      break
    default:
      control = null
  }

  if (f.type === 'switch') {
    return (
      <div className={cn(f.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
        {control}
        {f.help && <p className="mt-1.5 text-[0.78rem] text-taupe">{f.help}</p>}
      </div>
    )
  }
  return (
    <div className={cn(f.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-3 text-[0.85rem] font-medium text-walnut">
        <span>
          {f.label}
          {f.required && <span className="ml-0.5 text-gold-text">*</span>}
        </span>
        {f.maxLength && typeof value === 'string' && (
          <span className={cn('tabular text-[0.72rem] font-normal', value.length > f.maxLength ? 'text-error' : 'text-taupe')}>
            {value.length}/{f.maxLength}
          </span>
        )}
      </label>
      {control}
      {error ? <p className="mt-1.5 text-[0.8rem] text-error">{error}</p> : f.help && <p className="mt-1.5 text-[0.78rem] text-taupe">{f.help}</p>}
    </div>
  )
}

function ListInput({ field, value, onChange, relations, folder }: { field: FieldDef; value: Record<string, unknown>[]; onChange: (v: unknown) => void; relations: RelationOptions; folder: string }) {
  const rows = Array.isArray(value) ? value : []
  const move = (i: number, d: number) => {
    const next = [...rows]
    const [r] = next.splice(i, 1)
    next.splice(i + d, 0, r!)
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="rounded-[2px] border border-line bg-ivory p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="t-label text-[0.68rem] text-taupe">Item {i + 1}</span>
            <div className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid size-8 place-items-center text-walnut disabled:opacity-30" aria-label="Move up">
                <IconArrowLeft size={14} className="rotate-90" />
              </button>
              <button type="button" disabled={i === rows.length - 1} onClick={() => move(i, 1)} className="grid size-8 place-items-center text-walnut disabled:opacity-30" aria-label="Move down">
                <IconArrowRight size={14} className="rotate-90" />
              </button>
              <button type="button" onClick={() => onChange(rows.filter((_, x) => x !== i))} className="grid size-8 place-items-center text-error" aria-label="Remove item">
                <IconTrash size={15} />
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(field.item ?? []).map((sub) => (
              <FieldControl
                key={sub.name}
                field={{ ...sub, half: sub.type !== 'textarea' && sub.type !== 'image' && (field.item?.length ?? 0) > 2 }}
                value={row[sub.name]}
                onChange={(v) => onChange(rows.map((r, x) => (x === i ? { ...r, [sub.name]: v } : r)))}
                values={row}
                relations={relations}
                folder={folder}
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...rows, {}])}>
        <IconPlus size={14} /> Add item
      </button>
    </div>
  )
}

export type { Bucket }
