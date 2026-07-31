import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'
import { GalleryPage } from '@/modules/gallery/components/GalleryPage'

const TITLE = `Gallery — ${siteConfig.name}`
const DESCRIPTION =
  'A window on the cosmos — browse and search hundreds of thousands of images from the NASA Image and Video Library: nebulae, galaxies, Mars, the Moon, launches, astronauts and more.'

export const metadata: Metadata = {
  // Plain name — the root layout's titleTemplate appends "| Antariksham".
  title: 'Gallery',
  description: DESCRIPTION,
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/gallery',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
  },
  twitter: {
    card: siteConfig.seo.twitterCard,
    title: TITLE,
    description: DESCRIPTION,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  name: 'Gallery',
  url: `${siteConfig.url}/gallery`,
  description: DESCRIPTION,
  isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
  publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
}

export default function GalleryRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ paddingTop: 'var(--nav-height)' }}>

        <header className="page-header">
          <div className="container">
            <p className="card-category">Imagery</p>
            <h1 className="page-title">Gallery</h1>
            <p className="page-lede">
              A window on the cosmos — curated highlights and a live search across
              the NASA Image and Video Library’s hundreds of thousands of photographs.
            </p>
          </div>
        </header>

        <main className="container section">
          <GalleryPage />
        </main>
      </div>
    </>
  )
}
