import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { Suspense } from 'react'
import { Carousel } from '@/components/catalog/carousel'
import { ProductCard } from '@/components/catalog/product-card'
import { Stars } from '@/components/home/testimonials'
import { ProductProvider, type ProductClientData } from '@/components/product/product-context'
import { ProductGallery } from '@/components/product/product-gallery'
import { ProductPurchase } from '@/components/product/product-purchase'
import { RecentlyViewed } from '@/components/product/recently-viewed'
import { ReviewForm } from '@/components/product/review-form'
import { AccordionItem } from '@/components/ui/accordion'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { JsonLd } from '@/components/ui/json-ld'
import { RichText } from '@/components/ui/rich-text'
import { SectionHeading } from '@/components/ui/section-heading'
import { toCard } from '@/lib/data/build'
import { relatedProducts } from '@/lib/data/catalog'
import { findRedirect, getProductBySlug, getSiteData } from '@/lib/data/site'
import { SITE_URL } from '@/lib/env'
import { formatDate } from '@/lib/format'
import { absoluteImageUrl } from '@/lib/images'
import { htmlToText } from '@/lib/sanitize'

export async function generateStaticParams() {
  const data = await getSiteData()
  const list = data.products.map((p) => ({ slug: p.slug }))
  return list.length ? list : [{ slug: 'coming-soon' }]
}

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductBySlug(slug)
  if (!p) return { title: 'Product not found' }
  const description = p.seo_description ?? (p.short_description || htmlToText(p.description_html, 155))
  const image = p.images[0]
  return {
    title: p.seo_title ?? p.name,
    description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: {
      type: 'website',
      title: p.seo_title ?? p.name,
      description,
      url: `/products/${p.slug}`,
      images: image ? [{ url: absoluteImageUrl(image.ref, 1600), width: image.w, height: image.h, alt: image.alt }] : undefined,
    },
  }
}

export default function ProductPage(props: PageProps<'/products/[slug]'>) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={props.params} />
    </Suspense>
  )
}

function ProductSkeleton() {
  return (
    <div className="container-site grid gap-10 pt-8 pb-24 lg:grid-cols-12 lg:gap-14 lg:pt-12">
      <div className="aspect-square animate-pulse bg-beige-soft lg:col-span-7" />
      <div className="space-y-4 lg:col-span-5">
        <div className="h-3 w-24 bg-beige-soft" />
        <div className="h-10 w-3/4 bg-beige-soft" />
        <div className="h-6 w-40 bg-beige-soft" />
      </div>
    </div>
  )
}

