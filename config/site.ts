// The site's public identity. Everything user-visible — nav wordmark, footer,
// page titles, canonical URLs, sitemap, OG tags, JSON-LD publisher — derives
// from here, so the brand lives in exactly one file.
//
// ── Running as CosmosDaily ───────────────────────────────────────────────────
// This engine is production at cosmosdaily.space. It keeps CosmosDaily's name
// and domain (the SEO equity is CosmosDaily's) but Antariksham's editorial
// voice — tagline, positioning, philosophy — which carries over unchanged.
//
// ── Switching back to Antariksham (future) ───────────────────────────────────
// When antariksham.org is bought, the rename is this file plus 301s from the
// old URLs. The dormant values are kept below, ready to swap in:
//
//   name: 'Antariksham'   ·   wordmark: { lead: 'Antariksham', accent: '.org' }
//   domain: 'antariksham.org'   ·   url: 'https://antariksham.org'
//   twitter: '@antariksham'     ·   email: 'contact@antariksham.org'
//   seo.defaultTitle:  'Antariksham — Space Intelligence & Knowledge Platform'
//   seo.titleTemplate: '%s | Antariksham'
//
// The wordmark renders as `lead` + an accent-coloured `accent`, which is why
// both identities fit the same two-part shape: Cosmos+Daily, Antariksham+.org.

export const siteConfig = {
  name:        'CosmosDaily',
  /** Nav + footer wordmark: `lead` in the text colour, `accent` in the accent. */
  wordmark:    { lead: 'Cosmos', accent: 'Daily' },
  domain:      'cosmosdaily.space',
  url:         'https://cosmosdaily.space',
  tagline:     'Independent Space Intelligence & Knowledge Platform',
  description: 'Scientific journalism, live mission tracking, deep-space telemetry, and an educational knowledge engine — all in one independent platform.',
  locale:      'en_US',
  twitter:     '@cosmosdaily',
  positioning: 'Independent Space Intelligence Organization',
  philosophy:  'Exploring Space Through Knowledge, Research & Discovery',
  email:       'contact@cosmosdaily.space',
  seo: {
    defaultTitle:  'CosmosDaily — Space Intelligence & Knowledge Platform',
    titleTemplate: '%s | CosmosDaily',
    defaultImage:  '/images/og-default.jpg',
    twitterCard:   'summary_large_image' as const,
  },
} as const
