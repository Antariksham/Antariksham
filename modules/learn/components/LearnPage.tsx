'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
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
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 300, color: 'var(--white)', margin: '0 0 16px', lineHeight: 1.1 }}>
          Learn Space Science
        </h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'rgba(240,244,250,0.9)', margin: 0, maxWidth: '560px', lineHeight: 1.75 }}>
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
                color:         active ? color : 'rgba(240,244,250,0.45)',
                cursor:        'pointer',
                transition:    'all 0.15s',
              }}
            >
              {DIFFICULTY_LABELS[level]}
            </button>
          )
        })}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(240,244,250,0.3)', alignSelf: 'center', marginLeft: '8px' }}>
          {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
        </span>
      </div>

      {/* ── Article Grid ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(240,244,250,0.3)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em' }}>
          NO ARTICLES YET
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
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
    <Link href={`/learn/${article.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background:   'var(--surface)',
          border:       '1px solid var(--border)',
          borderRadius: '12px',
          padding:      '28px',
          height:       '100%',
          transition:   'border-color 0.2s, transform 0.2s',
          cursor:       'pointer',
          position:     'relative',
          overflow:     'hidden',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)'
          ;(e.currentTarget as HTMLDivElement).style.transform  = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLDivElement).style.transform  = 'translateY(0)'
        }}
      >
        {/* Top accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${diffColor}, transparent)` }} />

        {/* Icon */}
        <div style={{ fontSize: '32px', marginBottom: '20px', lineHeight: 1 }}>{article.icon}</div>

        {/* Difficulty + featured badges */}
        <div style={{ marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color:         diffColor,
            background:    `${diffColor}18`,
            border:        `1px solid ${diffColor}40`,
            padding:       '3px 10px',
            borderRadius:  '3px',
          }}>
            {diffLabel}
          </span>
          {article.featured && (
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '10px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color:         'var(--gold)',
              background:    'var(--gold-dim)',
              border:        '1px solid rgba(201,169,110,0.4)',
              padding:       '3px 10px',
              borderRadius:  '3px',
            }}>
              Featured
            </span>
          )}
        </div>

        {/* Title */}
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, lineHeight: 1.3, color: 'var(--white)', margin: '0 0 12px' }}>
          {article.title}
        </h2>

        {/* Excerpt */}
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', lineHeight: 1.75, color: 'rgba(240,244,250,0.9)', margin: '0 0 20px' }}>
          {article.excerpt}
        </p>

        {/* Related topics — improved visibility */}
        {article.relatedTopics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {article.relatedTopics.slice(0, 3).map(topic => (
              <span key={topic} style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.08em',
                color:         'rgba(240,244,250,0.65)',
                background:    'rgba(255,255,255,0.06)',
                border:        '1px solid rgba(255,255,255,0.12)',
                padding:       '3px 9px',
                borderRadius:  '4px',
              }}>
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* Read CTA */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: diffColor }}>
          Read Article →
        </div>
      </div>
    </Link>
  )
}
