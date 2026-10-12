import Link from 'next/link'
import { AdminHeader, Card } from '@/components/admin/admin-shell'
import { RefreshButton } from '@/components/admin/misc'
import { IconArrowRight, IconCheck } from '@/components/icons'
import { requireAdmin } from '@/lib/admin/auth'
import { clickTotals, listActivity, listMessages, storageUsageBytes, topRequested } from '@/lib/admin/data'
import { buildSiteData } from '@/lib/data/build'
import { fetchSiteRows } from '@/lib/data/rows'
import { demoRows } from '@/lib/demo/data'
import { isSupabaseConfigured } from '@/lib/env'
import { formatDateTime } from '@/lib/format'
import { createSupabaseServer } from '@/lib/supabase/server'

// Per-user page: allowed to wait for the server on navigation.
export const instant = false

const TABLE_LABEL: Record<string, string> = {
  products: 'Product',
  categories: 'Category',
  collections: 'Collection',
  offers: 'Offer',
  hero_slides: 'Hero slide',
  promo_banners: 'Promo banner',
  announcements: 'Announcement',
  reviews: 'Review',
  pages: 'Page',
  faqs: 'FAQ',
  home_sections: 'Home page',
  site_settings: 'Settings',
  materials: 'Material',
}
const ACTION_LABEL: Record<string, string> = { insert: 'added', update: 'updated', delete: 'deleted' }

