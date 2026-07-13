'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { LearnThumb } from './LearnThumb'
import type { KnowledgeArticleCard, DifficultyLevel } from '@/types/knowledge'

type FilterOption = DifficultyLevel | 'all'

const DIFFICULTY_COLORS: Record<FilterOption, string> = {
  all:          'var(--accent)',
  beginner:     'var(--green)',
  intermediate: 'var(--gold)',
  advanced:     'var(--red)',
}

const DIFFICULTY_LABELS: Record<FilterOption, string> = {
  all:          'All',
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

const FILTERS: FilterOption[] = ['all', 'beginner', 'intermediate', 'advanced']

interface Props {
  articles: KnowledgeArticleCard[]
}

export function LearnPage({ articles }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')

  const filtered = useMemo(() =>
    activeFilter === 'all'
      ? articles
      : articles.filter(a => a.difficultyLevel === activeFilter),
    [articles, activeFilter]
  )

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px 100px' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
          Knowledge Layer
        </div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: 'var(--white)', margin: '0 0 16px', lineHeight: 1.1 }}>
          Learn Space Science
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, maxWidth: '560px', lineHeight: 1.75 }}>
          Deep-dive articles on orbital mechanics, astrophysics, and the mathematics powering space exploration. From beginner introductions to advanced physics.
        </p>
      </div>

      {/* ── Difficulty Filter ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
        {FILTERS.map(level => {
          const active = activeFilter === level
          const color  = DIFFICULTY_COLORS[level]
          return (
            <button
              key={level}
              onClick={() => setActiveFilter(level)}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding:       '7px 16px',
                borderRadius:  '4px',
                border:        `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                background:    active ? `${color}18` : 'transparent',
                color:         active ? color : 'rgba(255,255,255,0.45)',
                cursor:        'pointer',
                transition:    'all 0.15s',
              }}
            >
              {DIFFICULTY_LABELS[level]}
            </button>
          )
        })}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginLeft: '8px' }}>
          {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
        </span>
      </div>

      {/* ── Article Grid ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em' }}>
          NO ARTICLES YET
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

    </div>
  )
}

function ArticleCard({ article }: { article: KnowledgeArticleCard }) {
  const diffColor = DIFFICULTY_COLORS[article.difficultyLevel] ?? 'var(--accent)'
  const diffLabel = DIFFICULTY_LABELS[article.difficultyLevel] ?? article.difficultyLevel

  return (
    <Link href={`/learn/${article.slug}`} className="card">
      <LearnThumb icon={article.icon} seed={article.slug} image={article.thumbnail} />
      <div className="card-body">
        {/* Difficulty + featured badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.6rem' }}>
          <span className="card-category" style={{ color: diffColor, margin: 0 }}>{diffLabel}</span>
          {article.featured && (
            <span className="card-category" style={{ color: 'var(--gold)', margin: 0 }}>· Featured</span>
          )}
        </div>

        <h3 className="card-title">{article.title}</h3>
        {article.excerpt && <p className="card-excerpt">{article.excerpt}</p>}

        {/* Related topics */}
        {article.relatedTopics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
            {article.relatedTopics.slice(0, 3).map(topic => (
              <span key={topic} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '20px' }}>
                {topic}
              </span>
            ))}
          </div>
        )}

        <div className="card-meta">
          <span style={{ color: diffColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontSize: '0.72rem' }}>Read article →</span>
        </div>
      </div>
    </Link>
  )
}
