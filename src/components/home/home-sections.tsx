import { Suspense } from 'react'
import { toCard, type CategoryNode, type SiteData } from '@/lib/data/build'
import { productsForSection } from '@/lib/data/sections'
import { BrandStory } from './brand-story'
import { CategoryShowcase } from './category-showcase'
import { FeaturedCollection } from './featured-collection'
import { HeroSlider } from './hero-slider'
import { ProductSection } from './product-section'
import { PromoBanner } from './promo-banner'
import { Testimonials } from './testimonials'
import { UspGrid } from './usp-grid'

type Section = SiteData['homeSections'][number]

/** Renders the homepage from the ordered, admin-editable list of sections. */
export function HomeSections({ data }: { data: SiteData }) {
  // Each section is its own Suspense boundary so React hydrates them one at a time
  // (shorter main-thread tasks on phones). All content is still in the prerendered HTML.
  return (
    <>
      {data.homeSections.map((section) => (
        <Suspense key={section.id} fallback={null}>
          <HomeSection section={section} data={data} />
        </Suspense>
      ))}
    </>
  )
}

function HomeSection({ section, data }: { section: Section; data: SiteData }) {
  const s = section.settings ?? {}
  const link = s.link_label && s.link_url ? { label: s.link_label, href: s.link_url } : null

  switch (section.type) {
    case 'hero':
      return (
        <HeroSlider
          slides={data.heroSlides.map((h) => ({
            id: h.id,
            eyebrow: h.eyebrow,
            heading: h.heading,
            subheading: h.subheading,
            button_label: h.button_label,
            button_url: h.button_url,
            desktop_image: h.desktop_image,
            mobile_image: h.mobile_image,
            text_align: h.text_align,
            text_tone: h.text_tone,
            overlay: h.overlay,
          }))}
        />
      )
    case 'categories': {
      const ids = s.category_ids ?? []
      const cats = ids.length
        ? ids.map((id) => data.categories.find((c) => c.id === id)).filter((c): c is CategoryNode => Boolean(c))
        : data.categories.filter((c) => c.parent_id)
      return <CategoryShowcase eyebrow={section.eyebrow} title={section.title} categories={cats.filter((c) => c.productCount > 0)} link={link} />
    }
    case 'products':
      return (
        <ProductSection
          eyebrow={section.eyebrow}
          title={section.title}
          products={productsForSection(s, data.products).map(toCard)}
          layout={s.layout === 'grid' ? 'grid' : 'carousel'}
          link={link}
        />
      )
    case 'promo': {
      const banner = data.promos.find((p) => p.placement === 'home')
      if (!banner) return null
      const offer = banner.offer_id ? data.liveOffers.find((o) => o.id === banner.offer_id) : null
      return <PromoBanner banner={banner} endsAt={offer?.ends_at} />
    }
    case 'collection': {
      const collection = data.collections.find((c) => c.id === s.collection_id) ?? data.collections[0]
      if (!collection) return null
      const horizontal = s.layout === 'horizontal'
      const products = data.products.filter((p) => p.collection_ids.includes(collection.id)).slice(0, horizontal ? 8 : 4)
      return (
        <FeaturedCollection
          eyebrow={section.eyebrow}
          collection={collection}
          products={products.map(toCard)}
          layout={horizontal ? 'horizontal' : 'editorial'}
        />
      )
    }
    case 'usps':
      return <UspGrid eyebrow={section.eyebrow} title={section.title} items={s.items ?? []} />
    case 'testimonials': {
      const featured = data.reviews.filter((r) => r.is_featured)
      return (
        <Testimonials
          eyebrow={section.eyebrow}
          title={section.title}
          reviews={(featured.length ? featured : data.reviews).slice(0, s.limit ?? 8)}
          products={data.products}
        />
      )
    }
    case 'story':
      return <BrandStory eyebrow={section.eyebrow} title={section.title} settings={s} />
    default:
      return null
  }
}
