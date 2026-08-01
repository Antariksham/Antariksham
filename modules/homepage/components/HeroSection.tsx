import Link from 'next/link'
import { supabaseAdmin }       from '@/lib/supabase'
import { getHeroConfigPublic } from '@/modules/admin/services/adminHomepage'
import { articleHref, articlesListHref, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'

async function getFeaturedArticle(lang: LanguageCode) {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('articles')
    .select('id, title, slug, excerpt, reading_time, article_type, featured_image')
    .eq('featured', true)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  if (lang === DEFAULT_LANGUAGE) return data

  // The hero headline is the most prominent text on the page, so overlay the
  // published translation when there is one. Tolerant: English on any failure.
  const { data: t } = await db
    .from('article_translations')
    .select('title, excerpt')
    .eq('article_id', data.id)
    .eq('language_code', lang)
    .eq('is_published', true)
    .maybeSingle()

  return t ? { ...data, title: t.title, excerpt: t.excerpt ?? data.excerpt } : data
}

export async function HeroSection({ lang = DEFAULT_LANGUAGE }: { lang?: LanguageCode } = {}) {
  const [hero, featuredArticle] = await Promise.all([
    getHeroConfigPublic(),
    getFeaturedArticle(lang),
  ])

  const badge       = hero?.badge       || 'Featured Story'
  const title       = hero?.title       || featuredArticle?.title       || 'Exploring the Universe Through Knowledge, Research & Discovery'
  const excerpt     = hero?.excerpt     || featuredArticle?.excerpt     || 'Scientific journalism, live mission tracking, deep-space telemetry, and an educational knowledge engine — all in one independent platform.'
  const category    = hero?.category    || featuredArticle?.article_type || 'Space Intelligence'
  const articleSlug = hero?.articleSlug || featuredArticle?.slug         || ''
  const imageUrl    = hero?.imageUrl    || featuredArticle?.featured_image || ''

  const primaryHref = articleSlug ? articleHref(articleSlug, lang) : articlesListHref(lang)

  return (
    <section
      className="home-hero"
      style={{
        position:   'relative',
        overflow:   'hidden',
        minHeight:  '78vh',
        display:    'flex',
        alignItems: 'center',
        paddingTop: 'var(--nav-height)',
      }}
    >
      {/* Ambient background image */}
      {imageUrl && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: 0.5,
          }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          background: 'var(--hero-scrim)',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '720px', padding: '3rem 0' }}>
          <span className="hero-badge">{badge}</span>
          <h1 style={{ textWrap: 'balance' }}>{title}</h1>
          <p>{excerpt}</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href={primaryHref} className="btn btn-primary">
              {articleSlug ? 'Read Full Story' : 'Read Latest'}
            </Link>
            <Link href="/live" className="btn btn-outline">
              <span
                style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--green)', boxShadow: '0 0 8px var(--green)',
                  display: 'inline-block',
                }}
              />
              View Live Systems
            </Link>
          </div>
          <p
            style={{
              marginTop: '1.5rem', marginBottom: 0,
              fontSize: '0.8rem', color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '1px',
            }}
          >
            {category}
          </p>
        </div>
      </div>
    </section>
  )
}
