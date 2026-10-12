import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListingGrid, ListingHeader, ListingSkeleton } from '@/components/catalog/listing'
import { sortProducts } from '@/lib/data/catalog'
import { getSiteData } from '@/lib/data/site'

export const metadata: Metadata = {
  title: 'New arrivals',
  description: 'The newest pieces from the Looma Comfort workshop: sofas, chairs, tables and more.',
  alternates: { canonical: '/new-arrivals' },
}

export default function NewArrivalsPage(props: PageProps<'/new-arrivals'>) {
  return (
    <>
      <ListingHeader
        eyebrow="Just in"
        title="New arrivals"
        intro="Fresh from the workshop. New designs, new fabrics and new finishes, added every month."
        crumbs={[{ label: 'Shop', href: '/shop' }, { label: 'New arrivals' }]}
      />
      <Suspense fallback={<ListingSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function Results({ searchParams }: Pick<PageProps<'/new-arrivals'>, 'searchParams'>) {
  const [params, data] = await Promise.all([searchParams, getSiteData()])
  const flagged = data.products.filter((p) => p.is_new_arrival)
  const products = flagged.length ? flagged : sortProducts(data.products, 'newest').slice(0, 12)
  return <ListingGrid data={data} products={products} params={params} pathname="/new-arrivals" defaultSort="newest" />
}
