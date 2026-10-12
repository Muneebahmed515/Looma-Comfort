'use client'

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition, useId } from 'react'
import { toast } from 'sonner'
import { IconCaretDown, IconPlus, IconTrash } from '@/components/icons'
import { saveHomeSections } from '@/lib/admin/actions'
import type { RelationOptions } from '@/lib/admin/data'
import { getPath, setPath, type FieldDef } from '@/lib/admin/fields'
import { cn } from '@/lib/cn'
import type { HomeSectionRow, HomeSectionType } from '@/lib/types'
import { FieldControl, Switch, adminInput } from './controls'
import { SaveBar, useUnsavedWarning } from './resource-form'

const TYPE_LABEL: Record<HomeSectionType, string> = {
  hero: 'Hero slider',
  categories: 'Shop by category',
  products: 'Product row',
  promo: 'Promo banner',
  collection: 'Featured collection',
  usps: 'Why choose us',
  testimonials: 'Customer reviews',
  story: 'Brand story',
}

const ICONS = ['cash', 'inspect', 'truck', 'craft', 'ruler', 'clock', 'couch', 'bed', 'armchair'].map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) }))

const link: FieldDef[] = [
  { name: 'settings.link_label', label: 'Link text', type: 'text', half: true, placeholder: 'View all' },
  { name: 'settings.link_url', label: 'Link address', type: 'url', half: true, placeholder: '/shop' },
]

const FIELDS: Record<HomeSectionType, FieldDef[]> = {
  hero: [],
  promo: [],
  categories: [{ name: 'settings.category_ids', label: 'Categories to show (in order)', type: 'relations', source: 'categories', help: '5 shows one large tile plus four; 3 or 6 show three columns.' }, ...link],
  products: [
    {
      name: 'settings.source',
      label: 'Which products',
      type: 'select',
      required: true,
      options: [
        { value: 'best_sellers', label: 'Best sellers' },
        { value: 'new_arrivals', label: 'New arrivals' },
        { value: 'featured', label: 'Featured' },
        { value: 'sale', label: 'On sale' },
        { value: 'category', label: 'From one category' },
        { value: 'manual', label: 'Hand-picked' },
      ],
    },
    { name: 'settings.category_id', label: 'Category', type: 'relation', source: 'categories', showWhen: { field: 'settings.source', in: ['category'] } },
    { name: 'settings.product_ids', label: 'Products (in order)', type: 'relations', source: 'products', showWhen: { field: 'settings.source', in: ['manual'] } },
    {
      name: 'settings.layout',
      label: 'Layout',
      type: 'select',
      half: true,
      options: [
        { value: 'carousel', label: 'Carousel' },
        { value: 'grid', label: 'Grid' },
      ],
    },
    { name: 'settings.limit', label: 'How many', type: 'number', half: true, min: 1, max: 24 },
    ...link,
  ],
  collection: [
    { name: 'settings.collection_id', label: 'Collection', type: 'relation', source: 'collections' },
    {
      name: 'settings.layout',
      label: 'Layout',
      type: 'select',
      options: [
        { value: 'editorial', label: 'Editorial (image beside products)' },
        { value: 'horizontal', label: 'Horizontal scroll (desktop)' },
      ],
    },
  ],
  usps: [
    {
      name: 'settings.items',
      label: 'Items',
      type: 'list',
      item: [
        { name: 'icon', label: 'Icon', type: 'select', options: ICONS },
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'text', label: 'Text', type: 'textarea', rows: 2 },
      ],
    },
  ],
  testimonials: [{ name: 'settings.limit', label: 'How many reviews', type: 'number', min: 1, max: 24, help: 'Shows reviews marked “Feature on the home page” first.' }],
  story: [
    { name: 'settings.image', label: 'Image', type: 'image', bucket: 'content' },
    { name: 'settings.body', label: 'Text', type: 'textarea', rows: 6, help: 'Leave an empty line between paragraphs.' },
    { name: 'settings.button_label', label: 'Button text', type: 'text', half: true },
    { name: 'settings.button_url', label: 'Button link', type: 'url', half: true },
    {
      name: 'settings.stats',
      label: 'Figures (counters)',
      type: 'list',
      help: 'Only use real numbers.',
      item: [
        { name: 'value', label: 'Number', type: 'number' },
        { name: 'suffix', label: 'After the number', type: 'text', placeholder: '+' },
        { name: 'label', label: 'Label', type: 'text' },
      ],
    },
  ],
}

