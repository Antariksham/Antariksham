import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { ApodArchive } from '@/modules/gallery/components/ApodArchive'
import { getApodWindow } from '@/modules/nasa/services/getApodArchive'
import { APOD_EPOCH, latestWindow } from '@/modules/nasa/services/apodArchive'

// A new picture appears daily; an hour-stale first page is fine.
export const revalidate = 3600

const TITLE = `APOD Archive — ${siteConfig.name}`
const DESCRIPTION =
  'Browse NASA’s Astronomy Picture of the Day archive — every image and video since 16 June 1995, with the original explanation, credits and a link to each day’s page.'

export const metadata: Metadata = {
  // Plain name — the root layout's titleTemplate appends "| Antariksham".
  title: 'APOD Archive',
  description: DESCRIPTION,
  alternates: { canonical: '/gallery/apod' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/gallery/apod',
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

export default async function ApodArchivePage() {
  // Open-ended newest window: NASA 400s on an end_date past its latest entry
  // (its "today" follows US Eastern), so we let it decide where the archive ends.
  const todayIso = new Date().toISOString().slice(0, 10)
  const items = await getApodWindow(latestWindow(todayIso))
  const latestDate = items[0]?.date ?? todayIso

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: 'APOD Archive',
      url: `${siteConfig.url}/gallery/apod`,
      description: DESCRIPTION,
      isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
      publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
      // Only the server-rendered page is described, so the markup always
      // matches what a crawler actually sees.
      image: items.slice(0, 12).map(i => ({
        '@type': 'ImageObject',
        contentUrl: i.thumb,
        name: i.title,
        datePublished: i.date,
        creditText: i.credit,
        isBasedOn: i.sourceUrl,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Gallery', item: `${siteConfig.url}/gallery` },
        { '@type': 'ListItem', position: 2, name: 'APOD Archive', item: `${siteConfig.url}/gallery/apod` },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ paddingTop: 'var(--nav-height)' }}>

        <header className="page-header">
          <div className="container">
            <p className="card-category">
              <Link href="/gallery" style={{ color: 'inherit' }}>Gallery</Link> · NASA
            </p>
            <h1 className="page-title">APOD Archive</h1>
            <p className="page-lede">
              Every Astronomy Picture of the Day since {APOD_EPOCH.split('-')[0]} — each with
              the original explanation written by a professional astronomer. Jump to any
              date, or keep scrolling back through three decades of the night sky.
            </p>
          </div>
        </header>

        <main className="container section">
          <ApodArchive
            initialItems={items}
            latestDate={latestDate}
            initialError={items.length === 0}
          />
        </main>
      </div>
    </>
  )
}
