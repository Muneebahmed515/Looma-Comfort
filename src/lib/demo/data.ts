// Demo catalogue used when Supabase isn't connected, and the source for supabase/seed.sql.
// Every piece of content here can be edited or replaced from the admin panel.
import { stableId } from '../ids'
import type {
  AnnouncementRow,
  CategoryRow,
  CollectionRow,
  FaqRow,
  HeroSlideRow,
  HomeSectionRow,
  MaterialRow,
  OfferRow,
  OptionGroup,
  PageRow,
  ProductImage,
  ProductRow,
  PromoBannerRow,
  ReviewRow,
  SettingsRow,
  SiteRows,
  Spec,
  StockStatus,
} from '../types'
import { DEFAULT_CUSTOM_MESSAGE, DEFAULT_GENERAL_MESSAGE, DEFAULT_ORDER_TEMPLATE } from '../whatsapp'
import { demoImage as img } from './images'

const T = '2026-10-01T09:00:00.000Z'

// ---------------------------------------------------------------- settings
export const demoSettings: SettingsRow = {
  id: 1,
  brand_name: 'Looma Comfort',
  tagline: 'Furniture for a better home',
  whatsapp_number: '+923000000000',
  whatsapp_order_template: DEFAULT_ORDER_TEMPLATE,
  whatsapp_general_message: DEFAULT_GENERAL_MESSAGE,
  whatsapp_custom_message: DEFAULT_CUSTOM_MESSAGE,
  whatsapp_reply_note: 'We usually reply within an hour, 10 am to 9 pm.',
  phone: '+92 300 0000000',
  email: 'hello@loomacomfort.com',
  address: 'Lahore, Pakistan',
  city: 'Lahore',
  map_embed_url: 'https://www.google.com/maps?q=Lahore%2C%20Pakistan&output=embed',
  map_link_url: 'https://maps.google.com/?q=Lahore,Pakistan',
  business_hours: 'Monday to Saturday, 10:00 am to 8:00 pm',
  facebook_url: 'https://www.facebook.com/',
  instagram_url: 'https://www.instagram.com/',
  tiktok_url: 'https://www.tiktok.com/',
  youtube_url: null,
  logo: null,
  default_seo_title: 'Looma Comfort | Premium Furniture in Pakistan',
  default_seo_description:
    'Handcrafted sofas, beds, dining and living room furniture, delivered across Pakistan. Order on WhatsApp with cash on delivery.',
  og_image: null,
  ga4_id: null,
  meta_pixel_id: null,
  gsc_verification: null,
  default_delivery_html:
    '<p>Free delivery to all major cities in Pakistan. In-stock pieces arrive in 5 to 7 working days; made-to-order pieces in 3 to 4 weeks.</p><p>Inspect your furniture at delivery and pay in cash once you are happy with it.</p>',
  default_care_html:
    '<ul><li>Dust with a soft, dry cloth.</li><li>Keep away from direct sunlight and heaters to protect the finish.</li><li>Wipe spills immediately; avoid harsh chemicals.</li><li>Use coasters and felt pads on wooden surfaces.</li></ul>',
  search_synonyms: {
    shisham: 'sheesham',
    sheesham: 'sheesham',
    almirah: 'cabinet',
    almari: 'cabinet',
    wardrobe: 'cabinet',
    settee: 'sofa',
    couch: 'sofa',
    divan: 'bed',
    'centre table': 'coffee table',
    'center table': 'coffee table',
    'tv trolley': 'tv console',
    'tv unit': 'tv console',
    'side board': 'sideboard',
    ottoman: 'bench',
  },
  popular_searches: ['Sofa', 'Coffee table', 'Sheesham', 'Bed', 'Dining table', 'Accent chair'],
  intro_enabled: true,
  updated_at: T,
}

// ---------------------------------------------------------------- categories
type CatSeed = [slug: string, name: string, parent: string | null, image: Parameters<typeof img>[0] | null, desc: string]
const catSeeds: CatSeed[] = [
  ['seating', 'Seating', null, 'sofa-cognac-room', 'Sofas, chairs, benches and stools made for long evenings and easy mornings.'],
  ['tables', 'Tables', null, 'living-round-tables', 'Coffee, dining, side and console tables in solid wood and considered finishes.'],
  ['bedroom', 'Bedroom', null, 'bedroom-calm', 'Beds and bedroom pieces that make rest feel like a ritual.'],
  ['storage', 'Storage', null, 'sideboard-rattan', 'TV consoles, cabinets and sideboards that keep life beautifully in order.'],
  ['sofas', 'Sofas', 'seating', 'sofa-tan-leather', 'Deep seats, honest frames and fabrics chosen to age well. Three-seaters, sets and L-shapes.'],
  ['chairs', 'Chairs', 'seating', 'armchair-amber', 'Accent chairs, armchairs and dining chairs with a comfortable, tailored silhouette.'],
  ['benches', 'Benches', 'seating', 'bedroom-ottomans', 'Bed-end benches and ottomans that add seating without adding clutter.'],
  ['stools', 'Stools', 'seating', 'stools-kitchen', 'Counter and bar stools in solid wood and powder-coated steel.'],
  ['coffee-tables', 'Coffee Tables', 'tables', 'living-raw-wood-table', 'Round, rectangular and live-edge coffee tables, many in solid sheesham.'],
  ['dining-tables', 'Dining Tables', 'tables', 'dining-sheesham-six', 'Dining tables and sets for four to eight, built for everyday family meals.'],
  ['side-tables', 'Side Tables', 'tables', 'side-table-cove', 'Compact side and bedside tables with clever storage.'],
  ['console-tables', 'Console Tables', 'tables', 'console-sheesham', 'Slim consoles for entryways, hallways and behind-sofa styling.'],
  ['beds', 'Beds', 'bedroom', 'bed-platform-oak', 'Platform, upholstered and storage beds in queen and king sizes.'],
  ['tv-consoles', 'TV Consoles', 'storage', 'tv-unit-floating', 'Low media units and sideboards with cable management built in.'],
  ['cabinets-storage', 'Cabinets & Storage', 'storage', 'cabinet-tall-open', 'Cabinets, dressers and shelving that make room for everything.'],
]
const catId = (slug: string) => stableId(`category:${slug}`)

export const demoCategories: CategoryRow[] = catSeeds.map(([slug, name, parent, image, desc], i) => ({
  id: catId(slug),
  parent_id: parent ? catId(parent) : null,
  name,
  slug,
  description: desc,
  image: image ? img(image, name) : null,
  banner: null,
  sort_order: i,
  show_in_menu: true,
  is_visible: true,
  seo_title: null,
  seo_description: null,
  updated_at: T,
}))

// ---------------------------------------------------------------- materials
const materialNames = [
  'Sheesham Wood',
  'Mango Wood',
  'Oak Veneer',
  'Engineered Wood',
  'Velvet',
  'Linen Blend',
  'Genuine Leather',
  'Leatherette',
  'Boucle',
  'Rattan Cane',
  'Powder-Coated Steel',
]
const matId = (name: string) => stableId(`material:${name}`)
export const demoMaterials: MaterialRow[] = materialNames.map((name, i) => ({
  id: matId(name),
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  sort_order: i,
}))

// ---------------------------------------------------------------- collections
const colId = (slug: string) => stableId(`collection:${slug}`)
export const demoCollections: CollectionRow[] = [
  {
    id: colId('living-room-edit'),
    name: 'The Living Room Edit',
    slug: 'living-room-edit',
    description:
      'Warm woods, soft upholstery and pieces that work together. A living room that feels finished, without trying too hard.',
    image: img('living-terracotta', 'A warm living room with a terracotta sofa and plants'),
    is_visible: true,
    sort_order: 0,
    seo_title: null,
    seo_description: null,
    updated_at: T,
  },
  {
    id: colId('sheesham-signature'),
    name: 'Sheesham Signature',
    slug: 'sheesham-signature',
    description: 'Solid Pakistani sheesham, hand-finished in our workshop. Heirloom pieces with natural grain in every one.',
    image: img('console-sheesham', 'Solid sheesham console table'),
    is_visible: true,
    sort_order: 1,
    seo_title: null,
    seo_description: null,
    updated_at: T,
  },
  {
    id: colId('bedroom-retreat'),
    name: 'Bedroom Retreat',
    slug: 'bedroom-retreat',
    description: 'Calm, considered bedroom furniture for slower mornings.',
    image: img('bedroom-calm', 'A calm bedroom in soft neutrals'),
    is_visible: true,
    sort_order: 2,
    seo_title: null,
    seo_description: null,
    updated_at: T,
  },
]

