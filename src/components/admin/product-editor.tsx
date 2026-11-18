'use client'

import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useTransition, useId } from 'react'
import { toast } from 'sonner'
import { IconArrowLeft, IconArrowUpRight, IconPlus, IconTrash } from '@/components/icons'
import { deleteProducts, duplicateProduct, saveProduct, type ProductInput } from '@/lib/admin/actions'
import type { RelationOptions } from '@/lib/admin/data'
import { cn } from '@/lib/cn'
import { formatPKR, slugify } from '@/lib/format'
import { computePrice, defaultSelection } from '@/lib/pricing'
import type { OptionGroup, ProductImage, Spec } from '@/lib/types'
import { adminInput, FieldControl, RelationPicker, Switch, TagsInput } from './controls'
import { RichTextEditor } from './rich-text-editor'
import { SaveBar, useUnsavedWarning } from './resource-form'
import { compressAndUpload, previewUrl } from './upload'

const SPEC_PRESETS = ['Dimensions', 'Seat height', 'Material', 'Frame', 'Upholstery', 'Finish', 'Weight', 'Seating', 'Assembly', 'Warranty']

function Section({ title, description, children, id }: { title: string; description?: string; children: React.ReactNode; id: string }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[2px] border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-serif text-[1.3rem] font-semibold text-walnut">{title}</h2>
      {description && <p className="mt-1 text-[0.84rem] text-taupe">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[0.85rem] font-medium text-walnut">
      {children}
      {required && <span className="ml-0.5 text-gold-text">*</span>}
    </label>
  )
}

function Err({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1.5 text-[0.8rem] text-error">{msg}</p> : null
}

function SortableImage({ img, index, children }: { img: ProductImage; index: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.ref })
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('relative rounded-[2px] border border-line bg-ivory', isDragging && 'z-10 shadow-lg')}>
      <div {...attributes} {...listeners} className="relative aspect-square cursor-grab touch-none overflow-hidden active:cursor-grabbing">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl(img, 480)} alt={img.alt} className="h-full w-full object-cover" draggable={false} />
        {index === 0 && <span className="t-label absolute top-2 left-2 rounded-[2px] bg-walnut px-2 py-0.5 text-[0.6rem] text-ivory">Main</span>}
      </div>
      {children}
    </li>
  )
}

const EMPTY: ProductInput = {
  name: '',
  slug: '',
  sku: '',
  category_id: null,
  short_description: '',
  description_html: '',
  price: '',
  sale_price: null,
  price_on_request: false,
  stock_status: 'in_stock',
  lead_time: 'Delivered in 5 to 7 working days',
  images: [],
  options: [],
  specifications: [{ label: 'Dimensions', value: '' }, { label: 'Material', value: '' }],
  care_html: '',
  delivery_html: '',
  material_ids: [],
  collection_ids: [],
  related_ids: [],
  tags: [],
  is_best_seller: false,
  is_new_arrival: true,
  is_featured: false,
  is_visible: false,
  seo_title: '',
  seo_description: '',
}

