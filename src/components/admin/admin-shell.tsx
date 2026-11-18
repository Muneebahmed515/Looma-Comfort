'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { IconArrowUpRight, IconClose, IconMenu } from '@/components/icons'
import { signOut } from '@/lib/admin/actions'
import { cn } from '@/lib/cn'

const NAV: { title: string; items: { href: string; label: string; ownerOnly?: boolean }[] }[] = [
  { title: '', items: [{ href: '/admin', label: 'Dashboard' }] },
  {
    title: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/categories', label: 'Categories' },
      { href: '/admin/collections', label: 'Collections' },
      { href: '/admin/materials', label: 'Materials' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/admin/homepage', label: 'Home page' },
      { href: '/admin/hero', label: 'Hero slides' },
      { href: '/admin/offers', label: 'Offers' },
      { href: '/admin/promos', label: 'Promo banners' },
      { href: '/admin/announcements', label: 'Announcement bar' },
      { href: '/admin/reviews', label: 'Reviews' },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/pages', label: 'Pages' },
      { href: '/admin/faqs', label: 'FAQs' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { href: '/admin/inbox', label: 'Inbox' },
      { href: '/admin/subscribers', label: 'Subscribers' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { href: '/admin/settings', label: 'Site settings', ownerOnly: true },
      { href: '/admin/team', label: 'Team' },
      { href: '/admin/account', label: 'My account' },
    ],
  },
]

interface ShellProps {
  children: ReactNode
  user: { email: string; role: 'owner' | 'editor'; demo: boolean }
  badges?: Partial<Record<string, number>>
}

export function AdminShell({ children, user, badges = {} }: ShellProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  // Close the mobile menu after navigating (adjusting state during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`))

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-5">
      {NAV.map((group) => (
        <div key={group.title || 'top'} className="mb-5">
          {group.title && <p className="t-label mb-2 px-3 text-[0.62rem] text-ivory/45">{group.title}</p>}
          <ul className="space-y-0.5">
            {group.items
              .filter((i) => !i.ownerOnly || user.role === 'owner')
              .map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between rounded-[2px] px-3 py-2 text-[0.9rem] transition-colors',
                      isActive(item.href) ? 'bg-ivory/12 text-ivory shadow-[inset_2px_0_0_var(--color-gold)]' : 'text-ivory/72 hover:bg-ivory/6 hover:text-ivory',
                    )}
                  >
                    {item.label}
                    {badges[item.href] ? (
                      <span className="tabular rounded-full bg-gold px-1.5 text-[0.68rem] leading-[1.15rem] text-walnut-deep">{badges[item.href]}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  const footer = (
    <div className="border-t border-ivory/10 px-5 py-4 text-[0.8rem] text-ivory/65">
      <p className="truncate" title={user.email}>
        {user.email}
      </p>
      <p className="mt-0.5 text-ivory/40 capitalize">{user.role}</p>
      {!user.demo && (
        <form action={signOut} className="mt-3">
          <button type="submit" className="link-u text-ivory/80">
            Sign out
          </button>
        </form>
      )}
    </div>
  )

  return (
    <div className="min-h-svh bg-ivory lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col bg-walnut-deep text-ivory lg:flex">
        <Link href="/admin" className="flex items-center gap-3 border-b border-ivory/10 px-5 py-5">
          <span>
            <Image src="/brand/wordmark-light.png" alt="Looma Comfort" width={912} height={224} className="h-6 w-auto" />
            <span className="t-label mt-1 block text-[0.58rem] text-gold">Admin</span>
          </span>
        </Link>
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ivory px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="-ml-2 grid size-11 place-items-center text-walnut" aria-label="Open admin menu">
          <IconMenu size={24} />
        </button>
        <span className="t-label text-[0.72rem] text-walnut">Looma Admin</span>
        <Link href="/" target="_blank" className="-mr-2 grid size-11 place-items-center text-walnut" aria-label="View website">
          <IconArrowUpRight size={20} />
        </Link>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-walnut-deep/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-[82vw] max-w-[300px] flex-col bg-walnut-deep text-ivory">
            <div className="flex items-center justify-between border-b border-ivory/10 px-5 py-4">
              <span className="t-label text-[0.72rem] text-gold">Looma Admin</span>
              <button type="button" onClick={() => setOpen(false)} className="-mr-2 grid size-10 place-items-center" aria-label="Close menu">
                <IconClose size={20} />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <div className="min-w-0">
        {user.demo && (
          <div className="border-b border-gold/40 bg-gold-soft/50 px-4 py-2.5 text-center text-[0.82rem] text-walnut lg:px-8">
            <strong className="font-medium">Demo mode.</strong> You are exploring the admin with sample data. Connect the Neon database (see README) to sign in and save changes.
          </div>
        )}
        <div className="hidden items-center justify-end gap-4 border-b border-line px-8 py-3 lg:flex">
          <Link href="/" target="_blank" className="link-u link-arrow text-[0.85rem] text-walnut">
            View website <IconArrowUpRight size={14} />
          </Link>
        </div>
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  )
}

export function AdminHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[2rem] leading-tight font-medium text-walnut lg:text-[2.4rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[0.92rem] text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className, title, description }: { children: ReactNode; className?: string; title?: string; description?: string }) {
  return (
    <section className={cn('rounded-[2px] border border-line bg-surface p-5 sm:p-6', className)}>
      {title && <h2 className="font-serif text-[1.35rem] font-semibold text-walnut">{title}</h2>}
      {description && <p className="mt-1 text-[0.85rem] text-taupe">{description}</p>}
      {(title || description) && <div className="mt-5" />}
      {children}
    </section>
  )
}
