import Image from 'next/image'
import Link from 'next/link'
import { IconArrowRight, IconSearch } from '@/components/icons'

const POPULAR = [
  { href: '/shop/sofas', label: 'Sofas' },
  { href: '/shop/beds', label: 'Beds' },
  { href: '/shop/dining-tables', label: 'Dining tables' },
  { href: '/shop/coffee-tables', label: 'Coffee tables' },
]

export function NotFoundContent() {
  return (
    <section className="container-site flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Image src="/brand/logo-mark.png" alt="" width={438} height={432} sizes="96px" className="anim-rise h-20 w-auto opacity-90" />
      <p className="eyebrow-rule t-eyebrow anim-rise mt-8 text-gold-text" style={{ ['--d' as string]: '0.05s' }}>
        Error 404
      </p>
      <h1 className="t-h1 anim-rise mt-4" style={{ ['--d' as string]: '0.1s' }}>
        This room seems empty
      </h1>
      <p className="t-lead anim-rise mt-4 max-w-md text-taupe" style={{ ['--d' as string]: '0.16s' }}>
        The page you were looking for has moved or no longer exists. Let us help you find something beautiful instead.
      </p>
      <form action="/search" role="search" className="anim-rise mt-10 flex w-full max-w-md items-center border-b border-walnut/60" style={{ ['--d' as string]: '0.22s' }}>
        <IconSearch size={20} className="text-walnut" />
        <input name="q" type="search" placeholder="Search for a piece" aria-label="Search" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-walnut placeholder:text-taupe/70 focus:outline-none" />
        <button type="submit" className="t-label py-3 text-[0.72rem] text-walnut">
          Search
        </button>
      </form>
      <ul className="anim-rise mt-8 flex flex-wrap justify-center gap-2" style={{ ['--d' as string]: '0.28s' }}>
        {POPULAR.map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="block rounded-[2px] border border-line-strong px-4 py-2 text-[0.88rem] text-walnut transition-colors hover:border-walnut">
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="anim-rise mt-10 flex flex-wrap justify-center gap-3" style={{ ['--d' as string]: '0.34s' }}>
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
        <Link href="/shop" className="btn btn-secondary">
          Shop all <IconArrowRight size={16} className="btn-icon" />
        </Link>
      </div>
    </section>
  )
}
