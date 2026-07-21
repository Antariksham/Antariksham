'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { timeAgo } from '@/lib/utils'
import type {
  SearchResults,
  SearchArticleResult,
  SearchMissionResult,
  SearchLearnResult,
} from '@/modules/search/services/search'

// ── Constants ─────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, { color: string; bg: string }> = {
  beginner:     { color: '#2ecc71', bg: 'rgba(46,204,113,0.10)' },
  intermediate: { color: '#f39c12', bg: 'rgba(243,156,18,0.10)' },
  advanced:     { color: '#e74c3c', bg: 'rgba(231,76,60,0.10)' },
}

const STATUS_COLORS: Record<string, string> = {
  active:         '#2ecc71',
  upcoming:       '#4f8ef7',
  completed:      'rgba(var(--ink),0.45)',
  failed:         '#e74c3c',
  'in-development': '#f39c12',
  cancelled:      '#e74c3c',
}

const ARTICLE_TYPE_LABELS: Record<string, string> = {
  'breaking-news':      'Breaking',
  analysis:             'Analysis',
  editorial:            'Editorial',
  'mission-update':     'Mission',
  'research-breakdown': 'Research',
  explainer:            'Explainer',
  guide:                'Guide',
}

// ── Sub-components ────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color:         'var(--accent)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily:  'var(--font-mono)',
        fontSize: '11px',
        color:       'rgba(var(--ink),0.55)',
        background:  'rgba(var(--ink),0.06)',
        borderRadius:'4px',
        padding:     '1px 7px',
      }}>
        {count}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(var(--ink),0.07)' }} />
    </div>
  )
}

function ArticleCard({ result }: { result: SearchArticleResult }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={`/articles/${result.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   hovered ? 'rgba(var(--ink),0.03)' : 'transparent',
          border:       `1px solid ${hovered ? 'rgba(var(--ink),0.14)' : 'rgba(var(--ink),0.07)'}`,
          borderRadius: '10px',
          padding:      '18px 20px',
          transition:   'all 0.18s',
          cursor:       'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {result.category && (
              <div style={{
                fontFamily:    'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color:         'var(--accent)',
                marginBottom:  '6px',
              }}>
                {result.category}
              </div>
            )}
            <div style={{
              fontFamily:  'var(--font-sans)',
              fontSize: '17px',
              fontWeight:  400,
              lineHeight:  1.3,
              color:       'var(--white)',
              marginBottom:'6px',
              overflow:    'hidden',
              display:     '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {result.title}
            </div>
            {result.excerpt && (
              <p style={{
                fontFamily:  'var(--font-sans)',
                fontSize: '15px',
                lineHeight:  1.75,
                color:       'rgba(var(--ink),0.9)',
                overflow:    'hidden',
                display:     '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {result.excerpt}
              </p>
            )}
          </div>
          <span style={{
            flexShrink:    0,
            fontFamily:    'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         'rgba(var(--ink),0.6)',
            background:    'rgba(var(--ink),0.06)',
            borderRadius:  '4px',
            padding:       '3px 8px',
            whiteSpace:    'nowrap',
          }}>
            {ARTICLE_TYPE_LABELS[result.articleType] || 'Article'}
          </span>
        </div>
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '12px',
          marginTop:     '12px',
          paddingTop:    '12px',
          borderTop:     '1px solid rgba(var(--ink),0.06)',
          fontFamily:    'var(--font-mono)',
          fontSize: '11px',
          color:         'rgba(var(--ink),0.55)',
        }}>
          {result.publishedAt && <span>{timeAgo(result.publishedAt)}</span>}
          <span>{result.readingTime} min read</span>
        </div>
      </div>
    </Link>
  )
}

function MissionCard({ result }: { result: SearchMissionResult }) {
  const [hovered, setHovered] = useState(false)
  const statusColor = STATUS_COLORS[result.status] || 'rgba(var(--ink),0.45)'
  return (
    <Link href={`/missions/${result.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   hovered ? 'rgba(var(--ink),0.03)' : 'transparent',
          border:       `1px solid ${hovered ? 'rgba(var(--ink),0.14)' : 'rgba(var(--ink),0.07)'}`,
          borderRadius: '10px',
          padding:      '18px 20px',
          transition:   'all 0.18s',
          cursor:       'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {result.agency && (
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color:         'var(--gold)',
                }}>
                  {result.agency}
                </span>
              )}
              {result.destination && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color:      'rgba(var(--ink),0.55)',
                }}>
                  → {result.destination}
                </span>
              )}
            </div>
            <div style={{
              fontFamily:  'var(--font-sans)',
              fontSize: '17px',
              fontWeight:  400,
              lineHeight:  1.3,
              color:       'var(--white)',
              marginBottom:'6px',
            }}>
              {result.name}
            </div>
            {result.description && (
              <p style={{
                fontFamily:      'var(--font-sans)',
                fontSize: '15px',
                lineHeight:      1.75,
                color:           'rgba(var(--ink),0.9)',
                overflow:        'hidden',
                display:         '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {result.description}
              </p>
            )}
          </div>
          <span style={{
            flexShrink:    0,
            fontFamily:    'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color:         statusColor,
            background:    `${statusColor}18`,
            borderRadius:  '4px',
            padding:       '3px 8px',
            whiteSpace:    'nowrap',
          }}>
            {result.status.replace(/-/g, ' ')}
          </span>
        </div>
      </div>
    </Link>
  )
}

