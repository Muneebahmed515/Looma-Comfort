import type { Metadata } from 'next'
import { ListingHeader } from '@/components/catalog/listing'
import { WishlistView } from '@/components/catalog/wishlist-view'
import { getSiteData } from '@/lib/data/site'
import { SITE_URL } from '@/lib/env'

export const metadata: Metadata = {
  title: 'Your wishlist',
  robots: { index: false, follow: true },
}

export default async function WishlistPage() {
  const { settings } = await getSiteData()
  return (
    <>
      <ListingHeader
        eyebrow="Saved for later"
        title="Your wishlist"
        intro="Pieces you have saved on this device. Send the whole list to us on WhatsApp for prices, availability and delivery in one go."
        crumbs={[{ label: 'Wishlist' }]}
      />
      <WishlistView whatsappNumber={settings.whatsapp_number} siteUrl={SITE_URL} />
    </>
  )
}
