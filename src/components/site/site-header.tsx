import { lean, type SiteData } from '@/lib/data/build'
import { whatsappLink } from '@/lib/whatsapp'
import { HeaderClient, type HeaderData } from './header-client'
import { Logo } from './logo'

export function buildSocials(s: SiteData['settings']) {
  return [
    s.instagram_url && { label: 'Instagram', href: s.instagram_url },
    s.facebook_url && { label: 'Facebook', href: s.facebook_url },
    s.tiktok_url && { label: 'TikTok', href: s.tiktok_url },
    s.youtube_url && { label: 'YouTube', href: s.youtube_url },
  ].filter((x): x is { label: string; href: string } => Boolean(x))
}

export function SiteHeader({ data }: { data: SiteData }) {
  const s = data.settings
  const top = data.categories.filter((c) => !c.parent_id && c.show_in_menu && c.productCount > 0)
  const newest = [...data.products].filter((p) => p.is_new_arrival).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const headerData: HeaderData = {
    categories: top.slice(0, 4).map((c) => ({
      name: c.name,
      slug: c.slug,
      image: lean(c.image),
      children: data.categories
        .filter((x) => x.parent_id === c.id && x.show_in_menu && x.productCount > 0)
        .map((x) => ({ name: x.name, slug: x.slug, image: lean(x.image) })),
    })),
    promo: newest
      ? { eyebrow: 'Just arrived', title: newest.name, href: `/products/${newest.slug}`, image: lean(newest.images[0]) }
      : null,
    whatsappHref: whatsappLink(s.whatsapp_number, s.whatsapp_general_message),
    phone: s.phone,
    socials: buildSocials(s),
    popularSearches: s.popular_searches,
  }
  return <HeaderClient data={headerData} logo={<Logo priority />} />
}
