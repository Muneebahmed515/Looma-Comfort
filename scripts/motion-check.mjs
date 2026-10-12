// Checks the motion system in a real browser: intro, smooth scroll, reveals, console errors.
// node scripts/motion-check.mjs [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:3108'
const dir = process.env.SHOT_DIR ?? '.shots'
mkdirSync(dir, { recursive: true })
const browser = await chromium.launch()

for (const device of ['desktop', 'mobile']) {
  const mobile = device === 'mobile'
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile,
    hasTouch: mobile,
    deviceScaleFactor: 1,
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  const introClass = await page.evaluate(() => document.documentElement.className)
  await page.screenshot({ path: `${dir}/motion-${device}-intro.png` })
  await page.waitForTimeout(2600)
  const state = await page.evaluate(() => ({
    html: document.documentElement.className,
    lenis: Boolean(window.__lenis),
    initialised: document.querySelectorAll('[data-motion-init]').length,
    hidden: [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity === '0').length,
    lcp: performance.getEntriesByType('largest-contentful-paint').map((e) => Math.round(e.startTime)).pop() ?? null,
  }))
  await page.screenshot({ path: `${dir}/motion-${device}-hero.png` })
  // Scroll through the page slowly so reveals fire.
  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(140)
  }
  await page.waitForTimeout(1500)
  const after = await page.evaluate(() => ({
    hiddenAfterScroll: [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity === '0').length,
    total: document.querySelectorAll('[data-reveal]').length,
    triggers: window.ScrollTrigger ? 'global' : 'module',
  }))
  // Navigate to another page to exercise page transitions + rescans.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  await page.click('a[href="/best-sellers"]', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(2000)
  const second = await page.evaluate(() => ({ url: location.pathname, initialised: document.querySelectorAll('[data-motion-init]').length }))
  console.log(device, { introClass, ...state, ...after, second })
  if (errors.length) console.log('  console errors:', errors.slice(0, 8))
  await context.close()
}
await browser.close()
