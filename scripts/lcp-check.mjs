// Measures LCP on a throttled "mid-range phone" (4x CPU, slow 4G), with and without the intro.
// node scripts/lcp-check.mjs [url]
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:3108/'
const browser = await chromium.launch()

async function run(skipIntro) {
  const context = await browser.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.6 })
  if (skipIntro) await context.addInitScript(() => sessionStorage.setItem('lc-intro', '1'))
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  await page.addInitScript(() => {
    window.__lcp = []
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), el: e.element?.tagName, src: (e.url || '').slice(-40) })
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  await page.goto(url, { waitUntil: 'load', timeout: 120000 })
  await page.waitForTimeout(3000)
  const lcp = await page.evaluate(() => window.__lcp)
  const tbt = await page.evaluate(() => performance.getEntriesByType('navigation')[0].domInteractive)
  console.log(skipIntro ? 'no intro ' : 'with intro', JSON.stringify(lcp), 'domInteractive', Math.round(tbt))
  await context.close()
}

await run(false)
await run(true)
await browser.close()
