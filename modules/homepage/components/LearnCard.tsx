import Link from 'next/link'

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     'var(--green)',
  intermediate: 'var(--gold)',
  advanced:     'var(--red)',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

interface Topic {
  id:               string
  title:            string
  slug:             string
  excerpt:          string
  difficulty_level: string
  icon:             string
}

export function LearnCard({ topic }: { topic: Topic }) {
  const diffColor = DIFFICULTY_COLORS[topic.difficulty_level] || 'var(--accent)'
  const diffLabel = DIFFICULTY_LABELS[topic.difficulty_level] || topic.difficulty_level

  return (
    <Link href={`/learn/${topic.slug}`} className="card">
      <div className="card-body">
        <div style={{ fontSize: '28px', marginBottom: '14px' }}>{topic.icon || '🔭'}</div>
        <p className="card-category" style={{ color: diffColor }}>{diffLabel}</p>
        <h3 className="card-title">{topic.title}</h3>
        {topic.excerpt && <p className="card-excerpt">{topic.excerpt}</p>}
      </div>
    </Link>
  )
}
