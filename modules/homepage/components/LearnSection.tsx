import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { LearnCard }    from './LearnCard'

async function getLearnPreview() {
  const { data, error } = await supabaseAdmin()
    .from('knowledge_articles')
    .select('id, title, slug, excerpt, difficulty_level, icon')
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) return []
  return data || []
}

// Server component — no event handlers here
export async function LearnSection() {
  const topics = await getLearnPreview()

  return (
    <section style={{ padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '0 24px', maxWidth: '1380px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>Knowledge Layer</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Learn Space Science</div>
          </div>
          <Link href="/learn" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.6)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Explore all topics →
          </Link>
        </div>

        {topics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.25)' }}>No articles published yet</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {topics.map(topic => (
            <LearnCard key={topic.id} topic={topic} />
          ))}
        </div>

      </div>
    </section>
  )
}
