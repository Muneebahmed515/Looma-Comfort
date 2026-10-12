import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListingGrid, ListingHeader, ListingSkeleton } from '@/components/catalog/listing'
import { searchProducts } from '@/lib/data/catalog'
import { getSiteData } from '@/lib/data/site'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
}

export default function SearchPage(props: PageProps<'/search'>) {
  return (
    <Suspense fallback={<><ListingHeader title="Search" crumbs={[{ label: 'Search' }]} /><ListingSkeleton /></>}>
      <SearchResults searchParams={props.searchParams} />
    </Suspense>
  )
}

async function SearchResults({ searchParams }: Pick<PageProps<'/search'>, 'searchParams'>) {
  const [params, data] = await Promise.all([searchParams, getSiteData()])
  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim().slice(0, 80) ?? ''
  const results = q ? searchProducts(data.products, q, data.settings.search_synonyms) : []
  return (
    <>
      <ListingHeader
        eyebrow="Search"
        title={q ? `Results for “${q}”` : 'Search the collection'}
        intro={q ? (results.length ? `${results.length} matching ${results.length === 1 ? 'piece' : 'pieces'}.` : 'Nothing matched. Try a different word, or ask us to make it for you.') : 'Use the search icon at the top of the page to find a piece.'}
        crumbs={[{ label: 'Search' }]}
      />
      {q && (
        <ListingGrid
          data={data}
          products={results}
          params={params}
          pathname="/search"
          keepOrder
          emptyTitle={`Nothing found for “${q}”`}
        />
      )}
    </>
  )
}
