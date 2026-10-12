import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { ListingGrid, ListingHeader, ListingSkeleton } from '@/components/catalog/listing'
import { SmartImage } from '@/components/ui/smart-image'
import { absoluteImageUrl } from '@/lib/images'
import { findRedirect, getSiteData } from '@/lib/data/site'

async function getCollection(slug: string) {
  const data = await getSiteData()
  return data.collections.find((c) => c.slug === slug) ?? null
}

export async function generateStaticParams() {
  const data = await getSiteData()
  const list = data.collections.map((c) => ({ slug: c.slug }))
  return list.length ? list : [{ slug: 'featured' }]
}

export async function generateMetadata({ params }: PageProps<'/collections/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const c = await getCollection(slug)
  if (!c) return { title: 'Collection not found' }
  return {
    title: c.seo_title ?? c.name,
    description: c.seo_description ?? c.description ?? undefined,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: { images: c.image ? [{ url: absoluteImageUrl(c.image.ref, 1600), alt: c.image.alt }] : undefined },
  }
}

export default function CollectionPage(props: PageProps<'/collections/[slug]'>) {
  return (
    <>
      <Suspense fallback={<ListingHeader title="" crumbs={[{ label: 'Collections' }]} />}>
        <CollectionHeader params={props.params} />
      </Suspense>
      <Suspense fallback={<ListingSkeleton />}>
        <CollectionResults params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function CollectionHeader({ params }: Pick<PageProps<'/collections/[slug]'>, 'params'>) {
  const { slug } = await params
  const c = await getCollection(slug)
  if (!c) {
    const moved = await findRedirect('collection', slug)
    if (moved) permanentRedirect(`/collections/${moved}`)
    notFound()
  }
  return (
    <>
      {c.image && (
        <div className="relative h-[260px] overflow-hidden bg-beige-soft sm:h-[340px] lg:h-[440px]">
          <SmartImage asset={c.image} fill priority sizes="100vw" className="anim-settle object-cover" />
        </div>
      )}
      <ListingHeader eyebrow="Collection" title={c.name} intro={c.description} crumbs={[{ label: 'Shop', href: '/shop' }, { label: c.name }]} />
    </>
  )
}

async function CollectionResults({ params, searchParams }: Pick<PageProps<'/collections/[slug]'>, 'params' | 'searchParams'>) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const c = await getCollection(slug)
  if (!c) return null
  const data = await getSiteData()
  const products = data.products.filter((p) => p.collection_ids.includes(c.id))
  return <ListingGrid data={data} products={products} params={sp} pathname={`/collections/${c.slug}`} />
}
