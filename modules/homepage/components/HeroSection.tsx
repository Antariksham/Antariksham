import Link from 'next/link'
import { supabaseAdmin }       from '@/lib/supabase'
import { getHeroConfigPublic } from '@/modules/admin/services/adminHomepage'

async function getFeaturedArticle() {
  const { data, error } = await supabaseAdmin()
    .from('articles')
    .select('title, slug, excerpt, reading_time, article_type, featured_image')
    .eq('featured', true)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}

export async function HeroSection() {
  const [hero, featuredArticle] = await Promise.all([
    getHeroConfigPublic(),
    getFeaturedArticle(),
  ])

  const badge       = hero?.badge       || 'Featured Story'
  const title       = hero?.title       || featuredArticle?.title       || "Cassini's Legacy: New Data Reveals Ocean Activity Deep Within Enceladus"
  const excerpt     = hero?.excerpt     || featuredArticle?.excerpt     || "Researchers reanalysing Cassini's final passes have found evidence of active hydrothermal vents at Enceladus's seafloor."
  const readTime    = hero?.readTime    || (featuredArticle?.reading_time ? `${featuredArticle.reading_time} min read` : '10 min read')
  const category    = hero?.category    || featuredArticle?.article_type || 'Research'
  const articleSlug = hero?.articleSlug || featuredArticle?.slug         || ''
  const imageUrl    = hero?.imageUrl    || featuredArticle?.featured_image || ''

  const cardHref = articleSlug ? `/news/${articleSlug}` : '/news'

  return (
    <section style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '60px' }}>
      <div style={{ maxWidth: '1380px', margin: '0 auto', width: '100%', padding: '60px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>

          {/* LEFT */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '24px', height: '1px', background: '#3b9eff' }} />
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#3b9eff' }}>
                Independent Space Intelligence Platform
              </span>
            </div>
            <h1 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 400, lineHeight: 1.1, marginBottom: '24px', color: '#ffffff' }}>
              Exploring the Universe Through{' '}
              <em style={{ fontStyle: 'italic', color: '#3b9eff', fontWeight: 300 }}>Knowledge,</em>{' '}
              Research &amp; Discovery
            </h1>
            <p style={{ fontSize: '16px', fontWeight: 400, lineHeight: 1.75, color: 'rgba(240,244,250,0.8)', marginBottom: '36px', maxWidth: '520px' }}>
              Scientific journalism, live mission tracking, deep-space telemetry, and an educational knowledge engine — all in one independent platform.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Link href="/news" style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 28px', background: '#3b9eff', color: '#07090c', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '5px', fontFamily: 'DM Mono, monospace' }}>
                Read Latest
              </Link>
              <Link href="/live" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 24px', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(240,244,250,0.85)', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '5px', fontFamily: 'DM Mono, monospace' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d897', boxShadow: '0 0 8px #34d897', display: 'inline-block' }} />
                View Live Systems
              </Link>
            </div>
          </div>

          {/* RIGHT — Featured card */}
          <Link href={cardHref} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>

              {/* Card image — real photo if available, fallback illustration */}
              <div style={{ height: '220px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, #080f20 0%, #0c1830 50%, #070e1c 100%)' }}>
                {imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt={title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  /* Fallback planet illustration */
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 50% at 65% 40%, rgba(59,158,255,0.18) 0%, transparent 65%)' }} />
                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <div style={{ position: 'absolute', width: '180px', height: '36px', borderRadius: '50%', border: '1.5px solid rgba(201,169,110,0.35)', transform: 'rotateX(72deg)', top: '50%', left: '50%', marginLeft: '-90px', marginTop: '-18px' }} />
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle at 36% 34%, #1e4080, #0c2044 55%, #060f22)', boxShadow: 'inset -18px -18px 36px rgba(0,0,0,0.9), inset 8px 8px 24px rgba(59,158,255,0.18)' }} />
                    </div>
                  </div>
                )}
                <div style={{ position: 'absolute', top: '14px', left: '14px', fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '3px', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(59,158,255,0.3)', color: '#3b9eff', backdropFilter: 'blur(4px)' }}>
                  Featured Story
                </div>
              </div>

              {/* Card content */}
              <div style={{ padding: '24px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a96e', marginBottom: '10px' }}>
                  {badge}
                </div>
                <h3 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '20px', fontWeight: 400, lineHeight: 1.3, color: '#ffffff', marginBottom: '10px' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(240,244,250,0.75)', marginBottom: '16px' }}>
                  {excerpt}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'rgba(240,244,250,0.45)' }}>
                    {[readTime, category].filter(Boolean).join(' · ')}
                  </span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', color: '#3b9eff', fontWeight: 500 }}>
                    Read full story →
                  </span>
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </section>
  )
}