// ---------------------------------------------------------------- products
const prodId = (slug: string) => stableId(`product:${slug}`)
const optId = (slug: string, key: string) => stableId(`option:${slug}:${key}`)

function group(slug: string, name: string, display: OptionGroup['display'], values: [string, number, string?][]): OptionGroup {
  return {
    id: optId(slug, name),
    name,
    display,
    values: values.map(([label, delta, hex], i) => ({
      id: optId(slug, `${name}:${label}`),
      label,
      price_delta: delta,
      swatch_hex: hex ?? null,
      is_default: i === 0,
      is_available: true,
    })),
  }
}

interface ProductSeed {
  slug: string
  name: string
  sku: string
  category: string
  price: number
  sale?: number
  short: string
  description: string
  images: [Parameters<typeof img>[0], string][]
  options?: OptionGroup[]
  specs: Spec[]
  materials: string[]
  collections?: string[]
  tags: string[]
  flags?: ('best' | 'new' | 'featured')[]
  stock?: StockStatus
  lead?: string
  clicks?: number
  created?: string
}

const seeds: ProductSeed[] = [
  {
    slug: 'alder-three-seater-leather-sofa',
    name: 'Alder Three-Seater Leather Sofa',
    sku: 'LC-SF-101',
    category: 'sofas',
    price: 189000,
    short: 'A low, generous sofa in full-grain leather that softens and deepens in colour with every year.',
    description:
      '<p>The Alder is built around a kiln-dried sheesham frame and sinuous springs, then wrapped in full-grain leather that develops a rich patina over time. Feather-blend seat cushions keep their shape while still feeling relaxed.</p><p>Choose the classic three-seater, a matching three-plus-two set, or an L-shape for open living rooms.</p>',
    images: [
      ['sofa-tan-leather', 'Alder three-seater sofa in tan leather'],
      ['sofa-cognac-room', 'Alder sofa styled in a bright living room'],
    ],
    options: [],
    specs: [
      { label: 'Dimensions', value: 'W 213 × D 92 × H 84 cm' },
      { label: 'Seat height', value: '45 cm' },
      { label: 'Frame', value: 'Kiln-dried solid sheesham' },
      { label: 'Upholstery', value: 'Full-grain leather' },
      { label: 'Seating', value: '3 people' },
      { label: 'Assembly', value: 'Legs attach on delivery' },
      { label: 'Warranty', value: '5 years on frame' },
    ],
    materials: ['Genuine Leather', 'Sheesham Wood'],
    collections: ['living-room-edit'],
    tags: ['sofa', 'leather', 'living room', 'three seater'],
    flags: ['best', 'featured'],
    clicks: 148,
  },
  {
    slug: 'maren-velvet-sofa',
    name: 'Maren Velvet Sofa',
    sku: 'LC-SF-102',
    category: 'sofas',
    price: 145000,
    short: 'Rounded arms, a deep seat and a velvet that catches the light.',
    description:
      '<p>Maren pairs a soft, rounded silhouette with tapered solid-wood legs. The high-density foam seat is wrapped in fibre for a cushion that feels plush on day one and still looks neat a year later.</p>',
    images: [
      ['sofa-emerald-velvet', 'Maren velvet sofa in emerald'],
      ['living-loft', 'Maren sofa in an open-plan loft'],
    ],
    specs: [
      { label: 'Dimensions', value: 'W 198 × D 88 × H 80 cm' },
      { label: 'Frame', value: 'Solid sheesham and ply' },
      { label: 'Upholstery', value: 'Performance velvet' },
      { label: 'Seating', value: '3 people' },
      { label: 'Warranty', value: '3 years on frame' },
    ],
    materials: ['Velvet', 'Sheesham Wood'],
    tags: ['sofa', 'velvet', 'living room'],
    flags: ['new'],
    clicks: 61,
    created: '2026-09-28T09:00:00.000Z',
  },
  {
    slug: 'sana-channel-tufted-loveseat',
    name: 'Sana Channel-Tufted Loveseat',
    sku: 'LC-SF-103',
    category: 'sofas',
    price: 98500,
    short: 'A compact two-seater with vertical channel tufting and a shapely, curved back.',
    description:
      '<p>Sana is sized for apartments and reading corners. Its channel-tufted back gives gentle support, and the slim arms keep the footprint small without losing comfort.</p>',
    images: [['loveseat-grey-channel', 'Sana channel-tufted loveseat in dove grey']],
    specs: [
      { label: 'Dimensions', value: 'W 152 × D 80 × H 82 cm' },
      { label: 'Upholstery', value: 'Velvet' },
      { label: 'Seating', value: '2 people' },
      { label: 'Legs', value: 'Powder-coated steel' },
    ],
    materials: ['Velvet', 'Powder-Coated Steel'],
    tags: ['sofa', 'loveseat', 'two seater', 'apartment'],
    clicks: 37,
  },
  {
    slug: 'ivory-cloud-sofa',
    name: 'Ivory Cloud Sofa',
    sku: 'LC-SF-104',
    category: 'sofas',
    price: 132000,
    short: 'An airy, cream sofa with plump cushions and a relaxed, low profile.',
    description:
      '<p>The Cloud is our softest sofa: loose back cushions, a deep seat and a washable linen-blend cover that comes off for cleaning.</p>',
    images: [
      ['sofa-ivory-cloud', 'Ivory Cloud sofa in cream linen'],
      ['living-raw-wood-table', 'Ivory Cloud sofa styled with a raw wood coffee table'],
    ],
    specs: [
      { label: 'Dimensions', value: 'W 220 × D 98 × H 78 cm' },
      { label: 'Upholstery', value: 'Linen blend, removable cover' },
      { label: 'Seating', value: '3 people' },
      { label: 'Warranty', value: '3 years on frame' },
    ],
    materials: ['Linen Blend', 'Sheesham Wood'],
    collections: ['living-room-edit'],
    tags: ['sofa', 'cream', 'linen', 'living room'],
    flags: ['featured'],
    clicks: 72,
  },
  {
    slug: 'terracotta-lounge-sofa',
    name: 'Terracotta Lounge Sofa',
    sku: 'LC-SF-105',
    category: 'sofas',
    price: 118000,
    short: 'A sun-warmed terracotta tone on a clean-lined, mid-century frame.',
    description:
      '<p>Inspired by mid-century lounges, this sofa sits on tapered solid-wood legs with button-back cushions and a firm, supportive seat.</p>',
    images: [
      ['sofa-terracotta', 'Terracotta lounge sofa'],
      ['living-terracotta', 'Terracotta lounge sofa in a warm living room'],
    ],
    specs: [
      { label: 'Dimensions', value: 'W 205 × D 86 × H 82 cm' },
      { label: 'Upholstery', value: 'Textured weave' },
      { label: 'Seating', value: '3 people' },
    ],
    materials: ['Linen Blend', 'Mango Wood'],
    collections: ['living-room-edit'],
    tags: ['sofa', 'mid century', 'living room'],
    flags: ['new'],
    clicks: 44,
    created: '2026-09-20T09:00:00.000Z',
  },
  {
    slug: 'noor-tufted-accent-chair',
    name: 'Noor Tufted Accent Chair',
    sku: 'LC-CH-201',
    category: 'chairs',
    price: 54999,
    short: 'A button-tufted accent chair with turned legs and a softly flared back.',
    description:
      '<p>Noor brings a touch of classic detail to bedrooms and living rooms. Turned solid-wood legs, deep button tufting and a seat that invites you to stay a while.</p>',
    images: [['chair-ivory-tufted', 'Noor tufted accent chair in ivory']],
    specs: [
      { label: 'Dimensions', value: 'W 72 × D 70 × H 86 cm' },
      { label: 'Upholstery', value: 'Velvet' },
      { label: 'Legs', value: 'Turned solid wood' },
    ],
    materials: ['Velvet', 'Sheesham Wood'],
    tags: ['chair', 'accent chair', 'bedroom'],
    clicks: 25,
  },
  {
    slug: 'amber-wingback-armchair',
    name: 'Amber Wingback Armchair',
    sku: 'LC-CH-202',
    category: 'chairs',
    price: 62500,
    sale: 56999,
    short: 'A modern wingback in warm mustard, made for reading lamps and slow Sundays.',
    description:
      '<p>The Amber wingback wraps you in a high, sculpted back with gentle wings. Pair it with the matching footstool for the full reading-corner experience.</p>',
    images: [
      ['armchair-amber', 'Amber wingback armchair in mustard'],
      ['armchair-yellow-room', 'Amber armchair styled beside a floor lamp'],
    ],
    specs: [
      { label: 'Dimensions', value: 'W 78 × D 82 × H 102 cm' },
      { label: 'Upholstery', value: 'Velvet' },
      { label: 'Legs', value: 'Solid wood, walnut stain' },
    ],
    materials: ['Velvet', 'Sheesham Wood'],
    tags: ['chair', 'armchair', 'wingback', 'reading'],
    flags: ['best'],
    clicks: 96,
  },
  {
    slug: 'shahi-carved-armchair',
    name: 'Shahi Carved Armchair',
    sku: 'LC-CH-203',
    category: 'chairs',
    price: 78000,
    short: 'Hand-carved solid sheesham with a jacquard seat: a classic made in Chiniot tradition.',
    description:
      '<p>Each Shahi chair is hand-carved by craftsmen trained in the Chiniot tradition, then finished in our workshop. The jacquard upholstery is chosen to complement the carving without competing with it.</p>',
    images: [['armchair-carved', 'Shahi hand-carved armchair in sheesham with jacquard upholstery']],
    specs: [
      { label: 'Dimensions', value: 'W 74 × D 70 × H 108 cm' },
      { label: 'Frame', value: 'Hand-carved solid sheesham' },
      { label: 'Upholstery', value: 'Jacquard' },
    ],
    materials: ['Sheesham Wood'],
    collections: ['sheesham-signature'],
    tags: ['chair', 'carved', 'chiniot', 'classic', 'sheesham'],
    flags: ['featured'],
    stock: 'made_to_order',
    lead: 'Made to order: 3 to 4 weeks',
    clicks: 31,
  },
  {
    slug: 'rowan-dining-chair',
    name: 'Rowan Dining Chair',
    sku: 'LC-CH-204',
    category: 'chairs',
    price: 18499,
    short: 'An upholstered dining chair with a curved back and solid-wood legs.',
    description: '<p>Comfortable through long dinners, with a curved back that supports without feeling formal.</p>',
    images: [['chair-dining-grey', 'Rowan upholstered dining chair in grey']],
    specs: [
      { label: 'Dimensions', value: 'W 50 × D 56 × H 92 cm' },
      { label: 'Seat height', value: '47 cm' },
      { label: 'Legs', value: 'Solid ash' },
    ],
    materials: ['Linen Blend', 'Sheesham Wood'],
    tags: ['chair', 'dining chair'],
    clicks: 19,
  },
  {
    slug: 'haven-lounge-chair',
    name: 'Haven Lounge Chair',
    sku: 'LC-CH-205',
    category: 'chairs',
    price: 58000,
    short: 'A sink-in lounge chair with a high back and soft, rounded arms.',
    description: '<p>The Haven is the chair everyone ends up in. Deep, softly structured and finished with a removable cushion.</p>',
    images: [['armchair-haven', 'Haven lounge chair with throw and cushions']],
    specs: [
      { label: 'Dimensions', value: 'W 84 × D 86 × H 96 cm' },
      { label: 'Upholstery', value: 'Boucle' },
    ],
    materials: ['Boucle'],
    tags: ['chair', 'lounge chair', 'armchair'],
    flags: ['new'],
    clicks: 12,
    created: '2026-10-04T09:00:00.000Z',
  },
  {
    slug: 'lahori-ladder-back-chair',
    name: 'Lahori Ladder-Back Chair',
    sku: 'LC-CH-206',
    category: 'chairs',
    price: 16999,
    short: 'A traditional ladder-back in solid sheesham, light enough to move around the house.',
    description: '<p>Simple, sturdy and honest: the ladder-back is a design that has earned its place over generations.</p>',
    images: [['chair-ladder-back', 'Lahori ladder-back chair in solid wood']],
    specs: [
      { label: 'Dimensions', value: 'W 46 × D 48 × H 94 cm' },
      { label: 'Material', value: 'Solid sheesham' },
    ],
    materials: ['Sheesham Wood'],
    collections: ['sheesham-signature'],
    tags: ['chair', 'dining chair', 'sheesham', 'traditional'],
    clicks: 9,
  },
  {
    slug: 'oak-counter-stool',
    name: 'Oak Counter Stool',
    sku: 'LC-ST-301',
    category: 'stools',
    price: 15999,
    short: 'A pared-back wooden stool with a softly dished seat and footrest.',
    description: '<p>Built with mortise-and-tenon joints and finished in a hard-wearing matte lacquer.</p>',
    images: [['stool-oak-counter', 'Oak counter stool in natural finish']],
    specs: [
      { label: 'Dimensions', value: 'W 40 × D 40 × H 65 cm' },
      { label: 'Material', value: 'Solid wood' },
    ],
    materials: ['Oak Veneer', 'Sheesham Wood'],
    tags: ['stool', 'counter stool', 'kitchen'],
    clicks: 14,
  },
  {
    slug: 'osaka-bar-stool',
    name: 'Osaka Bar Stool',
    sku: 'LC-ST-302',
    category: 'stools',
    price: 13499,
    short: 'A moulded shell seat on slim wooden legs with a steel footrest.',
    description: '<p>Light, wipe-clean and easy to tuck under a counter.</p>',
    images: [
      ['stool-black-bar', 'Osaka bar stool in black'],
      ['stools-kitchen', 'Bar stools at a kitchen island'],
    ],
    specs: [
      { label: 'Dimensions', value: 'W 46 × D 46 × H 98 cm' },
      { label: 'Seat height', value: '75 cm' },
    ],
    materials: ['Powder-Coated Steel'],
    tags: ['stool', 'bar stool', 'kitchen'],
    clicks: 8,
  },
  {
    slug: 'round-sheesham-coffee-table',
    name: 'Round Sheesham Coffee Table',
    sku: 'LC-CT-401',
    category: 'coffee-tables',
    price: 45499,
    short: 'A solid sheesham drum table with a hand-rubbed oil finish.',
    description:
      '<p>Turned from solid Pakistani sheesham and finished by hand, every table shows its own grain. The low, round form softens a room full of straight lines.</p>',
    images: [
      ['living-round-tables', 'Round sheesham coffee tables in a living room'],
      ['living-raw-wood-table', 'Sheesham coffee table detail'],
    ],
    specs: [
      { label: 'Material', value: 'Solid sheesham' },
      { label: 'Finish', value: 'Hand-rubbed oil' },
      { label: 'Assembly', value: 'None required' },
    ],
    materials: ['Sheesham Wood'],
    collections: ['sheesham-signature', 'living-room-edit'],
    tags: ['coffee table', 'centre table', 'sheesham', 'round'],
    flags: ['best'],
    clicks: 133,
  },
  {
    slug: 'raw-edge-mango-coffee-table',
    name: 'Raw-Edge Mango Coffee Table',
    sku: 'LC-CT-402',
    category: 'coffee-tables',
    price: 52000,
    short: 'A chunky block coffee table in reclaimed mango wood, with every crack and knot kept.',
    description: '<p>Made from reclaimed mango wood, sanded smooth and sealed, so its character stays while the surface stays practical.</p>',
    images: [['living-raw-wood-table', 'Raw-edge mango wood coffee table']],
    specs: [
      { label: 'Dimensions', value: 'W 110 × D 60 × H 38 cm' },
      { label: 'Material', value: 'Reclaimed mango wood' },
    ],
    materials: ['Mango Wood'],
    collections: ['living-room-edit'],
    tags: ['coffee table', 'live edge', 'mango'],
    flags: ['new'],
    clicks: 22,
    created: '2026-09-30T09:00:00.000Z',
  },
  {
    slug: 'six-seater-sheesham-dining-table',
    name: 'Six-Seater Sheesham Dining Table',
    sku: 'LC-DT-501',
    category: 'dining-tables',
    price: 165000,
    short: 'A solid sheesham dining table for six, with a 3.5 cm top and splayed legs.',
    description:
      '<p>Designed for daily family meals and long weekend lunches. The thick solid top is finished with a heat- and water-resistant lacquer, and the legs are joined with hidden steel brackets for decades of stability.</p>',
    images: [
      ['dining-sheesham-six', 'Six-seater sheesham dining table'],
      ['dining-room-bright', 'Dining table in a bright dining room'],
    ],
    specs: [
      { label: 'Top thickness', value: '3.5 cm solid wood' },
      { label: 'Material', value: 'Solid sheesham' },
      { label: 'Finish', value: 'Heat-resistant matte lacquer' },
      { label: 'Seating', value: '6 people' },
    ],
    materials: ['Sheesham Wood'],
    collections: ['sheesham-signature'],
    tags: ['dining table', 'dining set', 'sheesham', 'six seater'],
    flags: ['best'],
    clicks: 88,
  },
  {
    slug: 'nordic-round-dining-set',
    name: 'Nordic Round Dining Set',
    sku: 'LC-DT-502',
    category: 'dining-tables',
    price: 89999,
    short: 'A round pedestal table with four moulded chairs: compact, bright and easy to clean.',
    description: '<p>A complete set for small dining spaces and breakfast nooks.</p>',
    images: [['dining-round-white', 'Nordic round dining set in white']],
    specs: [
      { label: 'Table', value: 'Ø 100 × H 75 cm' },
      { label: 'Includes', value: 'Table and 4 chairs' },
    ],
    materials: ['Engineered Wood', 'Oak Veneer'],
    tags: ['dining table', 'dining set', 'round', 'four seater'],
    clicks: 17,
  },
  {
    slug: 'cove-side-table',
    name: 'Cove Side Table',
    sku: 'LC-SD-601',
    category: 'side-tables',
    price: 21999,
    short: 'A cantilevered side table with an open shelf for books and magazines.',
    description: '<p>Slides partly under a sofa or bed, so your tea and your book are always in reach.</p>',
    images: [['side-table-cove', 'Cove side table in solid wood']],
    specs: [
      { label: 'Dimensions', value: 'W 45 × D 35 × H 55 cm' },
      { label: 'Material', value: 'Solid sheesham' },
    ],
    materials: ['Sheesham Wood'],
    collections: ['sheesham-signature'],
    tags: ['side table', 'bedside table', 'sheesham'],
    flags: ['best'],
    clicks: 76,
  },
  {
    slug: 'slim-sheesham-console-table',
    name: 'Slim Sheesham Console Table',
    sku: 'LC-CN-701',
    category: 'console-tables',
    price: 38500,
    short: 'A narrow console with two drawers, sized for entryways and behind-sofa styling.',
    description: '<p>At just 35 cm deep, it fits where most consoles cannot, with two dovetailed drawers for keys and post.</p>',
    images: [
      ['console-sheesham', 'Slim sheesham console table with drawers'],
      ['console-white-mirror', 'Console table styled under a round mirror'],
    ],
    specs: [
      { label: 'Dimensions', value: 'W 120 × D 35 × H 78 cm' },
      { label: 'Drawers', value: '2, dovetail joints' },
    ],
    materials: ['Sheesham Wood'],
    collections: ['sheesham-signature'],
    tags: ['console table', 'entryway', 'hallway', 'sheesham'],
    clicks: 28,
  },
  {
    slug: 'hazel-platform-bed',
    name: 'Hazel Platform Bed',
    sku: 'LC-BD-801',
    category: 'beds',
    price: 145000,
    short: 'A low platform bed in warm oak tones, with a floating base and generous edges.',
    description:
      '<p>Hazel sits low to the ground for a calm, grounded bedroom. The slatted base supports any mattress without a box spring.</p>',
    images: [
      ['bed-platform-oak', 'Hazel platform bed in oak'],
      ['bedroom-calm', 'Hazel bed in a calm bedroom'],
    ],
    specs: [
      { label: 'Height', value: '32 cm base, 90 cm headboard' },
      { label: 'Base', value: 'Solid slats, no box spring needed' },
      { label: 'Material', value: 'Oak veneer on engineered wood' },
    ],
    materials: ['Oak Veneer', 'Engineered Wood'],
    collections: ['bedroom-retreat'],
    tags: ['bed', 'platform bed', 'king', 'queen'],
    flags: ['featured'],
    clicks: 57,
  },
  {
    slug: 'regal-tufted-bed',
    name: 'Regal Tufted Bed',
    sku: 'LC-BD-802',
    category: 'beds',
    price: 168000,
    sale: 149999,
    short: 'A statement upholstered bed with a tall, button-tufted headboard.',
    description: '<p>A hotel-like centrepiece: deep tufting, a padded headboard for reading in bed, and a sturdy solid-wood frame.</p>',
    images: [
      ['bed-tufted-regal', 'Regal tufted bed with tall headboard'],
      ['bed-ivory-classic', 'Regal bed in an ivory bedroom'],
    ],
    specs: [
      { label: 'Headboard height', value: '135 cm' },
      { label: 'Upholstery', value: 'Velvet' },
      { label: 'Frame', value: 'Solid sheesham' },
    ],
    materials: ['Velvet', 'Sheesham Wood'],
    collections: ['bedroom-retreat'],
    tags: ['bed', 'upholstered bed', 'tufted', 'king'],
    flags: ['best'],
    clicks: 64,
  },
  {
    slug: 'sheesham-storage-bed',
    name: 'Sheesham Storage Bed',
    sku: 'LC-BD-803',
    category: 'beds',
    price: 175000,
    short: 'A solid sheesham bed with hydraulic lift-up storage under the mattress.',
    description: '<p>A gas-lift base opens with one hand to reveal deep storage for bedding and seasonal clothes.</p>',
    images: [
      ['bedroom-calm', 'Sheesham storage bed'],
      ['bedroom-bench', 'Bedroom with storage bed and bench'],
    ],
    specs: [
      { label: 'Storage', value: 'Hydraulic lift-up base' },
      { label: 'Material', value: 'Solid sheesham' },
    ],
    materials: ['Sheesham Wood'],
    collections: ['sheesham-signature', 'bedroom-retreat'],
    tags: ['bed', 'storage bed', 'sheesham', 'king'],
    stock: 'made_to_order',
    lead: 'Made to order: 3 to 4 weeks',
    clicks: 21,
  },
  {
    slug: 'floating-oak-tv-console',
    name: 'Floating Oak TV Console',
    sku: 'LC-TV-901',
    category: 'tv-consoles',
    price: 64999,
    short: 'A wall-mounted media unit with push-to-open doors and hidden cable routing.',
    description: '<p>Mounts at any height and keeps the floor clear. Cable ports at the back keep everything out of sight.</p>',
    images: [['tv-unit-floating', 'Floating oak TV console with open shelving']],
    specs: [
      { label: 'Dimensions', value: 'W 180 × D 38 × H 40 cm' },
      { label: 'Mounting', value: 'Wall-mounted, fittings included' },
    ],
    materials: ['Oak Veneer', 'Engineered Wood'],
    tags: ['tv console', 'tv unit', 'media unit', 'wall mounted'],
    clicks: 33,
  },
  {
    slug: 'rattan-sideboard-tv-console',
    name: 'Rattan Sideboard TV Console',
    sku: 'LC-TV-902',
    category: 'tv-consoles',
    price: 72000,
    short: 'A low sideboard with woven cane doors and solid wood legs.',
    description: '<p>Hand-woven rattan cane doors let air through and soften the look of a media wall.</p>',
    images: [['sideboard-rattan', 'Rattan sideboard used as a TV console']],
    specs: [
      { label: 'Dimensions', value: 'W 160 × D 42 × H 62 cm' },
      { label: 'Doors', value: 'Hand-woven rattan cane' },
    ],
    materials: ['Rattan Cane', 'Mango Wood'],
    tags: ['tv console', 'sideboard', 'rattan', 'cane'],
    flags: ['new'],
    clicks: 18,
    created: '2026-10-06T09:00:00.000Z',
  },
  {
    slug: 'tall-open-shelf-cabinet',
    name: 'Tall Open-Shelf Cabinet',
    sku: 'LC-CB-1001',
    category: 'cabinets-storage',
    price: 48000,
    short: 'A slim, tall cabinet of open cubbies for books, baskets and display.',
    description: '<p>Twelve cubbies in a narrow footprint. Anchors to the wall for safety.</p>',
    images: [['cabinet-tall-open', 'Tall open-shelf cabinet in light wood']],
    specs: [
      { label: 'Dimensions', value: 'W 60 × D 30 × H 200 cm' },
      { label: 'Material', value: 'Engineered wood, oak finish' },
    ],
    materials: ['Engineered Wood', 'Oak Veneer'],
    tags: ['cabinet', 'shelf', 'bookcase', 'storage'],
    clicks: 11,
  },
  {
    slug: 'five-drawer-dresser',
    name: 'Five-Drawer Dresser',
    sku: 'LC-CB-1002',
    category: 'cabinets-storage',
    price: 56500,
    short: 'A classic chest of five drawers on soft-close runners.',
    description: '<p>Generous drawers on soft-close runners, with brushed brass handles.</p>',
    images: [['dresser-white-room', 'Five-drawer dresser in a bedroom']],
    specs: [
      { label: 'Dimensions', value: 'W 90 × D 45 × H 120 cm' },
      { label: 'Runners', value: 'Soft-close' },
    ],
    materials: ['Engineered Wood'],
    tags: ['dresser', 'chest of drawers', 'almirah', 'storage', 'bedroom'],
    stock: 'out_of_stock',
    clicks: 6,
  },
  {
    slug: 'tufted-bed-end-bench',
    name: 'Tufted Bed-End Bench',
    sku: 'LC-BN-1101',
    category: 'benches',
    price: 34999,
    short: 'A padded, button-tufted bench for the foot of the bed or a quiet hallway.',
    description: '<p>Somewhere to sit while you put your shoes on, and somewhere to keep the extra throw.</p>',
    images: [
      ['bedroom-bench', 'Tufted bench at the foot of a bed'],
      ['bed-ivory-classic', 'Bench styled in an ivory bedroom'],
    ],
    specs: [
      { label: 'Dimensions', value: 'W 130 × D 42 × H 46 cm' },
      { label: 'Upholstery', value: 'Linen blend' },
    ],
    materials: ['Linen Blend', 'Sheesham Wood'],
    collections: ['bedroom-retreat'],
    tags: ['bench', 'bed end bench', 'ottoman', 'bedroom'],
    clicks: 15,
  },
  {
    slug: 'cognac-ottoman-pair',
    name: 'Cognac Ottoman Pair',
    sku: 'LC-BN-1102',
    category: 'benches',
    price: 29999,
    short: 'Two leatherette ottomans on slim steel legs, perfect at the end of a bed.',
    description: '<p>Use them together as a bench, or apart as extra seats when guests arrive.</p>',
    images: [['bedroom-ottomans', 'Pair of cognac ottomans at the foot of a bed']],
    specs: [
      { label: 'Each', value: 'W 60 × D 45 × H 45 cm' },
      { label: 'Upholstery', value: 'Leatherette' },
    ],
    materials: ['Leatherette', 'Powder-Coated Steel'],
    tags: ['ottoman', 'bench', 'bedroom'],
    clicks: 10,
  },
  {
    slug: 'oak-wall-desk',
    name: 'Oak Wall Desk',
    sku: 'LC-CN-702',
    category: 'console-tables',
    price: 27999,
    short: 'A wall-hung desk and shelf pair that turns a corner into a quiet workspace.',
    description: '<p>Mounts to the wall with concealed brackets, leaving the floor clear in small rooms.</p>',
    images: [['desk-wall-oak', 'Wall-mounted oak desk with a chair']],
    specs: [
      { label: 'Desk', value: 'W 100 × D 45 cm' },
      { label: 'Mounting', value: 'Concealed brackets' },
    ],
    materials: ['Oak Veneer'],
    tags: ['desk', 'wall desk', 'study', 'console'],
    clicks: 7,
  },
]

