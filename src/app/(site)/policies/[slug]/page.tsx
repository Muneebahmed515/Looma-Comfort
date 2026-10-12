import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getPage } from '@/lib/data/site'
import { formatDate } from '@/lib/format'
import { withHeadingIds } from '@/lib/sanitize'

const POLICY_SLUGS = ['shipping', 'refund-and-returns', 'privacy', 'terms'] as const

const OTHER = [
  { slug: 'shipping', label: 'Shipping & delivery' },
  { slug: 'refund-and-returns', label: 'Refunds & returns' },
  { slug: 'privacy', label: 'Privacy policy' },
  { slug: 'terms', label: 'Terms of service' },
]

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/policies/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: 'Policy not found' }
  return {
    title: page.seo_title ?? page.title,
    description: page.seo_description ?? page.intro ?? undefined,
    alternates: { canonical: `/policies/${slug}` },
  }
}

export default function PolicyPage(props: PageProps<'/policies/[slug]'>) {
  return (
    <Suspense fallback={<div className="container-site min-h-[60vh] py-16" />}>
      <Policy params={props.params} />
    </Suspense>
  )
}

async function Policy({ params }: Pick<PageProps<'/policies/[slug]'>, 'params'>) {
  const { slug } = await params
  if (!(POLICY_SLUGS as readonly string[]).includes(slug)) notFound()
  const page = await getPage(slug)
  if (!page) notFound()
  const { html, toc } = withHeadingIds(page.body_html ?? '')
  return (
    <article className="container-site pt-8 pb-24 lg:pt-12">
      <Breadcrumbs items={[{ label: 'Policies' }, { label: page.title }]} className="anim-fade" />
      <header className="mt-10 max-w-3xl lg:mt-14">
        <h1 className="t-h1 anim-rise">{page.title}</h1>
        {page.intro && <p className="t-lead anim-rise mt-4 text-taupe">{page.intro}</p>}
        <p className="anim-fade mt-4 text-[0.82rem] text-taupe">Last updated {formatDate(page.updated_at)}</p>
      </header>
      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            {toc.length > 1 && (
              <details className="group border-y border-line py-4 lg:border-0 lg:py-0" open>
                <summary className="t-label flex cursor-pointer list-none items-center justify-between text-[0.72rem] text-walnut lg:pointer-events-none">
                  On this page
                </summary>
                <ol className="mt-4 space-y-2.5 text-[0.9rem]">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="link-u text-taupe hover:text-walnut">
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            )}
            <div className="mt-10 hidden lg:block">
              <p className="t-label text-[0.72rem] text-walnut">Other policies</p>
              <ul className="mt-4 space-y-2.5 text-[0.9rem]">
                {OTHER.filter((o) => o.slug !== slug).map((o) => (
                  <li key={o.slug}>
                    <Link href={`/policies/${o.slug}`} className="link-u text-taupe hover:text-walnut">
                      {o.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
        <div className="prose-looma max-w-[680px] lg:col-span-8 lg:col-start-5 [&_h2]:scroll-mt-28" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  )
}
