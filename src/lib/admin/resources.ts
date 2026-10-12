import type { FieldDef, FieldGroup, ResourceDef } from './fields'

const seo: FieldGroup = {
  title: 'Search engines',
  description: 'Optional. Leave empty to use the name and description automatically.',
  fields: [
    { name: 'seo_title', label: 'SEO title', type: 'text', maxLength: 70, help: 'Around 50 to 60 characters.' },
    { name: 'seo_description', label: 'SEO description', type: 'textarea', maxLength: 170, rows: 3, help: 'Around 150 characters. Shown under the title in Google.' },
  ],
}

const schedule: FieldDef[] = [
  { name: 'starts_at', label: 'Starts', type: 'datetime', half: true, help: 'Pakistan time. Leave empty to start now.' },
  { name: 'ends_at', label: 'Ends', type: 'datetime', half: true, help: 'Leave empty to run until switched off.' },
]

export const RESOURCES: Record<string, ResourceDef> = {
  categories: {
    key: 'categories',
    table: 'categories',
    label: 'Categories',
    singular: 'Category',
    description: 'Groups (Seating, Tables…) and the categories inside them. Drag to set the menu order.',
    titleField: 'name',
    orderable: true,
    hasSlug: true,
    toggle: { field: 'is_visible', label: 'Visible' },
    defaultSort: { column: 'sort_order', ascending: true },
    canCreate: true,
    canDelete: true,
    viewUrl: '/shop/{slug}',
    defaults: { show_in_menu: true, is_visible: true },
    columns: [
      { field: 'image', label: '', kind: 'image' },
      { field: 'name', label: 'Name' },
      { field: 'parent_id', label: 'Group', kind: 'text' },
      { field: 'show_in_menu', label: 'In menu', kind: 'bool' },
    ],
    groups: [
      {
        title: 'Details',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120 },
          { name: 'slug', label: 'URL', type: 'slug', from: 'name', required: true, help: 'Used in the web address: /shop/your-url' },
          { name: 'parent_id', label: 'Belongs to group', type: 'relation', source: 'categories', help: 'Leave empty to make this a top-level group (e.g. Seating).' },
          { name: 'description', label: 'Description', type: 'textarea', rows: 3, help: 'Shown at the top of the category page.' },
        ],
      },
      {
        title: 'Images',
        fields: [
          { name: 'image', label: 'Card image', type: 'image', bucket: 'categories', help: 'Portrait (4:5) works best. At least 1200 px wide.' },
          { name: 'banner', label: 'Page banner (optional)', type: 'image', bucket: 'banners', help: 'Wide image across the top of the category page.' },
        ],
      },
      {
        title: 'Display',
        fields: [
          { name: 'show_in_menu', label: 'Show in the menu', type: 'switch' },
          { name: 'is_visible', label: 'Visible on the website', type: 'switch' },
        ],
      },
      seo,
    ],
  },

  collections: {
    key: 'collections',
    table: 'collections',
    label: 'Collections',
    singular: 'Collection',
    description: 'Curated groups like "The Living Room Edit". Add products to a collection from the product editor.',
    titleField: 'name',
    orderable: true,
    hasSlug: true,
    toggle: { field: 'is_visible', label: 'Visible' },
    defaultSort: { column: 'sort_order', ascending: true },
    canCreate: true,
    canDelete: true,
    viewUrl: '/collections/{slug}',
    defaults: { is_visible: true },
    columns: [
      { field: 'image', label: '', kind: 'image' },
      { field: 'name', label: 'Name' },
      { field: 'updated_at', label: 'Updated', kind: 'date' },
    ],
    groups: [
      {
        title: 'Details',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'slug', label: 'URL', type: 'slug', from: 'name', required: true },
          { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
          { name: 'image', label: 'Image', type: 'image', bucket: 'content', help: 'Portrait or square lifestyle photo.' },
          { name: 'is_visible', label: 'Visible on the website', type: 'switch' },
        ],
      },
      seo,
    ],
  },

  materials: {
    key: 'materials',
    table: 'materials',
    label: 'Materials',
    singular: 'Material',
    description: 'The list used for the Material filter (e.g. Sheesham Wood, Velvet).',
    titleField: 'name',
    orderable: true,
    defaultSort: { column: 'sort_order', ascending: true },
    canCreate: true,
    canDelete: true,
    columns: [{ field: 'name', label: 'Name' }],
    groups: [
      {
        title: 'Material',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true },
          { name: 'slug', label: 'URL key', type: 'slug', from: 'name', required: true },
        ],
      },
    ],
  },

  hero: {
    key: 'hero',
    table: 'hero_slides',
    label: 'Hero slides',
    singular: 'Hero slide',
    description: 'The large slides at the top of the home page. Drag to reorder.',
    titleField: 'heading',
    orderable: true,
    toggle: { field: 'is_active', label: 'On' },
    defaultSort: { column: 'sort_order', ascending: true },
    canCreate: true,
    canDelete: true,
    defaults: { is_active: true, text_align: 'left', text_tone: 'light', overlay: 35 },
    columns: [
      { field: 'desktop_image', label: '', kind: 'image' },
      { field: 'heading', label: 'Heading' },
      { field: 'starts_at', label: 'Schedule', kind: 'schedule' },
    ],
    groups: [
      {
        title: 'Text',
        fields: [
          { name: 'eyebrow', label: 'Small line above', type: 'text', placeholder: 'e.g. The Autumn Collection' },
          { name: 'heading', label: 'Heading', type: 'textarea', rows: 2, required: true, maxLength: 140, help: 'Press Enter to choose where lines break. Keep it short.' },
          { name: 'subheading', label: 'Subtext', type: 'textarea', rows: 2 },
          { name: 'button_label', label: 'Button text', type: 'text', half: true },
          { name: 'button_url', label: 'Button link', type: 'url', half: true, placeholder: '/shop or /products/…' },
        ],
      },
      {
        title: 'Images',
        fields: [
          { name: 'desktop_image', label: 'Desktop image', type: 'image', bucket: 'banners', required: true, help: 'Landscape, about 2400 × 1050. Keep the left side calm for the text.' },
          { name: 'mobile_image', label: 'Mobile image (optional)', type: 'image', bucket: 'banners', help: 'Portrait, about 1080 × 1350. Falls back to the desktop image.' },
        ],
      },
      {
        title: 'Style',
        fields: [
          {
            name: 'text_align',
            label: 'Text position',
            type: 'select',
            half: true,
            options: [
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Centre' },
              { value: 'right', label: 'Right' },
            ],
          },
          {
            name: 'text_tone',
            label: 'Text colour',
            type: 'select',
            half: true,
            options: [
              { value: 'light', label: 'Light text (dark photos)' },
              { value: 'dark', label: 'Dark text (light photos)' },
            ],
          },
          { name: 'overlay', label: 'Shade over image (0 to 80)', type: 'number', min: 0, max: 80, help: 'More shade makes text easier to read.' },
        ],
      },
      { title: 'Schedule', fields: [...schedule, { name: 'is_active', label: 'Slide is on', type: 'switch' }] },
    ],
  },

  promos: {
    key: 'promos',
    table: 'promo_banners',
    label: 'Promo banners',
    singular: 'Promo banner',
    description: 'Offer banners on the home page and the sale page.',
    titleField: 'heading',
    orderable: true,
    toggle: { field: 'is_active', label: 'On' },
    defaultSort: { column: 'sort_order', ascending: true },
    canCreate: true,
    canDelete: true,
    defaults: { is_active: true, placement: 'home', layout: 'split' },
    columns: [
      { field: 'desktop_image', label: '', kind: 'image' },
      { field: 'heading', label: 'Heading' },
      { field: 'placement', label: 'Where', kind: 'badge' },
      { field: 'starts_at', label: 'Schedule', kind: 'schedule' },
    ],
    groups: [
      {
        title: 'Banner',
        fields: [
          {
            name: 'placement',
            label: 'Show on',
            type: 'select',
            half: true,
            options: [
              { value: 'home', label: 'Home page' },
              { value: 'sale', label: 'Sale page header' },
            ],
          },
          {
            name: 'layout',
            label: 'Layout',
            type: 'select',
            half: true,
            options: [
              { value: 'split', label: 'Image + text panel' },
              { value: 'full', label: 'Full-width image' },
            ],
          },
          { name: 'eyebrow', label: 'Small line above', type: 'text' },
          { name: 'heading', label: 'Heading', type: 'text', required: true },
          { name: 'body', label: 'Text', type: 'textarea', rows: 3 },
          { name: 'button_label', label: 'Button text', type: 'text', half: true },
          { name: 'button_url', label: 'Button link', type: 'url', half: true },
          { name: 'offer_id', label: 'Linked offer (shows its end date)', type: 'relation', source: 'offers' },
          { name: 'desktop_image', label: 'Image', type: 'image', bucket: 'banners', required: true },
        ],
      },
      { title: 'Schedule', fields: [...schedule, { name: 'is_active', label: 'Banner is on', type: 'switch' }] },
    ],
  },

  announcements: {
    key: 'announcements',
    table: 'announcements',
    label: 'Announcement bar',
    singular: 'Message',
    description: 'Short messages in the bar at the very top of every page. Several messages rotate.',
    titleField: 'message',
    orderable: true,
    toggle: { field: 'is_active', label: 'On' },
    defaultSort: { column: 'sort_order', ascending: true },
    canCreate: true,
    canDelete: true,
    defaults: { is_active: true },
    columns: [
      { field: 'message', label: 'Message' },
      { field: 'link_url', label: 'Link' },
      { field: 'starts_at', label: 'Schedule', kind: 'schedule' },
    ],
    groups: [
      {
        title: 'Message',
        fields: [
          { name: 'message', label: 'Message', type: 'text', required: true, maxLength: 160, placeholder: 'Free delivery across Pakistan · Cash on delivery' },
          { name: 'link_url', label: 'Link (optional)', type: 'url', placeholder: '/sale' },
          ...schedule,
          { name: 'is_active', label: 'Message is on', type: 'switch' },
        ],
      },
    ],
  },

  offers: {
    key: 'offers',
    table: 'offers',
    label: 'Offers',
    singular: 'Offer',
    description: 'Discounts apply automatically on the website between the start and end times. The lowest price always wins; offers do not stack.',
    titleField: 'name',
    toggle: { field: 'is_active', label: 'On' },
    defaultSort: { column: 'starts_at', ascending: false },
    canCreate: true,
    canDelete: true,
    defaults: { is_active: true, discount_type: 'percent', scope: 'categories', priority: 0, category_ids: [], collection_ids: [], product_ids: [] },
    columns: [
      { field: 'name', label: 'Offer' },
      { field: 'discount_value', label: 'Discount', kind: 'text' },
      { field: 'scope', label: 'Applies to', kind: 'badge' },
      { field: 'starts_at', label: 'Status', kind: 'schedule' },
    ],
    groups: [
      {
        title: 'Offer',
        fields: [
          { name: 'name', label: 'Offer name', type: 'text', required: true, placeholder: 'White Friday Sofa Sale' },
          { name: 'badge', label: 'Badge on products', type: 'text', maxLength: 30, placeholder: 'White Friday', help: 'Short label shown on product cards.' },
          {
            name: 'discount_type',
            label: 'Discount type',
            type: 'select',
            half: true,
            options: [
              { value: 'percent', label: 'Percentage off' },
              { value: 'fixed', label: 'Fixed amount off (Rs.)' },
            ],
          },
          { name: 'discount_value', label: 'Discount', type: 'number', half: true, required: true, min: 1, help: 'e.g. 15 for 15%, or 5000 for Rs. 5,000' },
        ],
      },
      {
        title: 'Applies to',
        fields: [
          {
            name: 'scope',
            label: 'Products',
            type: 'select',
            options: [
              { value: 'all', label: 'Everything' },
              { value: 'categories', label: 'Chosen categories' },
              { value: 'collections', label: 'Chosen collections' },
              { value: 'products', label: 'Chosen products' },
            ],
          },
          { name: 'category_ids', label: 'Categories', type: 'relations', source: 'categories', showWhen: { field: 'scope', in: ['categories'] }, help: 'Choosing a group (e.g. Tables) includes everything inside it.' },
          { name: 'collection_ids', label: 'Collections', type: 'relations', source: 'collections', showWhen: { field: 'scope', in: ['collections'] } },
          { name: 'product_ids', label: 'Products', type: 'relations', source: 'products', showWhen: { field: 'scope', in: ['products'] } },
        ],
      },
      {
        title: 'Schedule',
        fields: [
          ...schedule,
          { name: 'priority', label: 'Priority', type: 'number', help: 'Only matters if two offers give the same price.' },
          { name: 'is_active', label: 'Offer is on', type: 'switch' },
        ],
      },
    ],
  },

  reviews: {
    key: 'reviews',
    table: 'reviews',
    label: 'Reviews',
    singular: 'Review',
    description: 'Approve reviews submitted on the website, or add reviews you received on WhatsApp.',
    titleField: 'customer_name',
    defaultSort: { column: 'created_at', ascending: false },
    canCreate: true,
    canDelete: true,
    defaults: { rating: 5, status: 'approved', source: 'whatsapp', is_featured: false },
    columns: [
      { field: 'customer_name', label: 'Customer' },
      { field: 'rating', label: 'Rating', kind: 'rating' },
      { field: 'body', label: 'Review' },
      { field: 'status', label: 'Status', kind: 'status' },
    ],
    groups: [
      {
        title: 'Review',
        fields: [
          { name: 'customer_name', label: 'Customer name', type: 'text', required: true, half: true },
          { name: 'city', label: 'City', type: 'text', half: true },
          { name: 'rating', label: 'Rating', type: 'rating', required: true },
          { name: 'body', label: 'Review', type: 'textarea', rows: 5, required: true, maxLength: 2000 },
          { name: 'product_id', label: 'Product (optional)', type: 'relation', source: 'products' },
          {
            name: 'source',
            label: 'Received via',
            type: 'select',
            half: true,
            options: ['website', 'whatsapp', 'facebook', 'instagram', 'google'].map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) })),
          },
          { name: 'review_date', label: 'Date', type: 'date', half: true },
        ],
      },
      {
        title: 'Publishing',
        fields: [
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'pending', label: 'Waiting for approval' },
              { value: 'approved', label: 'Approved (shown on the website)' },
              { value: 'hidden', label: 'Hidden' },
            ],
          },
          { name: 'is_featured', label: 'Feature on the home page', type: 'switch' },
        ],
      },
    ],
  },

  faqs: {
    key: 'faqs',
    table: 'faqs',
    label: 'FAQs',
    singular: 'Question',
    description: 'Questions on the FAQ page. Tick "Show on custom furniture page" for custom-order questions.',
    titleField: 'question',
    orderable: true,
    toggle: { field: 'is_visible', label: 'Visible' },
    defaultSort: { column: 'sort_order', ascending: true },
    canCreate: true,
    canDelete: true,
    defaults: { is_visible: true, group_name: 'Orders' },
    columns: [
      { field: 'question', label: 'Question' },
      { field: 'group_name', label: 'Topic', kind: 'badge' },
    ],
    groups: [
      {
        title: 'Question',
        fields: [
          { name: 'question', label: 'Question', type: 'text', required: true },
          { name: 'answer_html', label: 'Answer', type: 'richtext', required: true },
          {
            name: 'group_name',
            label: 'Topic',
            type: 'select',
            options: ['Orders', 'Payment', 'Delivery', 'Products & Care', 'Custom Orders', 'Returns'].map((v) => ({ value: v, label: v })),
          },
          { name: 'show_on_customize', label: 'Also show on the custom furniture page', type: 'switch' },
          { name: 'is_visible', label: 'Visible', type: 'switch' },
        ],
      },
    ],
  },

  pages: {
    key: 'pages',
    table: 'pages',
    label: 'Pages',
    singular: 'Page',
    description: 'About, Customize and the policy pages.',
    titleField: 'title',
    defaultSort: { column: 'slug', ascending: true },
    canCreate: false,
    canDelete: false,
    columns: [
      { field: 'title', label: 'Page' },
      { field: 'slug', label: 'Address', kind: 'text' },
      { field: 'updated_at', label: 'Updated', kind: 'date' },
    ],
    groups: [
      {
        title: 'Content',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'intro', label: 'Introduction', type: 'textarea', rows: 3 },
          { name: 'body_html', label: 'Main text', type: 'richtext' },
          { name: 'hero_image', label: 'Header image', type: 'image', bucket: 'content', showWhen: { field: 'slug', in: ['about', 'customize'] } },
        ],
      },
      {
        title: 'Page sections',
        description: 'The structured parts of the About and Customize pages.',
        fields: [
          {
            name: 'blocks.sections',
            label: 'Image and text rows',
            type: 'list',
            showWhen: { field: 'slug', in: ['about'] },
            item: [
              { name: 'heading', label: 'Heading', type: 'text' },
              { name: 'body', label: 'Text', type: 'textarea', rows: 3 },
              { name: 'image', label: 'Image', type: 'image', bucket: 'content' },
            ],
          },
          {
            name: 'blocks.options',
            label: 'What can be customised',
            type: 'list',
            showWhen: { field: 'slug', in: ['customize'] },
            item: [
              { name: 'title', label: 'Title', type: 'text' },
              { name: 'text', label: 'Text', type: 'textarea', rows: 2 },
              { name: 'image', label: 'Image', type: 'image', bucket: 'content' },
            ],
          },
          {
            name: 'blocks.values',
            label: 'Values',
            type: 'list',
            showWhen: { field: 'slug', in: ['about'] },
            item: [
              { name: 'title', label: 'Title', type: 'text' },
              { name: 'text', label: 'Text', type: 'textarea', rows: 2 },
            ],
          },
          {
            name: 'blocks.steps',
            label: 'Process steps',
            type: 'list',
            showWhen: { field: 'slug', in: ['about', 'customize'] },
            item: [
              { name: 'title', label: 'Title', type: 'text' },
              { name: 'text', label: 'Text', type: 'textarea', rows: 2 },
            ],
          },
          {
            name: 'blocks.stats',
            label: 'Figures (counters)',
            type: 'list',
            showWhen: { field: 'slug', in: ['about'] },
            help: 'Only use real numbers.',
            item: [
              { name: 'value', label: 'Number', type: 'number' },
              { name: 'suffix', label: 'After the number', type: 'text', placeholder: '+' },
              { name: 'label', label: 'Label', type: 'text' },
            ],
          },
          {
            name: 'blocks.gallery',
            label: 'Gallery (3 images)',
            type: 'list',
            showWhen: { field: 'slug', in: ['about', 'customize'] },
            item: [{ name: 'image', label: 'Image', type: 'image', bucket: 'content' }],
          },
        ],
      },
      seo,
    ],
  },
}