// Options are added separately so they reference the product slug.
const optionsBySlug: Record<string, OptionGroup[]> = {
  'alder-three-seater-leather-sofa': [
    group('alder-three-seater-leather-sofa', 'Size', 'buttons', [
      ['3-Seater', 0],
      ['3 + 2 Set', 95000],
      ['L-Shape', 70000],
    ]),
    group('alder-three-seater-leather-sofa', 'Leather', 'swatches', [
      ['Tan', 0, '#a8693f'],
      ['Cognac', 0, '#7b3f22'],
      ['Espresso', 4000, '#3d2a20'],
    ]),
  ],
  'maren-velvet-sofa': [
    group('maren-velvet-sofa', 'Size', 'buttons', [
      ['2-Seater', 0],
      ['3-Seater', 25000],
    ]),
    group('maren-velvet-sofa', 'Fabric', 'swatches', [
      ['Emerald Velvet', 0, '#1f5a4a'],
      ['Champagne Velvet', 0, '#d8c3a0'],
      ['Walnut Velvet', 0, '#5a3a28'],
    ]),
  ],
  'round-sheesham-coffee-table': [
    group('round-sheesham-coffee-table', 'Size', 'buttons', [
      ['30" Round', 0],
      ['36" Round', 6000],
    ]),
    group('round-sheesham-coffee-table', 'Finish', 'swatches', [
      ['Natural', 0, '#b07a4a'],
      ['Dark Walnut', 0, '#4a3022'],
    ]),
  ],
  'six-seater-sheesham-dining-table': [
    group('six-seater-sheesham-dining-table', 'Set', 'buttons', [
      ['Table only', 0],
      ['With 6 chairs', 85000],
    ]),
    group('six-seater-sheesham-dining-table', 'Finish', 'swatches', [
      ['Natural', 0, '#b07a4a'],
      ['Dark Walnut', 0, '#4a3022'],
    ]),
  ],
  'hazel-platform-bed': [
    group('hazel-platform-bed', 'Size', 'buttons', [
      ['Queen (60" × 78")', 0],
      ['King (72" × 78")', 20000],
    ]),
  ],
  'regal-tufted-bed': [
    group('regal-tufted-bed', 'Size', 'buttons', [
      ['Queen', 0],
      ['King', 18000],
    ]),
    group('regal-tufted-bed', 'Velvet', 'swatches', [
      ['Ivory', 0, '#ece4d6'],
      ['Mink', 0, '#8b7765'],
      ['Midnight', 0, '#2b2f3a'],
    ]),
  ],
  'sheesham-storage-bed': [
    group('sheesham-storage-bed', 'Size', 'buttons', [
      ['Queen', 0],
      ['King', 22000],
    ]),
  ],
  'rowan-dining-chair': [
    group('rowan-dining-chair', 'Quantity set', 'buttons', [
      ['Single chair', 0],
      ['Set of 2', 17500],
      ['Set of 4', 52000],
    ]),
  ],
  'oak-counter-stool': [
    group('oak-counter-stool', 'Height', 'buttons', [
      ['Counter (65 cm)', 0],
      ['Bar (75 cm)', 1500],
    ]),
  ],
  'amber-wingback-armchair': [
    group('amber-wingback-armchair', 'Fabric', 'swatches', [
      ['Mustard', 0, '#c79a3a'],
      ['Sage', 0, '#8c9a7c'],
      ['Oat', 0, '#d9cbb3'],
    ]),
  ],
}

