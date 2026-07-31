import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

/**
 * Web app manifest, served at /manifest.webmanifest by Next's file convention
 * (it also injects the <link rel="manifest">). This is what makes the site
 * installable — add to home screen on Android/desktop, launched without browser
 * chrome, with the brand mark as its icon.
 *
 * Icons are the committed PNGs from scripts/generate-icons.mjs rather than the
 * SVGs the rest of the site uses: Chrome's installability check still wants
 * raster 192 and 512. The `maskable` entry is a separate file, not the same one
 * relabelled — launchers crop maskable icons to a circle or squircle, so it is
 * drawn full-bleed with the mark pulled into the central safe zone. Shipping one
 * icon as both purposes is the usual way to get a mark with its edges shaved off.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id:          '/',
    name:        siteConfig.seo.defaultTitle,
    short_name:  siteConfig.name,
    description: siteConfig.description,
    start_url:   '/',
    scope:       '/',
    display:     'standalone',
    lang:        'en',
    categories:  ['education', 'news', 'science'],
    // A manifest gets one colour, but the site has a manual light/dark toggle.
    // The brand's own ground is the dark one — it is what the mark was drawn on
    // and what the share cards use — so the splash and task-switcher follow it
    // regardless of the in-page theme. Matches --black in the dark palette.
    background_color: '#0a0a0f',
    theme_color:      '#0a0a0f',
    icons: [
      { src: '/icons/icon-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
