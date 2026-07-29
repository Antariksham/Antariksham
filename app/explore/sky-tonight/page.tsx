import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { SkyTonightPage } from '@/modules/explore/components/SkyTonightPage'

// The astronomy is computed from the render epoch and re-synced client-side
// after mount, so an hour-stale shell is imperceptible.
export const revalidate = 3600

const TITLE = `Sky Tonight — ${siteConfig.name}`
const DESCRIPTION =
  'What is above you right now — tonight’s Moon phase, which planets are visible in the evening or morning sky, and upcoming ISS passes computed for your location, in your browser.'

export const metadata: Metadata = {
  // Plain name — the root layout's titleTemplate appends "| CosmosDaily".
  title: 'Sky Tonight',
  description: DESCRIPTION,
  alternates: { canonical: '/explore/sky-tonight' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/explore/sky-tonight',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
    images: [siteConfig.seo.defaultImage],
  },
  twitter: {
    card: siteConfig.seo.twitterCard,
    title: TITLE,
    description: DESCRIPTION,
  },
}

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Sky Tonight',
    url: `${siteConfig.url}/explore/sky-tonight`,
    description: DESCRIPTION,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Explore', item: `${siteConfig.url}/explore` },
      { '@type': 'ListItem', position: 2, name: 'Sky Tonight', item: `${siteConfig.url}/explore/sky-tonight` },
    ],
  },
]

export default function SkyTonightRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ paddingTop: 'var(--nav-height)' }}>

        <header className="page-header">
          <div className="container">
            <p className="card-category">Explore</p>
            <h1 className="page-title">Sky Tonight</h1>
            <p className="page-lede">
              What’s above you right now — the Moon’s phase, which planets are out
              this evening or before dawn, and when the Space Station will fly
              over your location.
            </p>
          </div>
        </header>

        <main className="container section">
          <SkyTonightPage initialEpochMs={Date.now()} />
        </main>
      </div>
    </>
  )
}
