/**
 * Rasterises the brand mark into the PNG icons that PWA manifests and iOS
 * require. Run it whenever components/brand/Logo.tsx changes shape:
 *
 *     npm i --no-save sharp && node scripts/generate-icons.mjs
 *
 * sharp is deliberately NOT a dependency — this runs by hand a few times a
 * decade, and a native binary in the install graph is a real cost for everyone
 * else. The generated PNGs are committed, so a normal checkout never needs it.
 *
 * Why PNG at all, when the site already has app/icon.svg and public/logo.svg:
 * iOS ignores SVG for `apple-touch-icon`, and Chrome's installability check
 * still wants raster 192 and 512. Everything a browser can take as SVG already
 * gets SVG.
 *
 * The path data is duplicated from components/brand/Logo.tsx on purpose. That
 * file is a React component; importing it here would drag JSX and a build step
 * into a script whose whole job is to run with plain node. Four path strings
 * that change once every few years is the cheaper trade — if you edit one,
 * edit both, and the header comment in Logo.tsx says so.
 */

import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Keep in sync with components/brand/Logo.tsx.
const PATHS = [
  'M50 5C44.5 32 33 62 7 92L28 84C48 56 50.5 30 50 5Z',   // left blade
  'M50 5C55.5 32 67 62 93 92L72 84C52 56 49.5 30 50 5Z',   // right blade
  'M24 83Q52 101 80 80Q52 92 24 83Z',                      // base arc
  'M50 58C50.4 62.2 53.4 64.6 56.5 65C53.4 65.4 50.4 67.8 50 72C49.6 67.8 46.6 65.4 43.5 65C46.6 64.6 49.6 62.2 50 58Z', // star
]

const PLATE = '#0a0a0f' // --black, dark theme
const INK   = '#ffffff' // --white, dark theme

/** The mark's bounding box in the 100×100 viewBox is x 7–93, y 5–92. */
const svg = ({ px, radius, transform }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">
  <rect width="100" height="100"${radius ? ` rx="${radius}"` : ''} fill="${PLATE}"/>
  <g fill="${INK}" transform="${transform}">${PATHS.map(d => `<path d="${d}"/>`).join('')}</g>
</svg>`

// Standard inset, matching app/icon.svg so every icon reads identically.
const INSET    = 'translate(12 12) scale(0.76)'
// A browser tab gives the mark 16 physical pixels. At the standard inset only
// ~10 of them are glyph, which turns to mush, so the favicon gets a tighter
// inset — the plate still reads, the "A" just fills more of it.
const TIGHT    = 'translate(8 8) scale(0.84)'
// Maskable icons get cropped to a circle or squircle by the launcher, so the
// mark has to sit inside the central 80% safe zone — scale 0.6, re-centred.
const MASKABLE = 'translate(20 20.9) scale(0.6)'

const ICONS = [
  // PWA manifest, purpose "any" — rounded plate, transparent corners.
  { out: 'public/icons/icon-192.png',          px: 192, radius: 22, transform: INSET },
  { out: 'public/icons/icon-512.png',          px: 512, radius: 22, transform: INSET },
  // PWA manifest, purpose "maskable" — full bleed, the launcher supplies the shape.
  { out: 'public/icons/icon-maskable-512.png', px: 512, radius: 0,  transform: MASKABLE },
  // iOS home screen. Full bleed and flattened: iOS rounds it itself, and
  // composites transparency onto black, which would show as dark fringing.
  { out: 'app/apple-icon.png',                 px: 180, radius: 0,  transform: INSET, flatten: true },
]

for (const { out, px, radius, transform, flatten } of ICONS) {
  const dest = join(ROOT, out)
  await mkdir(dirname(dest), { recursive: true })

  let img = sharp(Buffer.from(svg({ px, radius, transform })))
  if (flatten) img = img.flatten({ background: PLATE })

  const { width, height } = await img.png({ compressionLevel: 9 }).toFile(dest)
  if (width !== px || height !== px) throw new Error(`${out}: expected ${px}², got ${width}×${height}`)
  console.log(`${out.padEnd(38)} ${width}×${height}`)
}

/**
 * `app/favicon.ico` — the one Chrome actually shows in a tab.
 *
 * It takes precedence over `app/icon.svg` in Chrome, so leaving the
 * create-next-app default here meant the site kept showing Vercel's triangle no
 * matter what else was declared.
 *
 * sharp cannot write ICO, but the container is trivial: a 6-byte header, one
 * 16-byte directory entry per image, then the image blobs. The entries are
 * PNG-encoded, which every browser in use has understood for well over a
 * decade — no need for the legacy BMP encoding.
 */
const ICO_SIZES = [16, 32, 48]

const frames = await Promise.all(
  ICO_SIZES.map(px =>
    sharp(Buffer.from(svg({ px, radius: 22, transform: TIGHT })))
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ),
)

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)                 // reserved
header.writeUInt16LE(1, 2)                 // 1 = icon
header.writeUInt16LE(frames.length, 4)

let offset = 6 + frames.length * 16
const entries = frames.map((data, i) => {
  const e = Buffer.alloc(16)
  e[0] = ICO_SIZES[i] % 256                // 0 would mean 256
  e[1] = ICO_SIZES[i] % 256
  e[2] = 0                                 // palette colours (0 = truecolour)
  e[3] = 0                                 // reserved
  e.writeUInt16LE(1,  4)                   // colour planes
  e.writeUInt16LE(32, 6)                   // bits per pixel
  e.writeUInt32LE(data.length, 8)
  e.writeUInt32LE(offset, 12)
  offset += data.length
  return e
})

const icoPath = join(ROOT, 'app/favicon.ico')
await writeFile(icoPath, Buffer.concat([header, ...entries, ...frames]))
console.log(`${'app/favicon.ico'.padEnd(38)} ${ICO_SIZES.join(', ')} px`)
