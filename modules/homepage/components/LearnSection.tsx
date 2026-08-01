import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { LearnCard }    from './LearnCard'
import { sectionListHref, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'

async function getLearnPreview(lang: LanguageCode) {
  const db = supabaseAdmin()

  let { data, error }: { data: any[] | null; error: any } = await db
    .from('knowledge_articles')
    .select('id, title, slug, excerpt, difficulty_level, icon, thumbnail')
    .order('created_at', { ascending: false })
    .limit(6)

  // Retry without `thumbnail` if the column hasn't been migrated yet.
  if (error && `${error?.message || ''} ${error?.details || ''}`.toLowerCase().includes('thumbnail')) {
    ({ data, error } = await db
      .from('knowledge_articles')
      .select('id, title, slug, excerpt, difficulty_level, icon')
      .order('created_at', { ascending: false })
      .limit(6))
  }

  if (error) return []
  const topics = data || []
  if (lang === DEFAULT_LANGUAGE || topics.length === 0) return topics

  // Overlay the published translation for this language. Tolerant: any failure
  // leaves the English preview cards untouched.
  const { data: tr } = await db
    .from('knowledge_translations')
    .select('knowledge_article_id, title, excerpt')
    .in('knowledge_article_id', topics.map(t => t.id))
    .eq('language_code', lang)
    .eq('is_published', true)
  if (!tr) return topics

  const overlay = new Map((tr as any[]).map(r => [r.knowledge_article_id, r]))
  return topics.map(t => {
    const o = overlay.get(t.id)
    return o ? { ...t, title: o.title, excerpt: o.excerpt ?? t.excerpt } : t
  })
}

export async function LearnSection({ lang = DEFAULT_LANGUAGE }: { lang?: LanguageCode } = {}) {
  const topics = await getLearnPreview(lang)

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="section-head">
        <div>
          <h2 className="section-title">Learn Space Science</h2>
          <span className="section-eyebrow">Knowledge layer</span>
        </div>
        <Link href={sectionListHref('learn', lang)} className="btn btn-outline">Explore all topics</Link>
      </div>

      {topics.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No topics published yet.</p>
      ) : (
        <div className="grid-3">
          {topics.map(topic => (
            <LearnCard key={topic.id} topic={topic} lang={lang} />
          ))}
        </div>
      )}
    </section>
  )
}