const catIdBySlug = Object.fromEntries(demoCategories.map((c) => [c.slug, c.id]))

export const demoProducts: ProductRow[] = seeds.map((s, i) => {
  const id = prodId(s.slug)
  const images: ProductImage[] = s.images.map(([name, alt]) => ({ ...img(name, alt), option_value_id: null }))
  const flags = new Set(s.flags ?? [])
  const created = s.created ?? `2026-0${(i % 8) + 1}-1${i % 9}T09:00:00.000Z`
  return {
    id,
    name: s.name,
    slug: s.slug,
    sku: s.sku,
    category_id: catIdBySlug[s.category] ?? null,
    short_description: s.short,
    description_html: s.description,
    price: s.price,
    sale_price: s.sale ?? null,
    price_on_request: false,
    stock_status: s.stock ?? 'in_stock',
    lead_time: s.lead ?? (s.stock === 'out_of_stock' ? null : 'Delivered in 5 to 7 working days'),
    images,
    options: optionsBySlug[s.slug] ?? s.options ?? [],
    specifications: s.specs,
    care_html: null,
    delivery_html: null,
    material_ids: s.materials.map(matId),
    collection_ids: (s.collections ?? []).map(colId),
    related_ids: [],
    tags: s.tags,
    is_best_seller: flags.has('best'),
    is_new_arrival: flags.has('new'),
    is_featured: flags.has('featured'),
    is_visible: true,
    sort_order: i,
    order_clicks: s.clicks ?? 0,
    seo_title: null,
    seo_description: null,
    published_at: created,
    created_at: created,
    updated_at: created,
  }
})

