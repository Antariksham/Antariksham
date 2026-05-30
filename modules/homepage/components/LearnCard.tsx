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
        style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'border-color 0.2s', height: '100%' }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.18)'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'}
      >
        <div style={{ fontSize: '28px', marginBottom: '16px' }}>{topic.icon || '🔭'}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: diffColor, marginBottom: '10px' }}>
          {diffLabel}
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, lineHeight: 1.3, color: '#ffffff', marginBottom: '10px' }}>
          {topic.title}
        </h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', lineHeight: 1.7, color: 'rgba(240,244,250,0.75)', margin: 0 }}>
          {topic.excerpt}
        </p>
      </div>
    </Link>
  )
}
