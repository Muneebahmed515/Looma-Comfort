// Row shapes mirror the database tables in db/migrations.
// Image fields hold an "image ref": either a local path (/demo/x.webp) or a storage key
// (products/<id>/<image>.webp), resolved to URLs by src/lib/images.ts.

export type StockStatus = 'in_stock' | 'out_of_stock' | 'made_to_order'
export type DiscountType = 'percent' | 'fixed'
export type OfferScope = 'all' | 'categories' | 'collections' | 'products'
export type ReviewStatus = 'pending' | 'approved' | 'hidden'
export type MessageStatus = 'new' | 'read' | 'replied' | 'archived'

export interface ImageAsset {
  ref: string
  alt: string
  w: number
  h: number
  blur?: string | null
}

export interface ProductImage extends ImageAsset {
  option_value_id?: string | null
}

export interface OptionValue {
  id: string
  label: string
  price_delta: number
  swatch_hex?: string | null
  is_default?: boolean
  is_available?: boolean
}

export interface OptionGroup {
  id: string
  name: string
  display: 'buttons' | 'swatches' | 'dropdown'
  values: OptionValue[]
}

export interface Spec {
  label: string
  value: string
}

export interface CategoryRow {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image: ImageAsset | null
  banner: ImageAsset | null
  sort_order: number
  show_in_menu: boolean
  is_visible: boolean
  seo_title: string | null
  seo_description: string | null
  updated_at: string
}

export interface MaterialRow {
  id: string
  name: string
  slug: string
  sort_order: number
}

export interface CollectionRow {
  id: string
  name: string
  slug: string
  description: string | null
  image: ImageAsset | null
  is_visible: boolean
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  updated_at: string
}

export interface ProductRow {
  id: string
  name: string
  slug: string
  sku: string | null
  category_id: string | null
  short_description: string | null
  description_html: string | null
  price: number
  sale_price: number | null
  price_on_request: boolean
  stock_status: StockStatus
  lead_time: string | null
  images: ProductImage[]
  options: OptionGroup[]
  specifications: Spec[]
  care_html: string | null
  delivery_html: string | null
  material_ids: string[]
  collection_ids: string[]
  related_ids: string[]
  tags: string[]
  is_best_seller: boolean
  is_new_arrival: boolean
  is_featured: boolean
  is_visible: boolean
  sort_order: number
  order_clicks: number
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface OfferRow {
  id: string
  name: string
  badge: string | null
  discount_type: DiscountType
  discount_value: number
  scope: OfferScope
  category_ids: string[]
  collection_ids: string[]
  product_ids: string[]
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  priority: number
}

export interface AnnouncementRow {
  id: string
  message: string
  link_url: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  sort_order: number
}

export interface HeroSlideRow {
  id: string
  eyebrow: string | null
  heading: string
  subheading: string | null
  button_label: string | null
  button_url: string | null
  desktop_image: ImageAsset | null
  mobile_image: ImageAsset | null
  text_align: 'left' | 'center' | 'right'
  text_tone: 'light' | 'dark'
  overlay: number
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  sort_order: number
}

export interface PromoBannerRow {
  id: string
  placement: 'home' | 'shop' | 'sale'
  layout: 'full' | 'split'
  eyebrow: string | null
  heading: string
  body: string | null
  button_label: string | null
  button_url: string | null
  desktop_image: ImageAsset | null
  mobile_image: ImageAsset | null
  offer_id: string | null
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  sort_order: number
}

export type HomeSectionType =
  | 'hero'
  | 'categories'
  | 'products'
  | 'promo'
  | 'collection'
  | 'usps'
  | 'testimonials'
  | 'story'

export interface Stat {
  value: number
  suffix?: string
  label: string
}

export interface UspItem {
  icon: string
  title: string
  text: string
}

export interface HomeSectionSettings {
  source?: 'best_sellers' | 'new_arrivals' | 'featured' | 'sale' | 'category' | 'manual'
  category_id?: string | null
  product_ids?: string[]
  category_ids?: string[]
  collection_id?: string | null
  limit?: number
  layout?: 'carousel' | 'grid' | 'editorial' | 'horizontal'
  link_label?: string
  link_url?: string
  items?: UspItem[]
  image?: ImageAsset | null
  body?: string
  button_label?: string
  button_url?: string
  stats?: Stat[]
}

export interface HomeSectionRow {
  id: string
  type: HomeSectionType
  eyebrow: string | null
  title: string | null
  subtitle: string | null
  is_visible: boolean
  sort_order: number
  settings: HomeSectionSettings
}

export interface ReviewRow {
  id: string
  product_id: string | null
  customer_name: string
  city: string | null
  rating: number
  title: string | null
  body: string
  source: string
  status: ReviewStatus
  is_featured: boolean
  review_date: string | null
  created_at: string
}

export interface PageBlocks {
  values?: { title: string; text: string }[]
  steps?: { title: string; text: string }[]
  gallery?: ImageAsset[]
  stats?: Stat[]
  options?: { title: string; text: string; image?: ImageAsset | null }[]
  sections?: { heading: string; body: string; image?: ImageAsset | null }[]
}

export interface PageRow {
  id: string
  slug: string
  title: string
  intro: string | null
  body_html: string | null
  blocks: PageBlocks
  hero_image: ImageAsset | null
  seo_title: string | null
  seo_description: string | null
  updated_at: string
}

export interface FaqRow {
  id: string
  question: string
  answer_html: string
  group_name: string
  sort_order: number
  is_visible: boolean
  show_on_customize: boolean
}

export interface SettingsRow {
  id: number
  brand_name: string
  tagline: string | null
  whatsapp_number: string | null
  whatsapp_order_template: string
  whatsapp_general_message: string
  whatsapp_custom_message: string
  whatsapp_reply_note: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  map_embed_url: string | null
  map_link_url: string | null
  business_hours: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  logo: ImageAsset | null
  default_seo_title: string | null
  default_seo_description: string | null
  og_image: ImageAsset | null
  ga4_id: string | null
  meta_pixel_id: string | null
  gsc_verification: string | null
  default_delivery_html: string | null
  default_care_html: string | null
  search_synonyms: Record<string, string>
  popular_searches: string[]
  intro_enabled: boolean
  updated_at: string
}

export interface ContactMessageRow {
  id: string
  type: 'contact' | 'custom_order'
  name: string
  phone: string
  email: string | null
  city: string | null
  subject: string | null
  message: string
  product_id: string | null
  details: Record<string, string>
  status: MessageStatus
  created_at: string
}

export interface SubscriberRow {
  id: string
  email: string
  source: string | null
  created_at: string
  unsubscribed_at: string | null
}

export interface ActivityRow {
  id: number
  user_id: string | null
  user_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  entity_label: string | null
  created_at: string
}

/** Everything the public site reads, as raw rows. */
export interface SiteRows {
  settings: SettingsRow
  categories: CategoryRow[]
  materials: MaterialRow[]
  collections: CollectionRow[]
  products: ProductRow[]
  offers: OfferRow[]
  announcements: AnnouncementRow[]
  hero_slides: HeroSlideRow[]
  promo_banners: PromoBannerRow[]
  home_sections: HomeSectionRow[]
  reviews: ReviewRow[]
  pages: PageRow[]
  faqs: FaqRow[]
}
