'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import katex from 'katex'
import 'katex/dist/katex.min.css'   // self-hosted — bundled with this route, no CDN
import type { KnowledgeArticle, DifficultyLevel } from '@/types/knowledge'

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  beginner:     'var(--green)',
  intermediate: 'var(--gold)',
  advanced:     'var(--red)',
}

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner:     'Beginner',
  intermediate: 'Intermediate',
  advanced:     'Advanced',
}

interface Props {
  article: KnowledgeArticle
}

export function LearnArticlePage({ article }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const diffColor  = DIFFICULTY_COLORS[article.difficultyLevel] ?? 'var(--accent)'
  const diffLabel  = DIFFICULTY_LABELS[article.difficultyLevel] ?? article.difficultyLevel

  useEffect(() => {
    if (!contentRef.current) return

    const renderKaTeX = () => {
      const el = contentRef.current
      if (!el) return

      // Replace block math $$...$$ — must do this on raw text nodes only
      // Walk all <p> elements and replace those that are purely math
      const paragraphs = el.querySelectorAll('p')
      paragraphs.forEach(p => {
        const text = p.textContent || ''
        const blockMatch = text.match(/^\$\$([\s\S]+?)\$\$$/)
        if (blockMatch) {
          try {
            const rendered = katex.renderToString(blockMatch[1].trim(), {
              displayMode: true,
              throwOnError: false,
            })
            const div = document.createElement('div')
            div.className = 'katex-block'
            div.innerHTML = rendered
            p.replaceWith(div)
          } catch { /* keep as-is */ }
        }
      })

      // Replace inline math $...$ in remaining text nodes
      el.querySelectorAll('p, li, h2, h3').forEach(node => {
        if (node.innerHTML.includes('$')) {
          node.innerHTML = node.innerHTML.replace(
            /\$([^\n$]+?)\$/g,
            (_, tex) => {
              try {
                return katex.renderToString(tex.trim(), {
                  displayMode: false,
                  throwOnError: false,
                })
              } catch { return _ }
            }
          )
        }
      })
    }

    renderKaTeX()
  }, [article.content])

  const htmlContent = markdownToHtml(article.content)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px 100px' }}>

      {/* ── Back link ──────────────────────────────────────── */}
      <Link
        href="/learn"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.65)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '40px' }}
      >
        ← Back to Learn
      </Link>

      {/* ── Article header ─────────────────────────────────── */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '40px', lineHeight: 1 }}>{article.icon}</span>
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color:         diffColor,
            background:    `${diffColor}18`,
            border:        `1px solid ${diffColor}40`,
            padding:       '4px 12px',
            borderRadius:  '3px',
          }}>
            {diffLabel}
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: 'var(--white)', margin: '0 0 16px', lineHeight: 1.15 }}>
          {article.title}
        </h1>

        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', lineHeight: 1.75, color: 'rgba(var(--ink),0.9)', margin: '0 0 24px' }}>
          {article.excerpt}
        </p>

        {/* Related topics — improved visibility */}
        {article.relatedTopics.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {article.relatedTopics.map(topic => (
              <span key={topic} style={{
                fontFamily:    'var(--font-mono)',
                fontSize: '12px',
                letterSpacing: '0.08em',
                color:         'rgba(var(--ink),0.7)',
                background:    'rgba(var(--ink),0.07)',
                border:        '1px solid rgba(var(--ink),0.15)',
                padding:       '4px 10px',
                borderRadius:  '4px',
              }}>
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Cover image (when a thumbnail is set) ──────────── */}
      {article.thumbnail && (
        <div style={{ marginBottom: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/7', background: 'var(--surface)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.thumbnail} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* ── Divider ────────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(79,142,247,0.2), transparent)', marginBottom: '48px' }} />

      {/* ── Article content ────────────────────────────────── */}
      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{ fontFamily: 'var(--font-sans)' }}
      />

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
        <Link
          href="/learn"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '8px',
            fontFamily:     'var(--font-mono)',
            fontSize: '11px',
            letterSpacing:  '0.18em',
            textTransform:  'uppercase',
            color:          'var(--accent)',
            textDecoration: 'none',
            padding:        '10px 20px',
            border:         '1px solid rgba(79,142,247,0.25)',
            borderRadius:   '4px',
            background:     'rgba(79,142,247,0.06)',
          }}
        >
          ← All Articles
        </Link>
      </div>

      <style>{`
        .katex-block {
          display:       block;
          text-align:    center;
          margin:        28px 0;
          overflow-x:    auto;
          padding:       20px 16px;
          background:    rgba(var(--ink),0.03);
          border:        1px solid rgba(var(--ink),0.08);
          border-radius: 8px;
        }
        .katex { color: var(--white); font-size: 1.1em; }
        .article-body h2 {
          font-family: var(--font-serif);
          font-size:   clamp(20px, 2.5vw, 26px);
          font-weight: 400;
          color:       #ffffff;
          margin:      44px 0 16px;
          line-height: 1.2;
        }
        .article-body h3 {
          font-family: var(--font-serif);
          font-size:   19px;
          font-weight: 400;
          color:       #ffffff;
          margin:      32px 0 12px;
        }
        .article-body p {
          font-size:   16px;
          line-height: 1.85;
          color:       rgba(var(--ink),0.78);
          margin:      0 0 20px;
        }
        .article-body strong { color: var(--white); font-weight: 600; }
        .article-body em    { color: rgba(var(--ink),0.85); font-style: italic; }
        .article-body ul, .article-body ol { padding-left: 24px; margin: 0 0 20px; }
        .article-body li {
          font-size:     16px;
          line-height:   1.8;
          color:         rgba(var(--ink),0.75);
          margin-bottom: 6px;
        }
        .article-body code {
          font-family:   var(--font-mono);
          font-size:     13px;
          background:    rgba(var(--ink),0.06);
          border:        1px solid rgba(var(--ink),0.1);
          border-radius: 3px;
          padding:       2px 6px;
          color:         var(--accent);
        }
      `}</style>
    </div>
  )
}

// ── Markdown → HTML (strips $$ lines from paragraphs so KaTeX handles them) ──
function markdownToHtml(md: string): string {
  const lines   = md.split('\n')
  const output: string[] = []
  let inList    = false

  for (const raw of lines) {
    const line = raw.trim()

    if (line.startsWith('## ')) {
      if (inList) { output.push('</ul>'); inList = false }
      output.push(`<h2>${inlineFormat(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('### ')) {
      if (inList) { output.push('</ul>'); inList = false }
      output.push(`<h3>${inlineFormat(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { output.push('<ul>'); inList = true }
      output.push(`<li>${inlineFormat(line.slice(2))}</li>`)
      continue
    }
    if (line === '') {
      if (inList) { output.push('</ul>'); inList = false }
      continue
    }
    if (inList) { output.push('</ul>'); inList = false }

    // Block math lines — wrap in <p> with $$ markers intact for useEffect to detect
    if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
      output.push(`<p>${line}</p>`)
      continue
    }

    output.push(`<p>${inlineFormat(line)}</p>`)
  }

  if (inList) output.push('</ul>')
  return `<div class="article-body">${output.join('\n')}</div>`
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>')
}
