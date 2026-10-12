// Generates every brand asset the site uses from the single source logo.
// Run: node scripts/brand-assets.mjs
// Source: assets/brand/logo-source.png (stacked logo on a near-white background).
import sharp from 'sharp'
import { writeFile, mkdir } from 'node:fs/promises'

const SRC = 'assets/brand/logo-source.png'
const OUT = 'public/brand'
const IVORY = { r: 248, g: 245, b: 239 }

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width
const BG = [252, 251, 250]

// "Colour to alpha": removes the near-white background while keeping soft edges
// and the light cream tones of the illustration (they become translucent).
function toRgba(region, { erase, recolor } = {}) {
  const { left, top, width, height } = region
  const out = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = left + x
      const sy = top + y
      const si = (sy * W + sx) * 3
      const o = (y * width + x) * 4
      if (erase && erase(sx, sy)) continue
      const p = [data[si], data[si + 1], data[si + 2]]
      let a = 0
      for (let c = 0; c < 3; c++) {
        // Nothing in the logo is lighter than the paper, so lighter pixels are background.
        const d = p[c] < BG[c] ? (BG[c] - p[c]) / BG[c] : 0
        a = Math.max(a, d)
      }
      // Recoloured (single-colour) versions need a firmer edge so paper grain doesn't show.
      if (recolor) a = Math.max(0, Math.min(1, (a - 0.12) / 0.45))
      if (a < 0.03) continue
      a = Math.min(1, a)
      for (let c = 0; c < 3; c++) {
        const v = recolor ? recolor[c] : (p[c] - BG[c]) / a + BG[c]
        out[o + c] = Math.max(0, Math.min(255, Math.round(v)))
      }
      out[o + 3] = Math.round(a * 255)
    }
  }
  return sharp(out, { raw: { width, height, channels: 4 } })
}

await mkdir(OUT, { recursive: true })

// Regions measured from the source (1774 x 887).
const FULL = { left: 440, top: 30, width: 940, height: 778 }
const MARK = { left: 670, top: 34, width: 438, height: 432 }
const WORDMARK = { left: 452, top: 426, width: 912, height: 224 }
const LOCKUP = { left: 452, top: 426, width: 912, height: 306 }
// The house's floor line shares rows with the top of the "L"; erase it from wordmark crops.
const eraseHouse = (x, y) => y < 494 && x > 600

const tasks = [
  ['logo-full.png', toRgba(FULL), 1200],
  ['logo-mark.png', toRgba(MARK), 512],
  ['wordmark.png', toRgba(WORDMARK, { erase: eraseHouse }), 912],
  ['wordmark-light.png', toRgba(WORDMARK, { erase: eraseHouse, recolor: [248, 245, 239] }), 912],
  ['lockup.png', toRgba(LOCKUP, { erase: eraseHouse }), 912],
  ['lockup-light.png', toRgba(LOCKUP, { erase: eraseHouse, recolor: [248, 245, 239] }), 912],
]
for (const [name, img, width] of tasks) {
  const buf = await img.png().toBuffer()
  await sharp(buf).trim({ threshold: 1 }).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(`${OUT}/${name}`)
  console.log('wrote', name)
}

// App icons: mark centred on ivory.
async function iconOn(size, pad) {
  const mark = await sharp(await toRgba(MARK).png().toBuffer())
    .trim({ threshold: 1 })
    .resize({ width: size - pad * 2, height: size - pad * 2, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: { ...IVORY, alpha: 1 } } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer()
}
// Small mark for the page-load intro (keeps the first visit light).
await sharp(await toRgba(MARK).png().toBuffer()).trim({ threshold: 1 }).resize({ height: 192 }).webp({ quality: 82 }).toFile(`${OUT}/logo-mark-192.webp`)
console.log('wrote logo-mark-192.webp')

await writeFile('src/app/icon.png', await iconOn(512, 40))
await writeFile('src/app/apple-icon.png', await iconOn(180, 16))
console.log('wrote icon.png, apple-icon.png')

// favicon.ico with embedded 16/32/48 PNGs (ICO supports PNG payloads).
const sizes = [16, 32, 48]
const pngs = await Promise.all(sizes.map((s) => iconOn(s, Math.max(1, Math.round(s * 0.04)))))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = 6 + 16 * sizes.length
const dirs = sizes.map((s, i) => {
  const d = Buffer.alloc(16)
  d.writeUInt8(s, 0)
  d.writeUInt8(s, 1)
  d.writeUInt8(0, 2)
  d.writeUInt8(0, 3)
  d.writeUInt16LE(1, 4)
  d.writeUInt16LE(32, 6)
  d.writeUInt32LE(pngs[i].length, 8)
  d.writeUInt32LE(offset, 12)
  offset += pngs[i].length
  return d
})
await writeFile('src/app/favicon.ico', Buffer.concat([header, ...dirs, ...pngs]))
console.log('wrote favicon.ico')

// Default social share image (1200 x 630): full logo on ivory.
const full = await sharp(await toRgba(FULL).png().toBuffer()).trim({ threshold: 1 }).resize({ height: 540 }).png().toBuffer()
await sharp({ create: { width: 1200, height: 630, channels: 3, background: IVORY } })
  .composite([{ input: full, gravity: 'center' }])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile('src/app/opengraph-image.jpg')
console.log('wrote opengraph-image.jpg')
