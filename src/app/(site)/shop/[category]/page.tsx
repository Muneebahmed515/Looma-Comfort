import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { ListingGrid, ListingHeader, ListingSkeleton, SubcategoryChips } from '@/components/catalog/listing'
import { SmartImage } from '@/components/ui/smart-image'
import { absoluteImageUrl } from '@/lib/images'
import { findRedirect, getCategoryBySlug, getSiteData } from '@/lib/data/site'

export async function generateStaticParams() {
  const data = await getSiteData()
  const slugs = data.categories.map((c) => ({ category: c.slug }))
  return slugs.length ? slugs : [{ category: 'all' }]
}

export async function generateMetadata({ params }: PageProps<'/shop/[category]'>): Promise<Metadata> {
  const { category: slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Category not found' }
  const description =
    category.seo_description ?? category.description ?? `Shop ${category.name.toLowerCase()} from Looma Comfort, delivered across Pakistan.`
  return {
    title: category.seo_title ?? category.name,
    description,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: {
      title: category.seo_title ?? category.name,
      description,
      images: category.image ? [{ url: absoluteImageUrl(category.image.ref, 1600), alt: category.image.alt }] : undefined,
    },
  }
}

export default function CategoryPage(props: PageProps<'/shop/[category]'>) {
  return (
    <>
      <Suspense fallback={<ListingHeader title="" crumbs={[{ label: 'Shop', href: '/shop' }]} />}>
        <CategoryHeader params={props.params} />
      </Suspense>
      <Suspense fallback={<ListingSkeleton />}>
        <CategoryResults params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </>
  )
}

async function resolve(slug: string) {
  const category = await getCategoryBySlug(slug)
  if (category) return category
  const moved = await findRedirect('category', slug)
  if (moved) permanentRedirect(`/shop/${moved}`)
  notFound()
}

async function CategoryHeader({ params }: Pick<PageProps<'/shop/[category]'>, 'params'>) {
  const { category: slug } = await params
  const category = await resolve(slug)
  const data = await getSiteData()
  const parent = category.parent_id ? data.categories.find((c) => c.id === category.parent_id) : undefined
  const chipSource = category.childIds.length ? category : parent
  const chips = chipSource
    ? data.categories
        .filter((c) => c.parent_id === chipSource.id && c.productCount > 0)
        .map((c) => ({ name: c.name, slug: c.slug, active: c.id === category.id }))
    : []
  const crumbs = [
    { label: 'Shop', href: '/shop' },
    ...(parent ? [{ label: parent.name, href: `/shop/${parent.slug}` }] : []),
    { label: category.name },
  ]
  return (
    <>
      {category.banner && (
        <div className="relative h-[220px] overflow-hidden bg-beige-soft sm:h-[300px] lg:h-[380px]">
          <SmartImage asset={category.banner} fill priority sizes="100vw" className="anim-settle object-cover" />
        </div>
      )}
      <ListingHeader eyebrow={parent?.name ?? 'Shop'} title={category.name} intro={category.description} crumbs={crumbs}>
        {chipSource && chips.length > 1 && (
          <SubcategoryChips items={[{ name: `All ${chipSource.name.toLowerCase()}`, slug: chipSource.slug, active: chipSource.id === category.id }, ...chips]} />
        )}
      </ListingHeader>
    </>
  )
}

async function CategoryResults({ params, searchParams }: Pick<PageProps<'/shop/[category]'>, 'params' | 'searchParams'>) {
  const [{ category: slug }, sp] = await Promise.all([params, searchParams])
  const category = await getCategoryBySlug(slug)
  if (!category) return null
  const data = await getSiteData()
  const products = data.products.filter((p) => p.categoryIds.includes(category.id))
  return (
    <ListingGrid
      data={data}
      products={products}
      params={sp}
      pathname={`/shop/${category.slug}`}
      scope={category}
      showCategoryFilter={category.childIds.length > 0}
      emptyTitle={products.length ? undefined : 'New pieces are on their way'}
    />
  )
}