function SectionCard({
  s,
  onChange,
  onRemove,
  relations,
}: {
  s: HomeSectionRow
  onChange: (s: HomeSectionRow) => void
  onRemove: () => void
  relations: RelationOptions
}) {
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id })
  const values = s as unknown as Record<string, unknown>
  const fields = FIELDS[s.type].filter((f) => !f.showWhen || f.showWhen.in.includes(getPath(values, f.showWhen.field) as string))
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('rounded-[2px] border border-line bg-surface', isDragging && 'z-10 shadow-lg', !s.is_visible && 'opacity-70')}>
      <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
        <button type="button" {...attributes} {...listeners} className="grid size-9 cursor-grab touch-none place-items-center text-taupe" aria-label="Drag to reorder">
          <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden fill="currentColor">
            {[2, 8, 14].map((y) => [3, 9].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" />))}
          </svg>
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="min-w-0">
            <span className="t-label block text-[0.66rem] text-gold-text">{TYPE_LABEL[s.type]}</span>
            <span className="block truncate text-[0.95rem] text-walnut">{s.title || s.eyebrow || TYPE_LABEL[s.type]}</span>
          </span>
          <IconCaretDown size={14} className={cn('ml-auto shrink-0 text-taupe transition-transform', open && 'rotate-180')} />
        </button>
        <Switch checked={s.is_visible} onChange={(v) => onChange({ ...s, is_visible: v })} />
      </div>
      {open && (
        <div className="border-t border-line px-4 py-5 sm:px-6">
          {(s.type === 'hero' || s.type === 'promo') && (
            <p className="mb-5 rounded-[2px] bg-beige-soft px-4 py-3 text-[0.88rem] text-walnut">
              The content of this section is edited under{' '}
              <Link href={s.type === 'hero' ? '/admin/hero' : '/admin/promos'} className="link-u font-medium">
                {s.type === 'hero' ? 'Hero slides' : 'Promo banners'}
              </Link>
              . Here you can only move or hide it.
            </p>
          )}
          {s.type !== 'hero' && s.type !== 'promo' && (
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[0.85rem] font-medium text-walnut">Small line above</span>
                <input className={adminInput} value={s.eyebrow ?? ''} onChange={(e) => onChange({ ...s, eyebrow: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.85rem] font-medium text-walnut">Heading</span>
                <input className={adminInput} value={s.title ?? ''} onChange={(e) => onChange({ ...s, title: e.target.value })} placeholder={s.type === 'collection' ? 'Uses the collection name' : ''} />
              </label>
              {fields.map((f) => (
                <div key={f.name} className={f.half ? 'sm:col-span-1' : 'sm:col-span-2'}>
                  <FieldControl
                    field={{ ...f, half: false }}
                    value={getPath(values, f.name)}
                    onChange={(v) => onChange(setPath(values, f.name, v) as unknown as HomeSectionRow)}
                    values={values}
                    relations={relations}
                    folder={`home/${s.id}`}
                  />
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={onRemove} className="mt-6 flex items-center gap-1.5 text-[0.82rem] text-error">
            <IconTrash size={14} /> Remove this section
          </button>
        </div>
      )}
    </li>
  )
}

export function HomeSectionsEditor({ initial, relations }: { initial: HomeSectionRow[]; relations: RelationOptions }) {
  const router = useRouter()
  const [sections, setSections] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [adding, setAdding] = useState<HomeSectionType>('products')
  const [pending, start] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const dndId = useId()
  useUnsavedWarning(dirty)

  const update = (next: HomeSectionRow[]) => {
    setSections(next)
    setDirty(true)
  }
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    update(arrayMove(sections, sections.findIndex((s) => s.id === e.active.id), sections.findIndex((s) => s.id === e.over!.id)))
  }
  const add = () =>
    update([
      ...sections,
      {
        id: crypto.randomUUID(),
        type: adding,
        eyebrow: null,
        title: TYPE_LABEL[adding],
        subtitle: null,
        is_visible: true,
        sort_order: sections.length,
        settings: adding === 'products' ? { source: 'featured', layout: 'carousel', limit: 8 } : adding === 'usps' ? { items: [] } : {},
      },
    ])

  return (
    <div>
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {sections.map((s, i) => (
              <SectionCard
                key={s.id}
                s={s}
                relations={relations}
                onChange={(n) => update(sections.map((x, xi) => (xi === i ? n : x)))}
                onRemove={() => window.confirm('Remove this section from the home page?') && update(sections.filter((_, xi) => xi !== i))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <select value={adding} onChange={(e) => setAdding(e.target.value as HomeSectionType)} className={cn(adminInput, 'h-10 w-auto')} aria-label="Section type">
          {(Object.keys(TYPE_LABEL) as HomeSectionType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <button type="button" onClick={add} className="btn btn-secondary btn-sm">
          <IconPlus size={14} /> Add section
        </button>
      </div>
      <SaveBar
        dirty={dirty}
        pending={pending}
        onSave={() =>
          start(async () => {
            const res = await saveHomeSections(sections)
            if (res.ok) {
              setDirty(false)
              toast.success(res.message ?? 'Saved')
              router.refresh()
            } else toast.error(res.message)
          })
        }
      />
    </div>
  )
}