function LearnCard({ result }: { result: SearchLearnResult }) {
  const [hovered, setHovered] = useState(false)
  const diff = DIFFICULTY_COLORS[result.difficultyLevel] || DIFFICULTY_COLORS.beginner
  return (
    <Link href={`/learn/${result.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background:   hovered ? 'rgba(var(--ink),0.03)' : 'transparent',
          border:       `1px solid ${hovered ? 'rgba(var(--ink),0.14)' : 'rgba(var(--ink),0.07)'}`,
          borderRadius: '10px',
          padding:      '18px 20px',
          transition:   'all 0.18s',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'flex-start',
          gap:          '14px',
        }}
      >
        <span style={{ fontSize: '22px', flexShrink: 0, lineHeight: 1 }}>{result.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily:  'var(--font-sans)',
            fontSize: '17px',
            fontWeight:  400,
            lineHeight:  1.3,
            color:       'var(--white)',
            marginBottom:'6px',
          }}>
            {result.title}
          </div>
          {result.excerpt && (
            <p style={{
              fontFamily:      'var(--font-sans)',
              fontSize: '15px',
              lineHeight:      1.75,
              color:           'rgba(var(--ink),0.9)',
              overflow:        'hidden',
              display:         '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {result.excerpt}
            </p>
          )}
        </div>
        <span style={{
          flexShrink:    0,
          fontFamily:    'var(--font-mono)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         diff.color,
          background:    diff.bg,
          borderRadius:  '4px',
          padding:       '3px 8px',
          whiteSpace:    'nowrap',
        }}>
          {result.difficultyLevel}
        </span>
      </div>
    </Link>
  )
}

// ── Empty / idle states ───────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>🔭</div>
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize: '12px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color:         'rgba(var(--ink),0.55)',
        marginBottom:  '8px',
      }}>
        No results found
      </div>
      <p style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '14px',
        color:      'rgba(var(--ink),0.6)',
      }}>
        Nothing matched &ldquo;{query}&rdquo; — try different keywords
      </p>
    </div>
  )
}

function IdleState() {
  const suggestions = ['Voyager', 'Black hole', 'Mars', 'ISRO', 'JWST', 'Artemis', 'Orbital mechanics']
  return (
    <div style={{ padding: '48px 0' }}>
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color:         'rgba(var(--ink),0.5)',
        marginBottom:  '20px',
      }}>
        Try searching for
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {suggestions.map(s => (
          <button
            key={s}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize: '12px',
              letterSpacing: '0.08em',
              color:         'rgba(var(--ink),0.55)',
              background:    'rgba(var(--ink),0.05)',
              border:        '1px solid rgba(var(--ink),0.09)',
              borderRadius:  '6px',
              padding:       '6px 14px',
              cursor:        'pointer',
            }}
            // handled via data-attr to avoid stale closure
            data-query={s}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

export function SearchPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [inputValue, setInputValue]   = useState(initialQuery)
  const [results, setResults]         = useState<SearchResults | null>(null)
  const [loading, setLoading]         = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // useRef for debounce timer — avoids stale closures
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)

  // The fetch function — kept stable via useRef pattern
  const fetchRef = useRef(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults(null)
      setHasSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      setResults(data)
      setHasSearched(true)
    } catch {
      setResults({ articles: [], missions: [], learn: [], total: 0, query: q })
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  })

  // Debounced input handler
  const handleInput = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      // Update URL query param without navigation
      const params = new URLSearchParams(window.location.search)
      if (value.trim()) {
        params.set('q', value.trim())
      } else {
        params.delete('q')
      }
      router.replace(`/search?${params.toString()}`, { scroll: false })
      fetchRef.current(value)
    }, 350)
  }

  // Run search on mount if URL has ?q=
  useEffect(() => {
    if (initialQuery) {
      fetchRef.current(initialQuery)
    }
    // Auto-focus input
    inputRef.current?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Suggestion chip click — delegate via container click
  const handleSuggestionClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest('button[data-query]')
    if (!btn) return
    const q = (btn as HTMLButtonElement).dataset.query || ''
    setInputValue(q)
    fetchRef.current(q)
  }, [])

  const showIdle   = !hasSearched && !loading
  const showEmpty  = hasSearched && results?.total === 0
  const showResults = hasSearched && results && results.total > 0

  return (
    <div style={{ minHeight: '100vh', paddingTop: '64px' }}>

      {/* ── Search header ─────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(var(--ink),0.08)',
        padding:      '48px 24px 32px',
        background:   'linear-gradient(180deg, rgba(79,142,247,0.04) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          <div style={{
            fontFamily:    'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color:         'var(--accent)',
            marginBottom:  '12px',
          }}>
            Search
          </div>

          <h1 style={{
            fontFamily:   'var(--font-sans)',
            fontSize:     'clamp(28px, 5vw, 48px)',
            fontWeight:   300,
            color:        'var(--white)',
            marginBottom: '32px',
            lineHeight:   1.1,
          }}>
            Search Antariksham
          </h1>

          {/* Input */}
          <div style={{ position: 'relative' }}>
            <svg
              width="18" height="18"
              viewBox="0 0 24 24" fill="none"
              stroke="rgba(var(--ink),0.35)" strokeWidth="2"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => handleInput(e.target.value)}
              placeholder="Articles, missions, space science…"
              style={{
                width:        '100%',
                padding:      '16px 48px 16px 46px',
                background:   'rgba(var(--ink),0.05)',
                border:       '1px solid rgba(var(--ink),0.14)',
                borderRadius: '10px',
                color:        'var(--white)',
                fontFamily:   'var(--font-sans)',
                fontSize: '17px',
                outline:      'none',
                boxSizing:    'border-box',
                transition:   'border-color 0.2s',
              }}
              onFocus={e  => (e.target.style.borderColor = 'rgba(79,142,247,0.5)')}
              onBlur={e   => (e.target.style.borderColor = 'rgba(var(--ink),0.14)')}
            />

            {/* Clear button */}
            {inputValue && (
              <button
                onClick={() => { setInputValue(''); setResults(null); setHasSearched(false); router.replace('/search', { scroll: false }); inputRef.current?.focus() }}
                style={{
                  position:   'absolute',
                  right:      '14px',
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  background: 'none',
                  border:     'none',
                  color:      'rgba(var(--ink),0.6)',
                  cursor:     'pointer',
                  padding:    '4px',
                  display:    'flex',
                  alignItems: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Result count or loading */}
          <div style={{
            marginTop:  '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color:      'rgba(var(--ink),0.55)',
            minHeight:  '18px',
          }}>
            {loading && 'Searching…'}
            {!loading && showResults && `${results!.total} result${results!.total !== 1 ? 's' : ''} for "${results!.query}"`}
          </div>

        </div>
      </div>

      {/* ── Results area ──────────────────────────────────── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Idle state — suggestions */}
        {showIdle && (
          <div onClick={handleSuggestionClick}>
            <IdleState />
          </div>
        )}

        {/* Empty state */}
        {showEmpty && <EmptyState query={results!.query} />}

        {/* Results grouped by type */}
        {showResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* Articles */}
            {results!.articles.length > 0 && (
              <div>
                <SectionHeader label="News & Articles" count={results!.articles.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {results!.articles.map(r => <ArticleCard key={r.id} result={r} />)}
                </div>
              </div>
            )}

            {/* Missions */}
            {results!.missions.length > 0 && (
              <div>
                <SectionHeader label="Missions" count={results!.missions.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {results!.missions.map(r => <MissionCard key={r.id} result={r} />)}
                </div>
              </div>
            )}

            {/* Learn */}
            {results!.learn.length > 0 && (
              <div>
                <SectionHeader label="Learn" count={results!.learn.length} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {results!.learn.map(r => <LearnCard key={r.id} result={r} />)}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
