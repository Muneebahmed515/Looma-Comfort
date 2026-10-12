import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListingGrid, ListingHeader, ListingSkeleton } from '@/components/catalog/listing'
import { getSiteData } from '@/lib/data/site'
import { bestSellers } from '@/lib/data/sections'

export const metadata: Metadata = {
  title: 'Best sellers',
  description: 'Our most-loved sofas, tables, beds and chairs, chosen again and again by homes across Pakistan.',
  alternates: { canonical: '/best-sellers' },
}

export default function BestSellersPage(props: PageProps<'/best-sellers'>) {
  return (
    <>
      <ListingHeader
        eyebrow="Most loved"
        title="Best sellers"
        intro="The pieces our customers order most, refined over many homes and many years."
        crumbs={[{ label: 'Shop', href: '/shop' }, { label: 'Best sellers' }]}
      />
      <Suspense fallback={<ListingSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function Results({ searchParams }: Pick<PageProps<'/best-sellers'>, 'searchParams'>) {
  const [params, data] = await Promise.all([searchParams, getSiteData()])
  return <ListingGrid data={data} products={bestSellers(data.products)} params={params} pathname="/best-sellers" defaultSort="best-sellers" keepOrder />
}