export const SETTINGS_GROUPS: FieldGroup[] = [
  {
    title: 'WhatsApp',
    description: 'Every "Order on WhatsApp" button uses these.',
    fields: [
      { name: 'whatsapp_number', label: 'WhatsApp number', type: 'text', required: true, placeholder: '+92 300 1234567', help: 'International format with country code.' },
      {
        name: 'whatsapp_order_template',
        label: 'Order message',
        type: 'textarea',
        rows: 12,
        help: 'Placeholders: {{product}} {{options}} {{quantity}} {{price}} {{total}} {{sku}} {{url}}. Lines with an empty placeholder are left out.',
      },
      { name: 'whatsapp_general_message', label: 'General message (floating button)', type: 'textarea', rows: 2 },
      { name: 'whatsapp_custom_message', label: 'Custom furniture message', type: 'textarea', rows: 2 },
      { name: 'whatsapp_reply_note', label: 'Reply time note', type: 'text', placeholder: 'We usually reply within an hour, 10 am to 9 pm.' },
    ],
  },
  {
    title: 'Contact details',
    fields: [
      { name: 'phone', label: 'Phone', type: 'text', half: true },
      { name: 'email', label: 'Email', type: 'text', half: true },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'city', label: 'City', type: 'text', half: true },
      { name: 'business_hours', label: 'Opening hours', type: 'text', half: true },
      {
        name: 'map_embed_url',
        label: 'Google Maps embed link',
        type: 'url',
        help: 'In Google Maps: Share → Embed a map → copy only the https://www.google.com/maps/embed?... address.',
      },
      { name: 'map_link_url', label: 'Google Maps directions link', type: 'url' },
    ],
  },
  {
    title: 'Social media',
    fields: [
      { name: 'instagram_url', label: 'Instagram', type: 'url', half: true },
      { name: 'facebook_url', label: 'Facebook', type: 'url', half: true },
      { name: 'tiktok_url', label: 'TikTok', type: 'url', half: true },
      { name: 'youtube_url', label: 'YouTube', type: 'url', half: true },
    ],
  },
  {
    title: 'Brand',
    fields: [
      { name: 'brand_name', label: 'Brand name', type: 'text', required: true, half: true },
      { name: 'tagline', label: 'Tagline', type: 'text', half: true },
      { name: 'intro_enabled', label: 'Play the logo intro on the first home page visit', type: 'switch' },
    ],
  },
  {
    title: 'Search engines & sharing',
    fields: [
      { name: 'default_seo_title', label: 'Home page title', type: 'text', maxLength: 70 },
      { name: 'default_seo_description', label: 'Default description', type: 'textarea', rows: 3, maxLength: 170 },
      { name: 'gsc_verification', label: 'Google Search Console verification code', type: 'text', help: 'Only the content="…" value of the HTML tag.' },
    ],
  },
  {
    title: 'Analytics',
    fields: [
      { name: 'ga4_id', label: 'Google Analytics 4 ID', type: 'text', half: true, placeholder: 'G-XXXXXXXXXX' },
      { name: 'meta_pixel_id', label: 'Meta Pixel ID', type: 'text', half: true, placeholder: '123456789012345' },
    ],
  },
  {
    title: 'Product page defaults',
    fields: [
      { name: 'default_delivery_html', label: 'Delivery & returns text', type: 'richtext' },
      { name: 'default_care_html', label: 'Care instructions', type: 'richtext' },
    ],
  },
  {
    title: 'Search',
    fields: [
      { name: 'popular_searches', label: 'Popular searches', type: 'tags', help: 'Suggested in the search box. Press Enter after each.' },
      {
        name: 'search_synonyms_text',
        label: 'Spelling variations',
        type: 'textarea',
        rows: 6,
        help: 'One per line: what people type = what to search for. e.g. shisham = sheesham',
      },
    ],
  },
]