// ---------------------------------------------------------------- offers
export const demoOffers: OfferRow[] = [
  {
    id: stableId('offer:white-friday-sofas'),
    name: 'White Friday Sofa Sale',
    badge: 'White Friday',
    discount_type: 'percent',
    discount_value: 15,
    scope: 'categories',
    category_ids: [catId('sofas')],
    collection_ids: [],
    product_ids: [],
    starts_at: '2026-10-01T00:00:00.000Z',
    ends_at: '2027-01-31T18:59:00.000Z',
    is_active: true,
    priority: 10,
  },
  {
    id: stableId('offer:dining-week'),
    name: 'Dining Week',
    badge: 'Dining Week',
    discount_type: 'fixed',
    discount_value: 10000,
    scope: 'categories',
    category_ids: [catId('dining-tables')],
    collection_ids: [],
    product_ids: [],
    starts_at: '2027-02-01T00:00:00.000Z',
    ends_at: '2027-02-08T18:59:00.000Z',
    is_active: true,
    priority: 5,
  },
]

// ---------------------------------------------------------------- announcements
export const demoAnnouncements: AnnouncementRow[] = [
  {
    id: stableId('announcement:delivery'),
    message: 'Free delivery across Pakistan  ·  Cash on delivery',
    link_url: '/faqs',
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 0,
  },
  {
    id: stableId('announcement:white-friday'),
    message: 'White Friday: 15% off every sofa',
    link_url: '/sale',
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 1,
  },
  {
    id: stableId('announcement:custom'),
    message: 'Made to measure: your size, fabric and finish',
    link_url: '/customize',
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 2,
  },
]

