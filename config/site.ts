export const siteConfig = {
  name:        'Antariksham',
  domain:      'antariksham.org',
  url:         'https://antariksham.org',
  tagline:     'Independent Space Intelligence & Knowledge Platform',
  description: 'Scientific journalism, live mission tracking, deep-space telemetry, and an educational knowledge engine — all in one independent platform.',
  tld:         '.org',
  locale:      'en_US',
  twitter:     '@antariksham',
  positioning: 'Independent Space Intelligence Organization',
  philosophy:  'Exploring Space Through Knowledge, Research & Discovery',
  email:       'contact@antariksham.org',
  seo: {
    defaultTitle:  'Antariksham — Space Intelligence & Knowledge Platform',
    titleTemplate: '%s | Antariksham',
    // The Organization mark, for the `logo` field of the Organization JSON-LD.
    // A real file at public/logo.svg — this replaced `defaultImage`, which
    // pointed at /images/og-default.jpg, a path that never existed in the repo.
    // Social share cards no longer read from here at all: app/opengraph-image.tsx
    // generates them, and Next applies it to every route by file convention.
    logo:          '/logo.svg',
    twitterCard:   'summary_large_image' as const,
  },
} as const
