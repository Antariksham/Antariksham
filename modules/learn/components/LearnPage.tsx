'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { LearnThumb } from './LearnThumb'
import { sectionHref, DEFAULT_LANGUAGE, type LanguageCode } from '@/lib/i18n'
import { strings, tCount, type UIKey } from '@/lib/ui'
import type { KnowledgeArticleCard, DifficultyLevel } from '@/types/knowledge'

type FilterOption = DifficultyLevel | 'all'

const DIFFICULTY_COLORS: Record<FilterOption, string> = {
  all:          'var(--accent)',
  beginner:     'var(--green)',
  intermediate: 'var(--gold)',
  advanced:     'var(--red)',
}

const DIFFICULTY_KEYS: Record<FilterOption, UIKey> = {
  all:          'learn.filterAll',
  beginner:     'learn.beginner',
  intermediate: 'learn.intermediate',
  advanced:     'learn.advanced',
}

const FILTERS: FilterOption[] = ['all', 'beginner', 'intermediate', 'advanced']

interface Props {
  articles: KnowledgeArticleCard[]
  /** Language of the listing — English by default; 'hi' for the /hi listing. */
  lang?: LanguageCode
}

export function LearnPage({ articles, lang = DEFAULT_LANGUAGE }: Props) {
  const ui = strings(lang)
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px' }}>
          {ui('learn.eyebrow')}
        </div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, color: 'var(--white)', margin: '0 0 16px', lineHeight: 1.1 }}>
          {ui('learn.title')}
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', color: 'rgba(var(--ink),0.9)', margin: 0, maxWidth: '560px', lineHeight: 1.75 }}>
          {ui('learn.lede')}
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
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding:       '7px 16px',
                borderRadius:  '4px',
                border:        `1px solid ${active ? color : 'rgba(var(--ink),0.1)'}`,
                background:    active ? `${color}18` : 'transparent',
                color:         active ? color : 'rgba(var(--ink),0.45)',
                cursor:        'pointer',
                transition:    'all 0.15s',
              }}
            >
              {ui(DIFFICULTY_KEYS[level])}
            </button>
          )
        })}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(var(--ink),0.55)', alignSelf: 'center', marginLeft: '8px' }}>
          {tCount(filtered.length, 'learn.countOne', 'learn.countMany', lang)}
        </span>
      </div>

      {/* ── Article Grid ────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(var(--ink),0.55)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em' }}>
          {ui('learn.empty')}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(article => (
            <ArticleCard key={article.id} article={article} lang={lang} ui={ui} />
          ))}
        </div>
      )}

    </div>
  )
}

function ArticleCard({ article, lang, ui }: {
  article: KnowledgeArticleCard; lang: LanguageCode; ui: ReturnType<typeof strings>
}) {
  const diffColor = DIFFICULTY_COLORS[article.difficultyLevel] ?? 'var(--accent)'
  const diffKey   = DIFFICULTY_KEYS[article.difficultyLevel]
  const diffLabel = diffKey ? ui(diffKey) : article.difficultyLevel

  return (
    <Link href={sectionHref('learn', article.slug, lang)} className="card">
      <LearnThumb icon={article.icon} seed={article.slug} image={article.thumbnail} />
      <div className="card-body">
        {/* Difficulty + featured badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.6rem' }}>
          <span className="card-category" style={{ color: diffColor, margin: 0 }}>{diffLabel}</span>
          {article.featured && (
            <span className="card-category" style={{ color: 'var(--gold)', margin: 0 }}>· {ui('learn.featured')}</span>
          )}
        </div>

        <h3 className="card-title" lang={lang}>{article.title}</h3>
        {article.excerpt && <p className="card-excerpt" lang={lang}>{article.excerpt}</p>}

        {/* Related topics */}
        {article.relatedTopics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
            {article.relatedTopics.slice(0, 3).map(topic => (
              <span key={topic} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(var(--ink),0.05)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '20px' }}>
                {topic}
              </span>
            ))}
          </div>
        )}

        <div className="card-meta">
          <span style={{ color: diffColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontSize: '0.78rem' }}>{ui('learn.readArticle')}</span>
        </div>
      </div>
    </Link>
  )
}