// ---------------------------------------------------------------- hero
export const demoHeroSlides: HeroSlideRow[] = [
  {
    id: stableId('hero:autumn'),
    eyebrow: 'The Autumn Collection',
    heading: 'Crafted for the\nway you live',
    subheading: 'Solid sheesham, soft linens and quiet details. Made in Pakistan, delivered to your door.',
    button_label: 'Explore the collection',
    button_url: '/shop',
    desktop_image: img('hero-living-warm', 'A warm, sunlit living room with a linen sofa and wooden coffee table'),
    mobile_image: img('room-warm-orange-chair', 'A warm living room corner with an armchair and plants'),
    text_align: 'left',
    text_tone: 'light',
    overlay: 38,
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 0,
  },
  {
    id: stableId('hero:white-friday'),
    eyebrow: 'White Friday',
    heading: 'Fifteen percent off\nevery sofa',
    subheading: 'Our most-loved sofas at their best price, for a limited time.',
    button_label: 'Shop the sale',
    button_url: '/sale',
    desktop_image: img('living-terracotta', 'A terracotta sofa in a bright living room'),
    mobile_image: img('sofa-terracotta', 'Terracotta sofa'),
    text_align: 'left',
    text_tone: 'light',
    overlay: 40,
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 1,
  },
  {
    id: stableId('hero:custom'),
    eyebrow: 'Made to measure',
    heading: 'Your size, your fabric,\nyour finish',
    subheading: 'Tell us what you have in mind. Our workshop will build it for your space.',
    button_label: 'Start a custom order',
    button_url: '/customize',
    desktop_image: img('hero-living-pendants', 'A styled living room with rattan pendant lamps'),
    mobile_image: img('sideboard-rattan', 'A rattan sideboard in a calm room'),
    text_align: 'left',
    text_tone: 'light',
    overlay: 42,
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 2,
  },
]

// ---------------------------------------------------------------- promo banners
export const demoPromos: PromoBannerRow[] = [
  {
    id: stableId('promo:white-friday'),
    placement: 'home',
    layout: 'split',
    eyebrow: 'White Friday',
    heading: '15% off every sofa, for a few weeks only',
    body: 'From leather three-seaters to velvet loveseats, our sofa collection is at its best price this season. Delivered free, paid for on delivery.',
    button_label: 'Shop sofas on sale',
    button_url: '/sale',
    desktop_image: img('sofa-cognac-room', 'A cognac leather sofa in a bright living room'),
    mobile_image: null,
    offer_id: stableId('offer:white-friday-sofas'),
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 0,
  },
  {
    id: stableId('promo:sale-page'),
    placement: 'sale',
    layout: 'full',
    eyebrow: 'This season',
    heading: 'Considered pieces, kinder prices',
    body: 'Offers apply automatically. Prices shown already include the discount.',
    button_label: null,
    button_url: null,
    desktop_image: img('living-loft', 'An open-plan living room'),
    mobile_image: null,
    offer_id: null,
    is_active: true,
    starts_at: null,
    ends_at: null,
    sort_order: 0,
  },
]

// ---------------------------------------------------------------- home sections
const sec = (key: string) => stableId(`section:${key}`)
export const demoHomeSections: HomeSectionRow[] = [
  { id: sec('hero'), type: 'hero', eyebrow: null, title: null, subtitle: null, is_visible: true, sort_order: 0, settings: {} },
  {
    id: sec('categories'),
    type: 'categories',
    eyebrow: 'Collections',
    title: 'Shop by category',
    subtitle: null,
    is_visible: true,
    sort_order: 1,
    settings: {
      category_ids: ['sofas', 'chairs', 'coffee-tables', 'dining-tables', 'beds', 'tv-consoles'].map(catId),
      link_label: 'View all',
      link_url: '/shop',
    },
  },
  {
    id: sec('best-sellers'),
    type: 'products',
    eyebrow: 'Most loved',
    title: 'Best sellers',
    subtitle: null,
    is_visible: true,
    sort_order: 2,
    settings: { source: 'best_sellers', limit: 8, layout: 'carousel', link_label: 'View all best sellers', link_url: '/best-sellers' },
  },
  { id: sec('promo'), type: 'promo', eyebrow: null, title: null, subtitle: null, is_visible: true, sort_order: 3, settings: {} },
  {
    id: sec('new-arrivals'),
    type: 'products',
    eyebrow: 'Just in',
    title: 'New arrivals',
    subtitle: null,
    is_visible: true,
    sort_order: 4,
    settings: { source: 'new_arrivals', limit: 8, layout: 'grid', link_label: 'View all new arrivals', link_url: '/new-arrivals' },
  },
  {
    id: sec('collection'),
    type: 'collection',
    eyebrow: 'Featured collection',
    title: null,
    subtitle: null,
    is_visible: true,
    sort_order: 5,
    settings: { collection_id: colId('living-room-edit'), limit: 4, layout: 'editorial' },
  },
  {
    id: sec('usps'),
    type: 'usps',
    eyebrow: 'Why Looma Comfort',
    title: 'Furniture you can buy with confidence',
    subtitle: null,
    is_visible: true,
    sort_order: 6,
    settings: {
      items: [
        { icon: 'cash', title: 'Cash on delivery', text: 'Pay in cash when your furniture arrives. No advance for in-stock pieces.' },
        { icon: 'inspect', title: 'Inspect before you pay', text: 'Check every detail at your door, then pay once you are happy.' },
        { icon: 'truck', title: 'Free delivery nationwide', text: 'Delivered and placed in your room across all major cities.' },
        { icon: 'craft', title: 'Handcrafted quality', text: 'Solid woods and careful joinery from our own workshop.' },
      ],
    },
  },
  {
    id: sec('testimonials'),
    type: 'testimonials',
    eyebrow: 'Kind words',
    title: 'From homes across Pakistan',
    subtitle: null,
    is_visible: true,
    sort_order: 7,
    settings: { limit: 8 },
  },
  {
    id: sec('story'),
    type: 'story',
    eyebrow: 'Our story',
    title: 'Made slowly, for homes that are lived in',
    subtitle: null,
    is_visible: true,
    sort_order: 8,
    settings: {
      image: img('desk-wall-oak', 'A quiet corner with a wooden desk and chair'),
      body: 'Looma Comfort began with a simple belief: good furniture should feel as good in ten years as it does on the day it arrives. We work with skilled craftsmen and honest materials, sheesham, mango and oak, and we finish every piece by hand.\n\nWe design for real family life in Pakistan: long dinners, guests who stay late, children who climb on everything. Our pieces are built to handle all of it, quietly and beautifully.',
      button_label: 'Shop now',
      button_url: '/shop',
      stats: [
        { value: 5000, suffix: '+', label: 'Happy homes' },
        { value: 40, suffix: '+', label: 'Cities delivered' },
        { value: 100, suffix: '%', label: 'Inspected before payment' },
      ],
    },
  },
]