/** Pricing snapshot as of now (the dashboard always renders per request). */
function buildSnapshot(rows: Parameters<typeof buildSiteData>[0]) {
  return buildSiteData(rows, Date.now())
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Karachi' }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default async function DashboardPage() {
  const admin = await requireAdmin()
  const rows = isSupabaseConfigured ? await fetchSiteRows(await createSupabaseServer()) : demoRows
  const snapshot = buildSnapshot(rows)
  const [activity, messages, top, clicks, storage] = await Promise.all([listActivity(10), listMessages(), topRequested(30), clickTotals(30), storageUsageBytes()])

  const drafts = rows.products.filter((p) => !p.is_visible).length
  const pendingReviews = rows.reviews.filter((r) => r.status === 'pending').length
  const newMessages = messages.filter((m) => m.status === 'new').length
  const onSale = snapshot.products.filter((p) => p.pricing.sale).length
  const s = rows.settings

  const checklist = [
    { done: Boolean(s.whatsapp_number && !/^\+?92?3000000000$/.test(s.whatsapp_number.replace(/\s/g, ''))), label: 'Add your WhatsApp number', href: '/admin/settings' },
    { done: Boolean(s.address && s.address !== 'Lahore, Pakistan'), label: 'Add your showroom address and map', href: '/admin/settings' },
    { done: !rows.products.some((p) => p.images.some((i) => i.ref.startsWith('/demo/'))), label: 'Replace demo photos with your own', href: '/admin/products' },
    { done: Boolean(s.instagram_url && s.instagram_url !== 'https://www.instagram.com/'), label: 'Link your Instagram, Facebook and TikTok', href: '/admin/settings' },
    { done: Boolean(s.ga4_id || s.meta_pixel_id), label: 'Connect Google Analytics or Meta Pixel', href: '/admin/settings' },
    { done: isSupabaseConfigured, label: 'Connect Supabase so changes can be saved', href: '#' },
  ]
  const remaining = checklist.filter((c) => !c.done)

  const stats = [
    { label: 'Published products', value: snapshot.products.length, href: '/admin/products' },
    { label: 'Drafts', value: drafts, href: '/admin/products' },
    { label: 'On sale now', value: onSale, href: '/sale', external: true },
    { label: 'Live offers', value: snapshot.liveOffers.length, href: '/admin/offers' },
    { label: 'New messages', value: newMessages, href: '/admin/inbox', highlight: newMessages > 0 },
    { label: 'Reviews to approve', value: pendingReviews, href: '/admin/reviews', highlight: pendingReviews > 0 },
    { label: 'WhatsApp clicks (30 days)', value: clicks.total, href: '/admin' },
    { label: 'Categories', value: snapshot.categories.filter((c) => c.parent_id).length, href: '/admin/categories' },
  ]

  const usedMb = storage != null ? storage / 1024 / 1024 : null

  return (
    <>
      <AdminHeader
        title={`${greeting()}${admin.name ? `, ${admin.name.split(' ')[0]}` : ''}`}
        description="Here is how Looma Comfort is doing today."
        actions={
          <>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm">
              Add product
            </Link>
            <Link href="/admin/offers/new" className="btn btn-secondary btn-sm">
              New offer
            </Link>
            <RefreshButton />
          </>
        }
      />

      {remaining.length > 0 && (
        <Card className="mb-6 border-gold/50 bg-gold-soft/25" title="Finish setting up" description={`${checklist.length - remaining.length} of ${checklist.length} done`}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 text-[0.9rem] text-walnut">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${c.done ? 'border-success bg-success text-ivory' : 'border-line-strong'}`}>
                    {c.done && <IconCheck size={11} weight="bold" />}
                  </span>
                  <span className={c.done ? 'text-taupe line-through' : ''}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((st) => (
          <Link
            key={st.label}
            href={st.href}
            target={st.external ? '_blank' : undefined}
            className={`group rounded-[2px] border bg-surface p-5 transition-colors hover:border-walnut ${st.highlight ? 'border-gold' : 'border-line'}`}
          >
            <p className="text-[0.8rem] text-taupe">{st.label}</p>
            <p className="tabular mt-2 font-serif text-[2.2rem] leading-none text-walnut">{st.value.toLocaleString('en-US')}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Most requested on WhatsApp" description="Order button clicks per product, last 30 days.">
          {top.length ? (
            <ol className="space-y-3">
              {top.map((t, i) => {
                const max = top[0]!.clicks || 1
                return (
                  <li key={t.product_id}>
                    <div className="flex items-center justify-between gap-3 text-[0.9rem]">
                      <Link href={`/admin/products/${t.product_id}`} className="link-u truncate text-walnut">
                        {i + 1}. {t.name}
                      </Link>
                      <span className="tabular text-taupe">{t.clicks}</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-line">
                      <div className="h-1 bg-gold" style={{ width: `${(t.clicks / max) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="text-[0.9rem] text-taupe">No WhatsApp orders yet. They will appear here as customers tap “Order on WhatsApp”.</p>
          )}
        </Card>

        <Card title="Recent changes">
          {activity.length ? (
            <ul className="divide-y divide-line">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 py-2.5 text-[0.88rem]">
                  <span className="min-w-0 text-walnut">
                    <span className="text-taupe">{TABLE_LABEL[a.entity_type] ?? a.entity_type} {ACTION_LABEL[a.action] ?? a.action}:</span>{' '}
                    <span className="break-words">{a.entity_label}</span>
                    {a.user_email && <span className="block text-[0.76rem] text-taupe">by {a.user_email}</span>}
                  </span>
                  <span className="shrink-0 text-[0.76rem] text-taupe">{formatDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.9rem] text-taupe">Changes made in the admin appear here.</p>
          )}
        </Card>

        <Card title="Latest messages">
          {messages.length ? (
            <ul className="divide-y divide-line">
              {messages.slice(0, 5).map((m) => (
                <li key={m.id} className="py-2.5 text-[0.88rem]">
                  <Link href="/admin/inbox" className="flex justify-between gap-4">
                    <span className="min-w-0">
                      <span className="font-medium text-walnut">{m.name}</span>
                      {m.status === 'new' && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[0.68rem] text-walnut-deep">New</span>}
                      <span className="block truncate text-taupe">{m.subject ?? m.message}</span>
                    </span>
                    <span className="shrink-0 text-[0.76rem] text-taupe">{formatDateTime(m.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.9rem] text-taupe">No messages yet.</p>
          )}
          <Link href="/admin/inbox" className="link-arrow link-u mt-4 text-[0.85rem] text-walnut">
            Open inbox <IconArrowRight size={14} />
          </Link>
        </Card>

        <Card title="Image storage" description="Free plan includes 1 GB. Each product photo uses about 0.4 MB.">
          {usedMb != null ? (
            <>
              <div className="h-2 bg-line">
                <div className={`h-2 ${usedMb > 800 ? 'bg-error' : 'bg-walnut'}`} style={{ width: `${Math.min(100, (usedMb / 1024) * 100)}%` }} />
              </div>
              <p className="tabular mt-3 text-[0.88rem] text-walnut">
                {usedMb.toFixed(1)} MB of 1,024 MB used ({((usedMb / 1024) * 100).toFixed(1)}%)
              </p>
            </>
          ) : (
            <p className="text-[0.9rem] text-taupe">Storage usage is not available.</p>
          )}
        </Card>
      </div>
    </>
  )
}
