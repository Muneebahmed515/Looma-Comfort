// Visual QA helper: node scripts/shot.mjs <path> <name> [mobile|desktop] [full] [motion]
// Saves screenshots to $SHOT_DIR (default ./.shots) and prints console errors.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const [path = '/', name = 'shot', device = 'desktop', ...flags] = process.argv.slice(2)
const base = process.env.BASE_URL ?? 'http://localhost:3107'
const dir = process.env.SHOT_DIR ?? '.shots'
mkdirSync(dir, { recursive: true })

const mobile = device === 'mobile'
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: flags.includes('motion') ? 'no-preference' : 'reduce',
})
const page = await context.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(base + path, { waitUntil: 'networkidle', timeout: 90000 })
if (flags.includes('full')) {
  // Scroll through so lazy images load.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(800)
}
await page.waitForTimeout(flags.includes('motion') ? 2600 : 600)
await page.screenshot({ path: `${dir}/${name}.png`, fullPage: flags.includes('full') })
console.log(`saved ${dir}/${name}.png`)
if (errors.length) console.log('console errors:\n' + errors.slice(0, 10).join('\n'))
await browser.close()
