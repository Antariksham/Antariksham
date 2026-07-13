'use client'

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
    <Link href={`/learn/${topic.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s', height: '100%' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.18)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = 'var(--card-shadow)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none' }}
      >
        <div style={{ fontSize: '28px', marginBottom: '16px' }}>{topic.icon || '🔭'}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: diffColor, marginBottom: '10px' }}>
          {diffLabel}
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, lineHeight: 1.3, color: '#ffffff', marginBottom: '10px' }}>
          {topic.title}
        </h3>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', lineHeight: 1.75, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
          {topic.excerpt}
        </p>
      </div>
    </Link>
  )
}
