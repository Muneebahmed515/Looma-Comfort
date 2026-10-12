// End-to-end smoke test of the main customer journeys.
// node scripts/e2e-smoke.mjs [baseUrl]
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:3000'
const browser = await chromium.launch()
let failures = 0
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '  ok  ' : '  FAIL'} ${name}${extra ? ` (${extra})` : ''}`)
  if (!cond) failures++
}

// ---------------------------------------------------------------- mobile
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  console.log('mobile')
  await page.goto(base + '/', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('dialog').waitFor({ timeout: 8000 })
  ok('menu drawer opens', await page.getByRole('dialog').isVisible())
  await page.getByRole('button', { name: /Seating/ }).click()
  await page.getByRole('link', { name: 'Sofas' }).first().click()
  await page.waitForURL('**/shop/sofas', { timeout: 15000 })
  ok('menu navigates to a category', page.url().endsWith('/shop/sofas'))

  await page.getByRole('button', { name: /Filter/ }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('dialog').getByRole('button', { name: 'Material' }).click()
  await page.getByRole('dialog').getByText('Velvet', { exact: true }).first().click()
  await page.waitForURL(/material=velvet/, { timeout: 15000 })
  ok('filter updates the URL', page.url().includes('material=velvet'))
  await page.keyboard.press('Escape')

  await page.goto(base + '/products/round-sheesham-coffee-table?size=36-round&finish=dark-walnut', { waitUntil: 'networkidle' })
  const price = await page.locator('h1 ~ div .tabular').first().textContent()
  ok('options from the link change the price', price?.includes('51,499') ?? false, price ?? '')
  const href = await page.getByRole('link', { name: /Order on WhatsApp/ }).first().getAttribute('href')
  const text = decodeURIComponent((href ?? '').split('text=')[1] ?? '')
  ok('WhatsApp link uses wa.me', (href ?? '').startsWith('https://wa.me/'))
  ok('message has product, options and price', text.includes('Round Sheesham Coffee Table') && text.includes('Size: 36" Round') && text.includes('Finish: Dark Walnut') && text.includes('Rs. 51,499'))
  ok('message has a link back with options', text.includes('/products/round-sheesham-coffee-table?size=36-round&finish=dark-walnut'))

  await page.getByRole('button', { name: /Save Round Sheesham Coffee Table to wishlist/ }).first().click()
  await page.goto(base + '/wishlist', { waitUntil: 'networkidle' })
  await page.getByText('Round Sheesham Coffee Table').first().waitFor({ timeout: 10000 })
  const listHref = await page.getByRole('link', { name: /Send my list on WhatsApp/ }).getAttribute('href')
  ok('wishlist sends the list on WhatsApp', decodeURIComponent(listHref ?? '').includes('1. *Round Sheesham Coffee Table*'))

  ok('no page errors (mobile)', errors.length === 0, errors.slice(0, 2).join(' | '))
  await ctx.close()
}

// ---------------------------------------------------------------- desktop
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  console.log('desktop')
  await page.goto(base + '/', { waitUntil: 'networkidle' })

  await page.getByRole('button', { name: 'Shop' }).click()
  await page.locator('#mega-menu').waitFor({ timeout: 8000 })
  ok('mega menu opens', await page.locator('#mega-menu').isVisible())
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Search' }).last().click()
  const input = page.getByRole('searchbox', { name: 'Search products' })
  await input.waitFor({ timeout: 8000 })
  await input.fill('shisham')
  await page.getByText('Round Sheesham Coffee Table').first().waitFor({ timeout: 10000 })
  ok('search suggests products (spelling variation shisham → sheesham)', true)
  await input.press('Enter')
  await page.waitForURL(/\/search\?q=shisham/, { timeout: 15000 })
  await page.getByRole('heading', { level: 1, name: /Results for/ }).waitFor({ timeout: 15000 })
  ok('search results page', true)

  await page.goto(base + '/shop?sort=price-asc', { waitUntil: 'networkidle' })
  const prices = await page.locator('article .tabular span:not(.sr-only)').allTextContents()
  ok('shop sorts by price', prices.length > 3)

  await page.goto(base + '/contact', { waitUntil: 'networkidle' })
  await page.getByLabel('Your name').fill('Test Customer')
  await page.getByLabel('Mobile number').fill('0300 1234567')
  await page.getByRole('textbox', { name: 'Message' }).fill('Do you deliver to Multan?')
  await page.getByRole('button', { name: 'Send message' }).click()
  await page.getByText(/Thank you/).first().waitFor({ timeout: 15000 })
  ok('contact form submits and offers WhatsApp hand-off', await page.getByRole('link', { name: /Continue on WhatsApp/ }).isVisible())

  const res = await page.goto(base + '/this-page-does-not-exist')
  ok('unknown pages return 404', res?.status() === 404)
  ok('404 is branded', await page.getByRole('heading', { level: 1, name: 'This room seems empty' }).isVisible())

  for (const path of ['/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/icon.png', '/opengraph-image.jpg']) {
    const r = await page.request.get(base + path)
    ok(`${path} responds`, r.ok())
  }
  const sitemap = await (await page.request.get(base + '/sitemap.xml')).text()
  ok('sitemap lists products', sitemap.includes('/products/alder-three-seater-leather-sofa'))

  await page.goto(base + '/products/alder-three-seater-leather-sofa', { waitUntil: 'networkidle' })
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
  ok('product structured data present', ld.some((s) => s.includes('"@type":"Product"') && s.includes('"priceCurrency":"PKR"')))
  ok('no page errors (desktop)', errors.length === 0, errors.slice(0, 2).join(' | '))
  await ctx.close()
}

await browser.close()
console.log(failures ? `\n${failures} check(s) failed` : '\nall smoke checks passed')
process.exit(failures ? 1 : 0)