// ---------------------------------------------------------------- reviews
const pid = (slug: string) => prodId(slug)
export const demoReviews: ReviewRow[] = [
  ['Ayesha K.', 'Lahore', 'alder-three-seater-leather-sofa', 'The leather is beautiful and the sofa is even more comfortable than it looked. Delivery team placed it carefully and waited while I checked every seam.'],
  ['Hamza R.', 'Karachi', 'six-seater-sheesham-dining-table', 'Solid, heavy and perfectly finished. We ordered the six-chair set on WhatsApp and it arrived in exactly the time they promised.'],
  ['Sana M.', 'Islamabad', 'regal-tufted-bed', 'Our bedroom finally feels finished. The tufting is neat and the headboard is lovely to lean on while reading.'],
  ['Usman T.', 'Faisalabad', 'round-sheesham-coffee-table', 'You can tell this is real sheesham. The grain is gorgeous and the finish is smooth. Paid cash on delivery after checking it.'],
  ['Mehwish A.', 'Rawalpindi', 'amber-wingback-armchair', 'Ordered in sage instead of mustard and they sent fabric photos on WhatsApp before making it. Very personal service.'],
  ['Bilal S.', 'Multan', 'cove-side-table', 'Small but beautifully made. Bought two for either side of the bed and they look much more expensive than they were.'],
].map(([name, city, slug, body], i) => ({
  id: stableId(`review:${name}`),
  product_id: pid(slug!),
  customer_name: name!,
  city: city!,
  rating: 5,
  title: null,
  body: body!,
  source: i % 2 ? 'whatsapp' : 'website',
  status: 'approved' as const,
  is_featured: true,
  review_date: `2026-0${9 - (i % 3)}-1${i}`,
  created_at: `2026-0${9 - (i % 3)}-1${i}T10:00:00.000Z`,
}))
demoReviews.push({
  id: stableId('review:pending-demo'),
  product_id: pid('maren-velvet-sofa'),
  customer_name: 'Fatima Z.',
  city: 'Peshawar',
  rating: 4,
  title: null,
  body: 'Lovely colour and very soft. I would have liked one more cushion included.',
  source: 'website',
  status: 'pending',
  is_featured: false,
  review_date: '2026-10-10',
  created_at: '2026-10-10T10:00:00.000Z',
})

// ---------------------------------------------------------------- pages
const page = (slug: string, title: string, intro: string, body: string, extra: Partial<PageRow> = {}): PageRow => ({
  id: stableId(`page:${slug}`),
  slug,
  title,
  intro,
  body_html: body,
  blocks: {},
  hero_image: null,
  seo_title: null,
  seo_description: null,
  updated_at: T,
  ...extra,
})

