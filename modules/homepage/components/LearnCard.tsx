import Link from 'next/link'
import { LearnThumb } from '@/modules/learn/components/LearnThumb'

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
  thumbnail?:       string | null
}

export function LearnCard({ topic }: { topic: Topic }) {
  const diffColor = DIFFICULTY_COLORS[topic.difficulty_level] || 'var(--accent)'
  const diffLabel = DIFFICULTY_LABELS[topic.difficulty_level] || topic.difficulty_level

  return (
    <Link href={`/learn/${topic.slug}`} className="card">
      <LearnThumb icon={topic.icon} seed={topic.slug} image={topic.thumbnail} />
      <div className="card-body">
        <p className="card-category" style={{ color: diffColor }}>{diffLabel}</p>
        <h3 className="card-title">{topic.title}</h3>
        {topic.excerpt && <p className="card-excerpt">{topic.excerpt}</p>}
      </div>
    </Link>
  )
}
