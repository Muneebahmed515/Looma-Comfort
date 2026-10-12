import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListingGrid, ListingHeader, ListingSkeleton } from '@/components/catalog/listing'
import { getSiteData } from '@/lib/data/site'

export const metadata: Metadata = {
  title: 'Shop all furniture',
  description: 'Browse sofas, chairs, coffee and dining tables, beds, TV consoles and storage. Free delivery across Pakistan and cash on delivery.',
  alternates: { canonical: '/shop' },
}

export default function ShopPage(props: PageProps<'/shop'>) {
  return (
    <>
      <ListingHeader
        eyebrow="The collection"
        title="Shop all furniture"
        intro="Every piece we make, from sofas and dining tables to beds and storage. Filter by room, material or price."
        crumbs={[{ label: 'Shop' }]}
      />
      <Suspense fallback={<ListingSkeleton />}>
        <ShopResults searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function ShopResults({ searchParams }: Pick<PageProps<'/shop'>, 'searchParams'>) {
  const params = await searchParams
  const data = await getSiteData()
  return <ListingGrid data={data} products={data.products} params={params} pathname="/shop" />
}