export const demoPages: PageRow[] = [
  page(
    'about',
    'Furniture for a better home',
    'We make honest, beautiful furniture for the way families in Pakistan really live.',
    '<p>Looma Comfort started in a small workshop with a simple idea: furniture should be built to be used, every day, for years. Not to be replaced the moment it shows a scratch.</p><p>Today we work with skilled carpenters, carvers and upholsterers across Punjab. Our frames are kiln-dried so they do not warp in our summers. Our joints are cut, glued and pinned, not just stapled. And every piece is checked twice before it leaves us, then once more by you at your door.</p>',
    {
      hero_image: img('hero-living-pendants', 'A styled living room with rattan pendant lamps'),
      blocks: {
        sections: [
          {
            heading: 'Honest materials',
            body: 'Solid sheesham from Punjab, reclaimed mango wood and carefully chosen fabrics. We tell you exactly what each piece is made of, down to the foam density.',
            image: img('console-sheesham', 'Solid sheesham console with dovetailed drawers'),
          },
          {
            heading: 'Made by hand, finished with care',
            body: 'Each piece is sanded, stained and finished by hand. It takes longer, and it is the reason our furniture looks better with age.',
            image: img('armchair-carved', 'A hand-carved sheesham armchair'),
          },
        ],
        values: [
          { title: 'Built to last', text: 'Kiln-dried frames, real joinery and hardware chosen for decades, not seasons.' },
          { title: 'Fair and transparent', text: 'Clear prices, no hidden charges, and cash on delivery for in-stock pieces.' },
          { title: 'Personal service', text: 'Talk to a real person on WhatsApp before, during and after your order.' },
          { title: 'Made for your space', text: 'Most pieces can be adjusted in size, fabric or finish to fit your home.' },
        ],
        steps: [
          { title: 'Selecting the wood', text: 'We choose seasoned sheesham and mango wood, then kiln-dry it to prevent warping.' },
          { title: 'Joinery and frame', text: 'Frames are cut, glued and pinned with mortise-and-tenon and dovetail joints.' },
          { title: 'Hand finishing', text: 'Every surface is sanded, stained and sealed by hand in our workshop.' },
          { title: 'Quality check', text: 'Each piece is inspected twice before it is wrapped and sent to you.' },
        ],
        gallery: [
          img('living-round-tables', 'Round sheesham tables in a living room'),
          img('bedroom-calm', 'A calm bedroom'),
          img('dining-room-bright', 'A bright dining room'),
        ],
        stats: [
          { value: 5000, suffix: '+', label: 'Happy homes' },
          { value: 40, suffix: '+', label: 'Cities delivered' },
          { value: 12, suffix: '', label: 'Master craftsmen' },
        ],
      },
    },
  ),
  page(
    'customize',
    'Made to your measurements',
    'Have a space that standard sizes do not fit, or a fabric you have fallen for? Our workshop builds furniture to order, to your size, in your finish.',
    '<p>Almost every piece in our collection can be adjusted, and we regularly build entirely new designs from a photo or a sketch. Send us what you have in mind on WhatsApp and we will reply with ideas, a price and a delivery time.</p>',
    {
      hero_image: img('desk-wall-oak', 'A custom wall desk in oak'),
      blocks: {
        options: [
          { title: 'Size', text: 'Change the width, depth or height to fit an exact wall, alcove or room.', image: img('sofa-ivory-cloud', 'A cream sofa') },
          { title: 'Fabric & colour', text: 'Choose from velvets, linens, boucle and leathers in dozens of shades.', image: img('chair-ivory-tufted', 'A tufted accent chair') },
          { title: 'Wood & finish', text: 'Sheesham, mango or oak, in natural, walnut or a custom stain.', image: img('side-table-cove', 'A solid wood side table') },
          { title: 'Design changes', text: 'Add storage, change the legs or arms, or bring us a design of your own.', image: img('armchair-carved', 'A carved armchair') },
        ],
        steps: [
          { title: 'Share your idea', text: 'Send a photo, sketch or measurements on WhatsApp.' },
          { title: 'Consultation & quote', text: 'We suggest materials and share a clear price and timeline.' },
          { title: 'Approval', text: 'Confirm the design and fabric. A small advance secures your order.' },
          { title: 'Crafting', text: 'Our workshop builds your piece, with photo updates along the way.' },
          { title: 'Delivery & inspection', text: 'We deliver and place it. Inspect everything, then pay the balance.' },
        ],
        gallery: [
          img('console-white-mirror', 'A console table styled under a mirror'),
          img('dining-sheesham-six', 'A sheesham dining table'),
          img('bedroom-ottomans', 'Custom ottomans at the end of a bed'),
        ],
      },
    },
  ),
  page(
    'shipping',
    'Shipping & Delivery',
    'How and when your furniture reaches you.',
    `<h2>Delivery areas</h2><p>We deliver to all major cities in Pakistan, including Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Sialkot, Gujranwala and Hyderabad. For other cities, message us on WhatsApp and we will confirm availability.</p>
<h2>Delivery charges</h2><p>Delivery is free to all major cities. For remote areas a small charge may apply, which we will always confirm before you order.</p>
<h2>Delivery times</h2><ul><li><strong>In-stock pieces:</strong> 5 to 7 working days.</li><li><strong>Made-to-order and custom pieces:</strong> 3 to 4 weeks, confirmed at the time of order.</li></ul>
<h2>On the day</h2><p>Our team will call you before arriving. We carry your furniture into the room of your choice, attach legs where needed and remove the packaging.</p>
<h2>Inspect before you pay</h2><p>Please check your order carefully at delivery. If anything is not right, tell our team before paying and we will make it right.</p>`,
  ),
  page(
    'refund-and-returns',
    'Refund & Return Policy',
    'Our promise if something is not right.',
    `<h2>Inspection at delivery</h2><p>Because you can inspect your furniture before paying, most issues are resolved on the spot. If a piece is damaged or does not match your order, you may refuse delivery at no cost.</p>
<h2>After delivery</h2><p>If you notice a manufacturing defect within 7 days of delivery, contact us on WhatsApp with photos. We will repair or replace the piece free of charge.</p>
<h2>Change of mind</h2><p>In-stock pieces may be returned within 7 days in their original condition. A return delivery charge applies. Custom and made-to-order pieces cannot be returned for a change of mind.</p>
<h2>Refunds</h2><p>Approved refunds are made by bank transfer within 7 working days of collection.</p>
<h2>Warranty</h2><p>Sofa and bed frames carry a warranty against structural defects. The length of warranty is listed on each product page.</p>`,
  ),
  page(
    'privacy',
    'Privacy Policy',
    'How we handle your information.',
    `<h2>What we collect</h2><p>When you contact us or place an order on WhatsApp, we receive your name, phone number, delivery address and the details of your order. If you subscribe to our newsletter, we store your email address.</p>
<h2>How we use it</h2><p>We use your information only to respond to you, arrange delivery and, if you have agreed, send you occasional news about new arrivals and offers.</p>
<h2>Analytics</h2><p>Our website uses analytics tools to understand how visitors use it. These tools may use cookies. They do not tell us who you are.</p>
<h2>Sharing</h2><p>We never sell your information. We share delivery details only with our delivery partners, and only for your order.</p>
<h2>Your choices</h2><p>You can ask us to update or delete your information at any time by messaging us on WhatsApp or by email.</p>`,
  ),
  page(
    'terms',
    'Terms of Service',
    'The terms that apply when you use this website and order from us.',
    `<h2>Orders</h2><p>Orders are placed and confirmed on WhatsApp. An order is confirmed once we send you a confirmation message with the price and delivery time.</p>
<h2>Prices</h2><p>All prices are in Pakistani Rupees (PKR). We try to keep prices accurate; if a price on the website is shown in error, we will contact you before confirming your order.</p>
<h2>Product appearance</h2><p>Solid wood is a natural material and each piece has its own grain and tone. Colours may look slightly different on screen.</p>
<h2>Custom orders</h2><p>Custom pieces are made to your specification and may require an advance payment, which is confirmed in writing before work begins.</p>
<h2>Contact</h2><p>For any question about these terms, contact us on WhatsApp or by email.</p>`,
  ),
]

// ---------------------------------------------------------------- faqs
const faqSeeds: [string, string, string, boolean?][] = [
  ['Orders', 'How do I place an order?', '<p>Choose your piece and options on the website, then tap <strong>Order on WhatsApp</strong>. Your order details are filled in for you; just press send and our team will confirm availability, price and delivery time.</p>'],
  ['Orders', 'Can I order more than one item at once?', '<p>Yes. Add pieces to your wishlist with the heart icon, then open your wishlist and tap <strong>Send my list on WhatsApp</strong>.</p>'],
  ['Payment', 'Do you offer cash on delivery?', '<p>Yes. In-stock pieces are paid for in cash when they are delivered, after you have inspected them.</p>'],
  ['Payment', 'Do I need to pay an advance?', '<p>No advance is needed for in-stock pieces. Custom and made-to-order pieces need a small advance to begin production, confirmed before we start.</p>'],
  ['Delivery', 'How long does delivery take?', '<p>In-stock pieces arrive in 5 to 7 working days. Made-to-order pieces take 3 to 4 weeks.</p>'],
  ['Delivery', 'Is delivery free?', '<p>Delivery is free to all major cities in Pakistan. For remote areas we will confirm any charge before you order.</p>'],
  ['Delivery', 'Can I inspect my order before paying?', '<p>Absolutely. Check every detail at your door and pay only when you are happy.</p>'],
  ['Products & Care', 'Is your furniture made of solid wood?', '<p>Many of our pieces are solid sheesham or mango wood. Each product page lists exactly what the piece is made of.</p>'],
  ['Products & Care', 'How do I care for sheesham wood?', '<p>Dust with a soft dry cloth, wipe spills straight away and keep the piece out of direct sunlight. A little furniture wax twice a year keeps the finish rich.</p>'],
  ['Custom Orders', 'Can you make a piece in a custom size?', '<p>Yes. Most of our designs can be made in a different size, fabric or finish. Visit our <a href="/customize">custom furniture page</a> or send us your measurements on WhatsApp.</p>', true],
  ['Custom Orders', 'How long do custom orders take?', '<p>Usually 3 to 4 weeks, depending on the design. We confirm the timeline before you approve the order.</p>', true],
  ['Custom Orders', 'Can I see fabric samples?', '<p>Yes. We share photos and videos of fabrics on WhatsApp, and you are welcome to visit to see them in person.</p>', true],
  ['Returns', 'What if something arrives damaged?', '<p>Refuse the delivery or tell our team before paying, and we will replace or repair it at no cost to you.</p>'],
  ['Returns', 'Can I return a piece if I change my mind?', '<p>In-stock pieces can be returned within 7 days in original condition; a return delivery charge applies. Custom pieces cannot be returned for a change of mind.</p>'],
]
export const demoFaqs: FaqRow[] = faqSeeds.map(([group_name, question, answer_html, customize], i) => ({
  id: stableId(`faq:${question}`),
  question,
  answer_html,
  group_name,
  sort_order: i,
  is_visible: true,
  show_on_customize: Boolean(customize),
}))

export const demoRows: SiteRows = {
  settings: demoSettings,
  categories: demoCategories,
  materials: demoMaterials,
  collections: demoCollections,
  products: demoProducts,
  offers: demoOffers,
  announcements: demoAnnouncements,
  hero_slides: demoHeroSlides,
  promo_banners: demoPromos,
  home_sections: demoHomeSections,
  reviews: demoReviews,
  pages: demoPages,
  faqs: demoFaqs,
}
