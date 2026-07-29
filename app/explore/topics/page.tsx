import type { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { TOPICS } from '@/modules/explore/services/topics'

const TITLE = `Topic Hubs — ${siteConfig.name}`
const DESCRIPTION =
  'Curated gateways to the subjects that matter most in spaceflight and astronomy — Mars, the Moon, black holes, exoplanets and more, each gathering every article, mission, guide and live tool on the topic in one place.'

export const metadata: Metadata = {
  // Plain name — the root layout's titleTemplate appends "| CosmosDaily".
  title: 'Topic Hubs',
  description: DESCRIPTION,
  alternates: { canonical: '/explore/topics' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/explore/topics',
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
    '@type': 'CollectionPage',
    name: 'Topic Hubs',
    url: `${siteConfig.url}/explore/topics`,
    description: DESCRIPTION,
    isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
    hasPart: TOPICS.map(t => ({
      '@type': 'CollectionPage',
      name: t.name,
      url: `${siteConfig.url}/explore/topics/${t.slug}`,
      description: t.tagline,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Explore', item: `${siteConfig.url}/explore` },
      { '@type': 'ListItem', position: 2, name: 'Topic Hubs', item: `${siteConfig.url}/explore/topics` },
    ],
  },
]

export default function TopicsIndexPage() {
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
            <h1 className="page-title">Topic Hubs</h1>
            <p className="page-lede">
              Curated gateways to the subjects that matter most — each one gathers
              our articles, missions and guides on a topic alongside the
              interactive tools that bring it to life.
            </p>
          </div>
        </header>

        <main className="container section">
          <div className="grid-3">
            {TOPICS.map(topic => (
              <Link key={topic.slug} href={`/explore/topics/${topic.slug}`} className="card">
                <div style={{ height: '3px', background: `linear-gradient(90deg, ${topic.color}, transparent)` }} />
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.7rem', lineHeight: 1 }} aria-hidden>{topic.emoji}</span>
                    <span className="card-category" style={{ margin: 0, color: topic.color }}>{topic.eyebrow}</span>
                  </div>
                  <h2 className="card-title" style={{ fontSize: '1.2rem' }}>{topic.name}</h2>
                  <p className="card-excerpt" style={{ WebkitLineClamp: 3 }}>{topic.tagline}</p>
                  <div className="card-meta">
                    <span style={{ color: topic.color, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontSize: '0.78rem' }}>
                      Open hub →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </>
  )
}