async function ProductView({ params }: Pick<PageProps<'/products/[slug]'>, 'params'>) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) {
    const moved = await findRedirect('product', slug)
    if (moved) permanentRedirect(`/products/${moved}`)
    notFound()
  }
  const data = await getSiteData()
  const s = data.settings
  const url = `${SITE_URL}/products/${product.slug}`
  const reviews = data.reviews.filter((r) => r.product_id === product.id)
  const related = relatedProducts(product, data.products, 8)

  const client: ProductClientData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    url,
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    images: product.images.map((img) => ({ ...img, full: absoluteImageUrl(img.ref, 1600) })),
    options: product.options,
    price: product.price,
    sale_price: product.sale_price,
    offer: product.offer,
    priceOnRequest: product.price_on_request,
    stock: product.stock_status,
    leadTime: product.lead_time,
  }

  const crumbs = [
    { label: 'Shop', href: '/shop' },
    ...(product.parentCategory ? [{ label: product.parentCategory.name, href: `/shop/${product.parentCategory.slug}` }] : []),
    ...(product.category ? [{ label: product.category.name, href: `/shop/${product.category.slug}` }] : []),
    { label: product.name },
  ]

  const availability =
    product.stock_status === 'in_stock'
      ? 'https://schema.org/InStock'
      : product.stock_status === 'made_to_order'
        ? 'https://schema.org/PreOrder'
        : 'https://schema.org/OutOfStock'

  return (
    <>
      <div className="container-site pt-6 lg:pt-10">
        <Breadcrumbs items={crumbs} className="anim-fade" />
      </div>

      <ProductProvider product={client}>
        <section className="container-site grid gap-8 pt-6 pb-16 lg:grid-cols-12 lg:gap-14 lg:pt-10 lg:pb-24 xl:gap-20">
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <ProductGallery />
            </div>
          </div>
          <div className="lg:col-span-5">
            <ProductPurchase
              whatsappNumber={s.whatsapp_number}
              orderTemplate={s.whatsapp_order_template}
              replyNote={s.whatsapp_reply_note}
              rating={product.reviewCount ? { average: product.ratingAverage ?? 5, count: product.reviewCount } : null}
            />
            {product.short_description && <p className="mt-8 text-[0.98rem] leading-relaxed text-taupe-deep">{product.short_description}</p>}
            <div className="mt-8 border-t border-line">
              {product.description_html && (
                <AccordionItem level="h2" title="Description" defaultOpen>
                  <RichText html={product.description_html} />
                </AccordionItem>
              )}
              {product.specifications.length > 0 && (
                <AccordionItem level="h2" title="Specifications">
                  <dl className="divide-y divide-line">
                    {product.specifications.map((spec) => (
                      <div key={spec.label} className="grid grid-cols-[minmax(110px,40%)_1fr] gap-4 py-2.5 text-[0.9rem]">
                        <dt className="text-taupe">{spec.label}</dt>
                        <dd className="text-walnut">{spec.value}</dd>
                      </div>
                    ))}
                    {product.materialNames.length > 0 && !product.specifications.some((x) => /material/i.test(x.label)) && (
                      <div className="grid grid-cols-[minmax(110px,40%)_1fr] gap-4 py-2.5 text-[0.9rem]">
                        <dt className="text-taupe">Materials</dt>
                        <dd className="text-walnut">{product.materialNames.join(', ')}</dd>
                      </div>
                    )}
                    {product.sku && (
                      <div className="grid grid-cols-[minmax(110px,40%)_1fr] gap-4 py-2.5 text-[0.9rem]">
                        <dt className="text-taupe">SKU</dt>
                        <dd className="tabular text-walnut">{product.sku}</dd>
                      </div>
                    )}
                  </dl>
                </AccordionItem>
              )}
              <AccordionItem level="h2" title="Care instructions">
                <RichText html={product.care_html ?? s.default_care_html} />
              </AccordionItem>
              <AccordionItem level="h2" title="Delivery & returns">
                <RichText html={product.delivery_html ?? s.default_delivery_html} />
                <Link href="/policies/refund-and-returns" className="link-u mt-4 inline-block text-[0.88rem] text-gold-text">
                  Read our return policy
                </Link>
              </AccordionItem>
            </div>
          </div>
        </section>
      </ProductProvider>

      <section id="reviews" className="section-y scroll-mt-24 border-t border-line">
        <div className="container-site grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Reviews" title={reviews.length ? 'What customers say' : 'Be the first to review'} />
            {reviews.length > 0 && (
              <p className="mt-5 flex items-center gap-3 text-[0.9rem] text-taupe">
                <Stars rating={product.ratingAverage ?? 5} />
                {product.ratingAverage?.toFixed(1)} from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            )}
            <div className="mt-8">
              <ReviewForm productId={product.id} />
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            {reviews.length ? (
              <ul className="divide-y divide-line border-y border-line">
                {reviews.map((r) => (
                  <li key={r.id} className="py-7" data-reveal="up">
                    <Stars rating={r.rating} />
                    <p className="mt-4 font-serif text-[1.25rem] leading-relaxed text-walnut">“{r.body}”</p>
                    <p className="mt-4 text-[0.85rem] text-taupe">
                      <span className="text-walnut">{r.customer_name}</span>
                      {r.city ? `, ${r.city}` : ''}
                      {r.review_date ? ` · ${formatDate(r.review_date)}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-taupe">No reviews yet. Bought this piece? We would love to hear what you think.</p>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-y overflow-hidden bg-beige-soft">
          <div className="container-site">
            <SectionHeading eyebrow="You may also like" title="Pieces that pair well" />
            <div className="mt-10 lg:mt-14">
              <Carousel label="Related products">
                {related.map((p) => (
                  <ProductCard key={p.id} product={toCard(p)} />
                ))}
              </Carousel>
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed currentId={product.id} />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.short_description || htmlToText(product.description_html, 500),
          sku: product.sku ?? undefined,
          image: product.images.map((i) => absoluteImageUrl(i.ref, 1600)),
          category: product.category?.name,
          material: product.materialNames.join(', ') || undefined,
          brand: { '@type': 'Brand', name: s.brand_name },
          url,
          offers: product.price_on_request
            ? undefined
            : {
                '@type': 'Offer',
                url,
                priceCurrency: 'PKR',
                price: product.pricing.final,
                priceValidUntil: product.offer?.ends_at ? product.offer.ends_at.slice(0, 10) : undefined,
                availability,
                itemCondition: 'https://schema.org/NewCondition',
                seller: { '@type': 'Organization', name: s.brand_name },
                shippingDetails: {
                  '@type': 'OfferShippingDetails',
                  shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'PKR' },
                  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
                },
                hasMerchantReturnPolicy: {
                  '@type': 'MerchantReturnPolicy',
                  applicableCountry: 'PK',
                  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                  merchantReturnDays: 7,
                },
              },
          aggregateRating:
            reviews.length > 0
              ? { '@type': 'AggregateRating', ratingValue: product.ratingAverage, reviewCount: reviews.length }
              : undefined,
          review: reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            author: { '@type': 'Person', name: r.customer_name },
            reviewBody: r.body,
          })),
        }}
      />
    </>
  )
}
