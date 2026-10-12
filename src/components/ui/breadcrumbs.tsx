import Link from 'next/link'
import { SITE_URL } from '@/lib/env'
import { JsonLd } from './json-ld'

export interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: 'Home', href: '/' }, ...items]
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-taupe">
          {all.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="h-px w-3 bg-current opacity-50" />}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="link-u hover:text-walnut">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === all.length - 1 ? 'page' : undefined} className="text-walnut">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: all.map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.label,
            item: c.href ? `${SITE_URL}${c.href}` : undefined,
          })),
        }}
      />
    </>
  )
}
