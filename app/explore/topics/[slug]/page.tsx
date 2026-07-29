import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { TOPICS, getTopic } from '@/modules/explore/services/topics'
import { getTopicContent } from '@/modules/explore/services/topicContent'
import { TopicHub } from '@/modules/explore/components/TopicHub'

// Content changes when articles/missions publish; an hour-stale hub is fine.
export const revalidate = 3600

export function generateStaticParams() {
  return TOPICS.map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const topic = getTopic(params.slug)
  if (!topic) return { title: 'Topic not found' }

  const title = `${topic.name} — Topic Hub`
  const description = `${topic.tagline} ${topic.description}`.slice(0, 300)
  const url = `/explore/topics/${topic.slug}`

  return {
    // Plain name — the root layout's titleTemplate appends "| CosmosDaily".
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${topic.name} — ${siteConfig.name}`,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
      images: [siteConfig.seo.defaultImage],
    },
    twitter: {
      card: siteConfig.seo.twitterCard,
      title: `${topic.name} — ${siteConfig.name}`,
      description,
    },
  }
}

export default async function TopicHubPage({ params }: { params: { slug: string } }) {
  const topic = getTopic(params.slug)
  if (!topic) notFound()

  const content = await getTopicContent(topic)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${topic.name} — Topic Hub`,
      url: `${siteConfig.url}/explore/topics/${topic.slug}`,
      description: topic.description,
      about: { '@type': 'Thing', name: topic.name },
      isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
      publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Explore', item: `${siteConfig.url}/explore` },
        { '@type': 'ListItem', position: 2, name: 'Topic Hubs', item: `${siteConfig.url}/explore/topics` },
        { '@type': 'ListItem', position: 3, name: topic.name, item: `${siteConfig.url}/explore/topics/${topic.slug}` },
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
            <p className="card-category" style={{ color: topic.color }}>
              <span aria-hidden style={{ marginRight: 8 }}>{topic.emoji}</span>
              {topic.eyebrow}
            </p>
            <h1 className="page-title">{topic.name}</h1>
            <p className="page-lede">{topic.tagline}</p>
          </div>
        </header>

        <main className="container section">
          <TopicHub topic={topic} content={content} />
        </main>
      </div>
    </>
  )
}
