import Link from 'next/link'
import { StatusBadge } from '@/modules/missions/components/MissionsPage'
import { BODY_BY_ID } from '../services/solarSystemBodies'
import type { Topic } from '../services/topics'
import type { TopicContent } from '../services/topicContent'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "12 Mar 2031" — locale-independent, so SSR and hydration always agree. */
function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

interface Props {
  topic:   Topic
  content: TopicContent
}

/**
 * A topic hub: the curated introduction, the tools that belong to the topic,
 * and every article / learn page / mission the site has about it. Server
 * component — all data arrives as props.
 */
export function TopicHub({ topic, content }: Props) {
  const body = topic.bodyId ? BODY_BY_ID[topic.bodyId] : null
  const { articles, learn, missions, isEmpty } = content

  return (
    <div>
      {/* ── Introduction + tool cross-links ── */}
      <section className="topic-intro">
        <p className="topic-lead">{topic.description}</p>

        <div className="topic-tools">
          {body && (
            <Link href={`/explore/solar-system?body=${body.id}`} className="topic-tool press">
              <span className="topic-tool-dot" style={{ background: body.color }} aria-hidden />
              <span>
                <span className="topic-tool-label">See {body.name} in the Solar System Explorer</span>
                <span className="topic-tool-sub">{body.tagline}</span>
              </span>
            </Link>
          )}
          {topic.links?.map(l => (
            <Link key={l.href} href={l.href} className="topic-tool press">
              <span className="topic-tool-dot" style={{ background: topic.color }} aria-hidden />
              <span><span className="topic-tool-label">{l.label}</span></span>
            </Link>
          ))}
          <Link href={`/gallery?q=${encodeURIComponent(topic.galleryQuery)}`} className="topic-tool press">
            <span className="topic-tool-dot" style={{ background: topic.color }} aria-hidden />
            <span><span className="topic-tool-label">{topic.name} imagery in the Gallery</span></span>
          </Link>
        </div>
      </section>

      {isEmpty && (
        <section className="sky-card" style={{ marginTop: 26 }}>
          <p className="body-section-title" style={{ margin: '0 0 6px' }}>Coverage coming soon</p>
          <p className="sky-note">
            We haven’t published anything on {topic.name} yet — the tools above are
            live in the meantime. Browse{' '}
            <Link href="/articles" className="body-link">all articles</Link> or{' '}
            <Link href="/missions" className="body-link">all missions</Link>.
          </p>
        </section>
      )}

      {/* ── Articles ── */}
      {articles.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="section-head">
            <h2 className="section-title">Articles on {topic.name}</h2>
          </div>
          <div className="grid-3">
            {articles.map(a => (
              <Link key={a.id} href={`/articles/${a.slug}`} className="card">
                {a.featuredImage
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="card-image" src={a.featuredImage} alt={a.title} loading="lazy" decoding="async" />
                  : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.25 }}>{topic.emoji}</div>}
                <div className="card-body">
                  {a.category && <p className="card-category">{a.category}</p>}
                  <h3 className="card-title">{a.title}</h3>
                  {a.excerpt && <p className="card-excerpt">{a.excerpt}</p>}
                  <div className="card-meta" style={{ justifyContent: 'space-between' }}>
                    <span>{fmtDate(a.publishedAt)}</span>
                    <span>{a.readingTime} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Missions ── */}
      {missions.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="section-head">
            <h2 className="section-title">Missions to {topic.name}</h2>
            <Link href="/missions" className="body-link">All missions →</Link>
          </div>
          <div className="grid-3">
            {missions.map(m => (
              <Link key={m.id} href={`/missions/${m.slug}`} className="card">
                {m.featuredImage
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img className="card-image" src={m.featuredImage} alt={m.name} loading="lazy" decoding="async" />
                  : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.25 }}>🛸</div>}
                <div className="card-body">
                  <p className="card-category">
                    {m.agency || 'Mission'}{m.destination ? ` · ${m.destination}` : ''}
                  </p>
                  <h3 className="card-title">{m.name}</h3>
                  {m.description && <p className="card-excerpt">{m.description}</p>}
                  <div className="card-meta" style={{ justifyContent: 'space-between' }}>
                    <StatusBadge status={m.status} />
                    {m.launchDate && <span>{fmtDate(m.launchDate)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Learn ── */}
      {learn.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="section-head">
            <h2 className="section-title">Learn about {topic.name}</h2>
            <Link href="/learn" className="body-link">All guides →</Link>
          </div>
          <div className="grid-3">
            {learn.map(l => (
              <Link key={l.id} href={`/learn/${l.slug}`} className="card">
                <div className="card-body">
                  <p className="card-category">{l.difficultyLevel}</p>
                  <h3 className="card-title">
                    <span aria-hidden style={{ marginRight: 8 }}>{l.icon}</span>
                    {l.title}
                  </h3>
                  {l.excerpt && <p className="card-excerpt">{l.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p style={{ marginTop: 32, fontSize: '0.88rem', color: 'var(--faint)' }}>
        Explore another subject in the{' '}
        <Link href="/explore/topics" style={{ color: 'var(--accent)' }}>topic hubs</Link>, or
        search the whole site for{' '}
        <Link href={`/search?q=${encodeURIComponent(topic.name)}`} style={{ color: 'var(--accent)' }}>
          “{topic.name}”
        </Link>.
      </p>
    </div>
  )
}
