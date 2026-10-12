import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListingGrid, ListingHeader, ListingSkeleton } from '@/components/catalog/listing'
import { SmartImage } from '@/components/ui/smart-image'
import { formatDayMonth } from '@/lib/format'
import { getSiteData } from '@/lib/data/site'

export const metadata: Metadata = {
  title: 'Sale & offers',
  description: 'Current offers on sofas, tables, beds and more. Discounts apply automatically, with free delivery and cash on delivery.',
  alternates: { canonical: '/sale' },
}

export default function SalePage(props: PageProps<'/sale'>) {
  return (
    <>
      <Suspense fallback={<ListingHeader eyebrow="Offers" title="Sale & offers" crumbs={[{ label: 'Sale' }]} />}>
        <SaleHeader />
      </Suspense>
      <Suspense fallback={<ListingSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function SaleHeader() {
  const data = await getSiteData()
  const banner = data.promos.find((p) => p.placement === 'sale')
  const offers = data.liveOffers.filter((o) => o.badge || o.name)
  return (
    <>
      {banner?.desktop_image && (
        <div className="relative h-[220px] overflow-hidden bg-beige-soft sm:h-[300px] lg:h-[360px]">
          <SmartImage asset={banner.desktop_image} fill priority sizes="100vw" className="anim-settle object-cover" />
          <div className="absolute inset-0 bg-walnut-deep/30" />
        </div>
      )}
      <ListingHeader
        eyebrow={banner?.eyebrow ?? 'Offers'}
        title={banner?.heading ?? 'Sale & offers'}
        intro={banner?.body ?? 'Offers apply automatically. Prices shown already include the discount.'}
        crumbs={[{ label: 'Sale & offers' }]}
      >
        {offers.length > 0 && (
          <ul className="anim-rise mt-8 flex flex-wrap gap-3" style={{ ['--d' as string]: '0.2s' }}>
            {offers.map((o) => (
              <li key={o.id} className="border border-line-strong bg-surface px-4 py-3 text-[0.88rem]">
                <span className="font-medium text-walnut">{o.name}</span>
                <span className="text-taupe">
                  {' · '}
                  {o.discount_type === 'percent' ? `${o.discount_value}% off` : `Rs. ${o.discount_value.toLocaleString('en-US')} off`}
                  {o.ends_at ? ` · until ${formatDayMonth(o.ends_at)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ListingHeader>
    </>
  )
}

async function Results({ searchParams }: Pick<PageProps<'/sale'>, 'searchParams'>) {
  const [params, data] = await Promise.all([searchParams, getSiteData()])
  const products = data.products.filter((p) => p.pricing.sale)
  return (
    <ListingGrid
      data={data}
      products={products}
      params={params}
      pathname="/sale"
      defaultSort="discount"
      emptyTitle="No offers running right now"
    />
  )
}