export function ProductEditor({ initial, id, relations, demo }: { initial: Partial<ProductInput> | null; id: string | null; relations: RelationOptions; demo: boolean }) {
  const router = useRouter()
  const [p, setP] = useState<ProductInput>({ ...EMPTY, ...(initial ?? {}) } as ProductInput)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  const [slugTouched, setSlugTouched] = useState(Boolean(id))
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const folder = useMemo(() => (id ? `p/${id}` : `p/new-${crypto.randomUUID().slice(0, 8)}`), [id])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const dndId = useId()
  useUnsavedWarning(dirty)

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setP((s) => {
      const next = { ...s, [key]: value }
      if (key === 'name' && !slugTouched) next.slug = slugify(String(value))
      return next
    })
    setDirty(true)
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: '' }))
  }

  // ------------------------------------------------ images
  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 12)
    for (const [i, file] of list.entries()) {
      setUploading(`Uploading ${i + 1} of ${list.length}…`)
      try {
        const asset = await compressAndUpload(file, 'products', folder, p.name || file.name.replace(/\.[^.]+$/, ''))
        setP((s) => ({ ...s, images: [...s.images, { ...asset, option_value_id: null }] }))
        setDirty(true)
      } catch (e) {
        toast.error((e as Error).message)
        break
      }
    }
    setUploading(null)
    if (fileInput.current) fileInput.current.value = ''
  }
  const onImageDrag = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const from = p.images.findIndex((i) => i.ref === e.active.id)
    const to = p.images.findIndex((i) => i.ref === e.over!.id)
    set('images', arrayMove(p.images, from, to))
  }
  const allOptionValues = p.options.flatMap((g) => g.values.map((v) => ({ id: v.id, label: `${g.name}: ${v.label}` })))

  // ------------------------------------------------ options
  const setGroup = (gi: number, patch: Partial<OptionGroup>) => set('options', p.options.map((g, i) => (i === gi ? { ...g, ...patch } : g)))
  const newId = () => crypto.randomUUID()
  const priceNum = Number(p.price) || 0
  const saleNum = p.sale_price === null || p.sale_price === '' ? null : Number(p.sale_price)
  const preview = computePrice({ price: priceNum, sale_price: saleNum }, null, 0)
  const range = (() => {
    if (!p.options.length) return null
    let min = 0
    let max = 0
    for (const g of p.options) {
      const d = g.values.map((v) => Number(v.price_delta) || 0)
      if (d.length) {
        min += Math.min(...d)
        max += Math.max(...d)
      }
    }
    return min === max ? null : { min: priceNum + min, max: priceNum + max }
  })()

  // ------------------------------------------------ save
  const save = (publishNow?: boolean) =>
    startTransition(async () => {
      const payload = publishNow === undefined ? p : { ...p, is_visible: publishNow }
      const res = await saveProduct(id, payload)
      if (res.ok) {
        setDirty(false)
        setErrors({})
        if (publishNow !== undefined) setP(payload)
        toast.success(res.message ?? 'Saved')
        if (!id && res.data) router.replace(`/admin/products/${res.data.id}`)
        else router.refresh()
      } else {
        toast.error(res.message)
        if (res.errors) {
          setErrors(res.errors)
          const first = Object.keys(res.errors)[0]
          if (first) document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    })

  const duplicate = () =>
    startTransition(async () => {
      if (!id) return
      const res = await duplicateProduct(id)
      if (res.ok && res.data) {
        toast.success(res.message ?? 'Duplicated')
        router.push(`/admin/products/${res.data.id}`)
      } else if (!res.ok) toast.error(res.message)
    })

  const remove = () => {
    if (!id || !window.confirm('Delete this product? Its photos will be deleted too. This cannot be undone.')) return
    startTransition(async () => {
      const res = await deleteProducts([id])
      if (res.ok) {
        setDirty(false)
        toast.success(res.message ?? 'Deleted')
        router.push('/admin/products')
      } else toast.error(res.message)
    })
  }

  const field = (name: keyof ProductInput) => ({ 'data-field': name })

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_260px]">
      <div className="min-w-0 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin/products" className="link-arrow text-[0.85rem] text-taupe hover:text-walnut">
            <IconArrowLeft size={14} /> All products
          </Link>
          <div className="flex items-center gap-4 text-[0.85rem]">
            {id && (
              <button type="button" onClick={duplicate} className="link-u text-walnut" disabled={pending}>
                Duplicate
              </button>
            )}
            {id && p.is_visible && (
              <Link href={`/products/${p.slug}`} target="_blank" className="link-u link-arrow text-walnut">
                View on website <IconArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <Section id="basics" title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2" {...field('name')}>
              <Label required htmlFor="pname">Product name</Label>
              <input id="pname" className={adminInput} value={p.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Round Sheesham Coffee Table" />
              <Err msg={errors.name} />
            </div>
            <div {...field('slug')}>
              <Label required htmlFor="pslug">URL</Label>
              <div className="flex items-center rounded-[2px] border border-line-strong bg-surface focus-within:border-walnut">
                <span className="pl-3 text-[0.82rem] whitespace-nowrap text-taupe">/products/</span>
                <input
                  id="pslug"
                  className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-[0.92rem] text-walnut focus:outline-none"
                  value={p.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                  }}
                />
              </div>
              <Err msg={errors.slug} />
              {id && <p className="mt-1.5 text-[0.76rem] text-taupe">Changing the URL keeps old links working automatically.</p>}
            </div>
            <div {...field('sku')}>
              <Label htmlFor="psku">SKU</Label>
              <input id="psku" className={adminInput} value={p.sku ?? ''} onChange={(e) => set('sku', e.target.value.toUpperCase())} placeholder="LC-CT-401" />
              <Err msg={errors.sku} />
            </div>
            <div className="sm:col-span-2" {...field('category_id')}>
              <Label>Category</Label>
              <RelationPicker options={relations.categories} value={p.category_id} onChange={(v) => set('category_id', v as string | null)} placeholder="Choose a category" />
            </div>
            <div className="sm:col-span-2" {...field('short_description')}>
              <Label htmlFor="pshort">Short description</Label>
              <textarea id="pshort" rows={2} maxLength={400} className={cn(adminInput, 'h-auto py-2.5')} value={p.short_description ?? ''} onChange={(e) => set('short_description', e.target.value)} placeholder="One or two sentences shown near the price." />
            </div>
          </div>
        </Section>

        <Section id="images" title="Photos" description="Drag to reorder. The first photo is the main one. Photos are compressed automatically before upload.">
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onImageDrag}>
            <SortableContext items={p.images.map((i) => i.ref)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {p.images.map((img, i) => (
                  <SortableImage key={img.ref} img={img} index={i}>
                    <div className="space-y-2 p-2">
                      <input
                        className="h-8 w-full rounded-[2px] border border-line bg-surface px-2 text-[0.78rem]"
                        value={img.alt}
                        onChange={(e) => set('images', p.images.map((x, xi) => (xi === i ? { ...x, alt: e.target.value } : x)))}
                        placeholder="Alt text"
                        aria-label="Alt text"
                      />
                      {allOptionValues.length > 0 && (
                        <select
                          className="h-8 w-full rounded-[2px] border border-line bg-surface px-1.5 text-[0.75rem]"
                          value={img.option_value_id ?? ''}
                          onChange={(e) => set('images', p.images.map((x, xi) => (xi === i ? { ...x, option_value_id: e.target.value || null } : x)))}
                          aria-label="Show this photo when an option is chosen"
                        >
                          <option value="">Not linked to an option</option>
                          {allOptionValues.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <button type="button" onClick={() => set('images', p.images.filter((_, xi) => xi !== i))} className="flex items-center gap-1 text-[0.76rem] text-error">
                        <IconTrash size={13} /> Remove
                      </button>
                    </div>
                  </SortableImage>
                ))}
                <li>
                  <button
                    type="button"
                    disabled={Boolean(uploading)}
                    onClick={() => (demo ? toast.error('Demo mode: connect the database to upload photos.') : fileInput.current?.click())}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (demo) return toast.error('Demo mode: connect the database to upload photos.')
                      void addFiles(e.dataTransfer.files)
                    }}
                    className="grid aspect-square w-full place-items-center rounded-[2px] border border-dashed border-line-strong bg-beige-soft text-center text-[0.82rem] text-taupe transition-colors hover:border-walnut"
                  >
                    <span className="flex flex-col items-center gap-1.5 px-3">
                      <IconPlus size={22} />
                      {uploading ?? 'Add photos'}
                      {!uploading && <span className="text-[0.72rem]">Click or drop</span>}
                    </span>
                  </button>
                </li>
              </ul>
            </SortableContext>
          </DndContext>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          <p className="mt-3 text-[0.78rem] text-taupe">Tip: square or 4:5 photos on a plain, warm background look best. At least 1600 px wide.</p>
        </Section>

        <Section id="pricing" title="Pricing" description="Offers you create under Marketing → Offers are applied automatically on top of this.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div {...field('price')}>
              <Label required htmlFor="pprice">Regular price</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.9rem] text-taupe">Rs.</span>
                <input id="pprice" type="number" inputMode="numeric" min={0} className={cn(adminInput, 'tabular pl-11')} value={p.price ?? ''} onChange={(e) => set('price', e.target.value)} />
              </div>
              <Err msg={errors.price} />
            </div>
            <div {...field('sale_price')}>
              <Label htmlFor="psale">Sale price (optional)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[0.9rem] text-taupe">Rs.</span>
                <input id="psale" type="number" inputMode="numeric" min={0} className={cn(adminInput, 'tabular pl-11')} value={p.sale_price ?? ''} onChange={(e) => set('sale_price', e.target.value === '' ? null : e.target.value)} />
              </div>
              <Err msg={errors.sale_price} />
            </div>
            <div className="sm:col-span-2">
              <Switch checked={p.price_on_request} onChange={(v) => set('price_on_request', v)} label="Hide the price (show “Price on request”)" />
            </div>
            {priceNum > 0 && !p.price_on_request && (
              <div className="rounded-[2px] bg-beige-soft px-4 py-3 text-[0.88rem] text-walnut sm:col-span-2">
                Customers see:{' '}
                <strong className="tabular font-medium">{formatPKR(preview.final)}</strong>
                {preview.sale && (
                  <>
                    {' '}
                    <s className="text-taupe">{formatPKR(preview.regular)}</s> <span className="text-gold-text">(−{preview.discountPercent}%)</span>
                  </>
                )}
                {range && (
                  <span className="text-taupe">
                    {' '}
                    · with options from {formatPKR(range.min)} to {formatPKR(range.max)}
                  </span>
                )}
              </div>
            )}
          </div>
        </Section>

        <Section id="options" title="Options" description="Sizes, fabrics or finishes the customer can choose. Extra cost is added to the price (and to the sale price).">
          <div className="space-y-4">
            {p.options.map((g, gi) => (
              <div key={g.id} className="rounded-[2px] border border-line bg-ivory p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
                  <input className={adminInput} value={g.name} onChange={(e) => setGroup(gi, { name: e.target.value })} placeholder="Option name, e.g. Size" aria-label="Option name" />
                  <select className={adminInput} value={g.display} onChange={(e) => setGroup(gi, { display: e.target.value as OptionGroup['display'] })} aria-label="Display as">
                    <option value="buttons">Buttons</option>
                    <option value="swatches">Colour swatches</option>
                    <option value="dropdown">Dropdown</option>
                  </select>
                  <button type="button" onClick={() => set('options', p.options.filter((_, i) => i !== gi))} className="btn btn-sm text-error">
                    Remove option
                  </button>
                </div>
                <ul className="mt-4 space-y-2">
                  {g.values.map((v, vi) => (
                    <li key={v.id} className="grid grid-cols-[1fr_120px_auto] items-center gap-2 sm:grid-cols-[1fr_150px_90px_auto_auto]">
                      <input
                        className={cn(adminInput, 'h-10')}
                        value={v.label}
                        onChange={(e) => setGroup(gi, { values: g.values.map((x, xi) => (xi === vi ? { ...x, label: e.target.value } : x)) })}
                        placeholder="e.g. King"
                        aria-label="Choice"
                      />
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[0.78rem] text-taupe">+Rs.</span>
                        <input
                          type="number"
                          className={cn(adminInput, 'tabular h-10 pl-11')}
                          value={v.price_delta || ''}
                          onChange={(e) => setGroup(gi, { values: g.values.map((x, xi) => (xi === vi ? { ...x, price_delta: Number(e.target.value) || 0 } : x)) })}
                          placeholder="0"
                          aria-label="Extra cost"
                        />
                      </div>
                      {g.display === 'swatches' ? (
                        <input
                          type="color"
                          className="h-10 w-full cursor-pointer rounded-[2px] border border-line-strong bg-surface max-sm:hidden"
                          value={v.swatch_hex ?? '#c49a62'}
                          onChange={(e) => setGroup(gi, { values: g.values.map((x, xi) => (xi === vi ? { ...x, swatch_hex: e.target.value } : x)) })}
                          aria-label="Swatch colour"
                        />
                      ) : (
                        <span className="max-sm:hidden" />
                      )}
                      <label className="flex items-center gap-1.5 text-[0.78rem] text-taupe max-sm:hidden" title="Selected by default">
                        <input
                          type="radio"
                          name={`default-${g.id}`}
                          checked={Boolean(v.is_default)}
                          onChange={() => setGroup(gi, { values: g.values.map((x, xi) => ({ ...x, is_default: xi === vi })) })}
                        />
                        Default
                      </label>
                      <button type="button" onClick={() => setGroup(gi, { values: g.values.filter((_, xi) => xi !== vi) })} className="grid size-9 place-items-center text-error" aria-label="Remove choice">
                        <IconTrash size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm mt-3"
                  onClick={() => setGroup(gi, { values: [...g.values, { id: newId(), label: '', price_delta: 0, swatch_hex: null, is_default: g.values.length === 0, is_available: true }] })}
                >
                  <IconPlus size={13} /> Add choice
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => set('options', [...p.options, { id: newId(), name: p.options.length ? '' : 'Size', display: 'buttons', values: [] }])}
            >
              <IconPlus size={13} /> Add option
            </button>
            {p.options.length > 0 && Object.keys(defaultSelection(p.options)).length > 0 && (
              <p className="text-[0.78rem] text-taupe">The default choices are selected when the page opens.</p>
            )}
          </div>
        </Section>

        <Section id="details" title="Description & details">
          <div className="space-y-6">
            <div>
              <Label>Full description</Label>
              <RichTextEditor value={p.description_html ?? ''} onChange={(v) => set('description_html', v)} />
            </div>
            <div>
              <Label>Specifications</Label>
              <ul className="space-y-2">
                {p.specifications.map((s, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,180px)_1fr_auto] gap-2">
                    <input
                      list="spec-presets"
                      className={cn(adminInput, 'h-10')}
                      value={s.label}
                      onChange={(e) => set('specifications', p.specifications.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))}
                      placeholder="Label"
                      aria-label="Specification label"
                    />
                    <input
                      className={cn(adminInput, 'h-10')}
                      value={s.value}
                      onChange={(e) => set('specifications', p.specifications.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))}
                      placeholder={s.label === 'Dimensions' ? 'W 213 × D 92 × H 84 cm' : 'Value'}
                      aria-label="Specification value"
                    />
                    <button type="button" onClick={() => set('specifications', p.specifications.filter((_, xi) => xi !== i))} className="grid size-10 place-items-center text-error" aria-label="Remove row">
                      <IconTrash size={15} />
                    </button>
                  </li>
                ))}
              </ul>
              <datalist id="spec-presets">
                {SPEC_PRESETS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => set('specifications', [...p.specifications, { label: '', value: '' } as Spec])}>
                <IconPlus size={13} /> Add row
              </button>
            </div>
            <div>
              <Label>Materials (used by the Material filter)</Label>
              <RelationPicker options={relations.materials} value={p.material_ids} onChange={(v) => set('material_ids', (v as string[]) ?? [])} multiple placeholder="Choose materials" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <Label>Care instructions</Label>
                <RichTextEditor value={p.care_html ?? ''} onChange={(v) => set('care_html', v)} />
                <p className="mt-1.5 text-[0.76rem] text-taupe">Leave empty to use the default from Site settings.</p>
              </div>
              <div>
                <Label>Delivery & returns</Label>
                <RichTextEditor value={p.delivery_html ?? ''} onChange={(v) => set('delivery_html', v)} />
                <p className="mt-1.5 text-[0.76rem] text-taupe">Leave empty to use the default from Site settings.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="organise" title="Stock & organisation">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="pstock">Availability</Label>
              <select id="pstock" className={adminInput} value={p.stock_status} onChange={(e) => set('stock_status', e.target.value)}>
                <option value="in_stock">In stock</option>
                <option value="made_to_order">Made to order</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>
            <div>
              <Label htmlFor="plead">Delivery time shown to customers</Label>
              <input id="plead" className={adminInput} value={p.lead_time ?? ''} onChange={(e) => set('lead_time', e.target.value)} placeholder="Delivered in 5 to 7 working days" />
            </div>
            <div className="rounded-[2px] bg-beige-soft px-4 py-3 sm:col-span-2 xl:hidden">
              <Switch checked={p.is_visible} onChange={(v) => set('is_visible', v)} label={p.is_visible ? 'Published on the website' : 'Draft (hidden from the website)'} />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 sm:col-span-2">
              <Switch checked={p.is_best_seller} onChange={(v) => set('is_best_seller', v)} label="Best seller" />
              <Switch checked={p.is_new_arrival} onChange={(v) => set('is_new_arrival', v)} label="New arrival" />
              <Switch checked={p.is_featured} onChange={(v) => set('is_featured', v)} label="Featured" />
            </div>
            <div className="sm:col-span-2">
              <Label>Collections</Label>
              <RelationPicker options={relations.collections} value={p.collection_ids} onChange={(v) => set('collection_ids', (v as string[]) ?? [])} multiple placeholder="Add to collections" />
            </div>
            <div className="sm:col-span-2">
              <Label>Search tags</Label>
              <TagsInput value={p.tags} onChange={(v) => set('tags', v)} placeholder="e.g. centre table, living room" />
              <p className="mt-1.5 text-[0.76rem] text-taupe">Words people might search for. Also used to suggest related products.</p>
            </div>
            <div className="sm:col-span-2">
              <Label>Related products (optional)</Label>
              <RelationPicker options={relations.products.filter((x) => x.value !== id)} value={p.related_ids} onChange={(v) => set('related_ids', (v as string[]) ?? [])} multiple placeholder="Chosen automatically if empty" />
            </div>
          </div>
        </Section>

        <Section id="seo" title="Search engines" description="Optional. Leave empty to use the product name and short description.">
          <div className="grid gap-5">
            <FieldControl field={{ name: 'seo_title', label: 'SEO title', type: 'text', maxLength: 70 }} value={p.seo_title} onChange={(v) => set('seo_title', String(v ?? ''))} values={{}} relations={relations} folder={folder} />
            <FieldControl field={{ name: 'seo_description', label: 'SEO description', type: 'textarea', maxLength: 170, rows: 3 }} value={p.seo_description} onChange={(v) => set('seo_description', String(v ?? ''))} values={{}} relations={relations} folder={folder} />
            <div className="rounded-[2px] border border-line bg-ivory p-4">
              <p className="text-[0.74rem] text-taupe">Google preview</p>
              <p className="mt-1 truncate text-[1.05rem] text-[#1a0dab]">{(p.seo_title || p.name || 'Product name') + ' | Looma Comfort'}</p>
              <p className="truncate text-[0.8rem] text-[#006621]">loomacomfort.com › products › {p.slug || 'product-url'}</p>
              <p className="mt-0.5 line-clamp-2 text-[0.84rem] text-[#545454]">{p.seo_description || p.short_description || 'A short description of the product appears here.'}</p>
            </div>
          </div>
        </Section>

        <SaveBar
          dirty={dirty}
          pending={pending}
          onSave={() => save()}
          label={p.is_visible ? 'Save & update website' : 'Save draft'}
          extra={
            <>
              {id && (
                <button type="button" onClick={remove} disabled={pending} className="btn btn-sm text-error max-sm:hidden">
                  Delete
                </button>
              )}
              {!p.is_visible && (
                <button type="button" onClick={() => save(true)} disabled={pending} className="btn btn-gold">
                  Publish
                </button>
              )}
            </>
          }
        />
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-[2px] border border-line bg-surface p-5">
            <p className="t-label text-[0.68rem] text-taupe">Status</p>
            <div className="mt-3">
              <Switch checked={p.is_visible} onChange={(v) => set('is_visible', v)} label={p.is_visible ? 'Published' : 'Draft (hidden)'} />
            </div>
          </div>
          <nav className="rounded-[2px] border border-line bg-surface p-5 text-[0.88rem]">
            <p className="t-label mb-3 text-[0.68rem] text-taupe">Sections</p>
            {[
              ['basics', 'Basics'],
              ['images', 'Photos'],
              ['pricing', 'Pricing'],
              ['options', 'Options'],
              ['details', 'Details'],
              ['organise', 'Stock & organisation'],
              ['seo', 'Search engines'],
            ].map(([href, label]) => (
              <a key={href} href={`#${href}`} className="link-u block py-1 text-walnut">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  )
}
