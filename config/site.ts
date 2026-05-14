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
    defaultImage:  '/images/og-default.jpg',
    twitterCard:   'summary_large_image' as const,
  },
} as const
