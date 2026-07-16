import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { LearnCard }    from './LearnCard'

async function getLearnPreview() {
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
  return data || []
}

export async function LearnSection() {
  const topics = await getLearnPreview()

  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="section-head">
        <div>
          <h2 className="section-title">Learn Space Science</h2>
          <span className="section-eyebrow">Knowledge layer</span>
        </div>
        <Link href="/learn" className="btn btn-outline">Explore all topics</Link>
      </div>

      {topics.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No topics published yet.</p>
      ) : (
        <div className="grid-3">
          {topics.map(topic => (
            <LearnCard key={topic.id} topic={topic} />
          ))}
        </div>
      )}
    </section>
  )
}
