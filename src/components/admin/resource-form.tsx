'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { IconArrowLeft, IconArrowUpRight } from '@/components/icons'
import { deleteResource, saveResource, saveSettings } from '@/lib/admin/actions'
import type { RelationOptions } from '@/lib/admin/data'
import { getPath, setPath, type FieldGroup, type ResourceDef } from '@/lib/admin/fields'
import { cn } from '@/lib/cn'
import { FieldControl } from './controls'

type Values = Record<string, unknown>

interface ResourceFormProps {
  def?: ResourceDef
  groups?: FieldGroup[]
  initial: Values
  id: string | null
  relations: RelationOptions
  /** "settings" saves the single settings row. */
  mode?: 'resource' | 'settings'
  demo?: boolean
}

export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
}

export function SaveBar({ dirty, pending, onSave, label = 'Save changes', extra }: { dirty: boolean; pending: boolean; onSave: () => void; label?: string; extra?: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-10 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="flex items-center justify-between gap-3">
        <p className={cn('text-[0.85rem]', dirty ? 'text-gold-text' : 'text-taupe')}>{dirty ? 'You have unsaved changes' : 'All changes saved'}</p>
        <div className="flex items-center gap-2">
          {extra}
          <button type="button" onClick={onSave} disabled={pending} className="btn btn-primary">
            {pending ? 'Saving…' : label}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ResourceForm({ def, groups, initial, id, relations, mode = 'resource', demo }: ResourceFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<Values>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()
  const fieldGroups = groups ?? def?.groups ?? []
  const folder = useMemo(() => (id ? `${def?.key ?? 'site'}/${id}` : `${def?.key ?? 'site'}/new-${crypto.randomUUID().slice(0, 8)}`), [id, def?.key])
  useUnsavedWarning(dirty)

  const update = (name: string, v: unknown) => {
    setValues((s) => setPath(s, name, v))
    setDirty(true)
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }))
  }

  const visible = (f: { showWhen?: { field: string; in: (string | boolean)[] } }) => !f.showWhen || f.showWhen.in.includes(getPath(values, f.showWhen.field) as string | boolean)

  const save = () =>
    startTransition(async () => {
      const res = mode === 'settings' ? await saveSettings(values) : await saveResource(def!.key, id, values)
      if (res.ok) {
        setDirty(false)
        setErrors({})
        toast.success(res.message ?? 'Saved')
        const newId = 'data' in res && res.data && 'id' in res.data ? res.data.id : null
        if (!id && newId && def) router.replace(`/admin/${def.key}/${newId}`)
        else router.refresh()
      } else {
        toast.error(res.message)
        if (res.errors) {
          setErrors(res.errors)
          const first = Object.keys(res.errors)[0]
          if (first) document.querySelector(`[data-field="${CSS.escape(first)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    })

  const remove = () => {
    if (!def || !id) return
    if (!window.confirm(`Delete this ${def.singular.toLowerCase()}? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteResource(def.key, id)
      if (res.ok) {
        toast.success(res.message ?? 'Deleted')
        setDirty(false)
        router.push(`/admin/${def.key}`)
      } else toast.error(res.message)
    })
  }

  const viewHref = def?.viewUrl && typeof values.slug === 'string' && id ? def.viewUrl.replace('{slug}', values.slug) : null

  return (
    <div>
      {def && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href={`/admin/${def.key}`} className="link-arrow text-[0.85rem] text-taupe hover:text-walnut">
            <IconArrowLeft size={14} /> All {def.label.toLowerCase()}
          </Link>
          {viewHref && (
            <Link href={viewHref} target="_blank" className="link-u link-arrow text-[0.85rem] text-walnut">
              View on website <IconArrowUpRight size={14} />
            </Link>
          )}
        </div>
      )}
      <div className="space-y-6">
        {fieldGroups.map((g) => {
          const fields = g.fields.filter(visible)
          if (!fields.length) return null
          return (
            <section key={g.title} className="rounded-[2px] border border-line bg-surface p-5 sm:p-6">
              <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">{g.title}</h2>
              {g.description && <p className="mt-1 text-[0.84rem] text-taupe">{g.description}</p>}
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.name} data-field={f.name} className={cn(f.half ? 'sm:col-span-1' : 'sm:col-span-2')}>
                    <FieldControl
                      field={{ ...f, half: false }}
                      value={getPath(values, f.name)}
                      onChange={(v) => update(f.name, v)}
                      values={values}
                      relations={relations}
                      error={errors[f.name]}
                      folder={folder}
                      rowId={id}
                    />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={save}
        label={demo ? 'Save (demo)' : id || mode === 'settings' ? 'Save changes' : `Create ${def?.singular.toLowerCase() ?? ''}`}
        extra={
          def?.canDelete && id ? (
            <button type="button" onClick={remove} disabled={pending} className="btn btn-sm text-error">
              Delete
            </button>
          ) : null
        }
      />
    </div>
  )
}
