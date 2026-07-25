'use client'

import { useMemo, useState } from 'react'
import { X, Plus, Trash2, BookMarked, RotateCcw, AlertTriangle } from 'lucide-react'
import {
  CITATION_TYPES, CITATION_STYLES, TYPE_FIELDS, FIELD_LABELS, emptyCitation,
  type Citation, type CitationType, type CitationStyle, type FieldKey,
} from './citationTypes'
import {
  formatCitation, validateCitation, citationKey, inlineMarker, buildReferenceList, duplicateKeys,
} from './formatCitation'
import { loadLibrary, upsertLibrary, removeFromLibrary } from './citationLibrary'

/**
 * Citation Manager — Phase 2, Feature 7.
 * A modal launched from the editor toolbar. Build a structured citation (type +
 * fields), see it live-formatted in the chosen style, validate it, then insert a
 * numbered inline marker + (re)generate the article's References section. A
 * browser-local library lets citations be reused. The editor owns the DOM ops;
 * this component owns the form, the article's citation list and the library.
 */
export function CitationManager({
  initialStyle, hydrate, onInsertInline, onSetReferences, onClose,
}: {
  initialStyle: CitationStyle
  hydrate: () => Citation[]
  onInsertInline: (html: string) => void
  onSetReferences: (html: string) => void
  onClose: () => void
}) {
  const [style, setStyle] = useState<CitationStyle>(initialStyle)
  const [docCitations, setDoc] = useState<Citation[]>(() => hydrate())
  const [library, setLibrary] = useState<Citation[]>(() => loadLibrary())
  const [draft, setDraft] = useState<Citation>(() => emptyCitation('journal'))
  const [search, setSearch] = useState('')

  const issues = useMemo(() => validateCitation(draft), [draft])
  const errors = issues.filter(i => i.level === 'error')
  const dupInDoc = useMemo(
    () => docCitations.some(c => citationKey(c) === citationKey(draft)) && (draft.title.trim() || draft.custom.trim()),
    [docCitations, draft],
  )
  const dupKeys = useMemo(() => duplicateKeys(docCitations), [docCitations])
  const preview = useMemo(() => formatCitation(draft, style), [draft, style])

  const fields = TYPE_FIELDS[draft.type].filter(f => f !== 'authors')

  const set = (patch: Partial<Citation>) => setDraft(d => ({ ...d, ...patch }))
  const genId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

  function rebuild(list: Citation[], s: CitationStyle) { onSetReferences(buildReferenceList(list, s)) }

  function changeStyle(s: CitationStyle) { setStyle(s); rebuild(docCitations, s) }

  /** Add a citation to the article: dedupe by key, insert the numbered inline
   *  marker at the caret and regenerate the References section. */
  function addToArticle(base: Citation) {
    const c: Citation = { ...base, id: base.id || genId() }
    let next = docCitations
    let idx = docCitations.findIndex(x => citationKey(x) === citationKey(c))
    if (idx < 0) { next = [...docCitations, c]; idx = next.length - 1; setDoc(next) }
    onInsertInline(inlineMarker(idx + 1))
    rebuild(next, style)
    setLibrary(upsertLibrary(c))
  }

  function removeFromArticle(id: string) {
    const next = docCitations.filter(c => c.id !== id)
    setDoc(next)
    rebuild(next, style)
  }

  const canAdd = draft.type && (draft.title.trim() || draft.custom.trim()) && errors.length === 0
  const filteredLib = library.filter(c =>
    !search.trim() || `${c.title} ${c.authors.join(' ')} ${c.container} ${c.year}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="cite-modal" role="dialog" aria-modal="true" aria-label="Citations and references">
      <div className="cite-scrim" onClick={onClose} />
      <div className="cite-panel">
        <div className="cite-head">
          <span className="cite-title"><BookMarked size={16} aria-hidden /> Citations &amp; References</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.6)' }}>Style</label>
            <select className="cite-input" value={style} onChange={e => changeStyle(e.target.value as CitationStyle)} style={{ width: 'auto' }}>
              {CITATION_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button type="button" className="cite-icon" onClick={onClose} aria-label="Close"><X size={16} /></button>
          </div>
        </div>

        <div className="cite-body">
          {/* ── New citation form ── */}
          <section className="cite-col">
            <h4 className="cite-h">New citation</h4>
            <label className="cite-label">Type</label>
            <select className="cite-input" value={draft.type} onChange={e => {
              const type = e.target.value as CitationType
              setDraft(d => ({ ...emptyCitation(type), authors: d.authors, id: d.id }))
            }}>
              {CITATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            <label className="cite-label">{FIELD_LABELS.authors} <span className="cite-hint">(one per line, “Last, First”)</span></label>
            <textarea className="cite-input" rows={2} value={draft.authors.join('\n')}
              onChange={e => set({ authors: e.target.value.split('\n') })} placeholder={'Smith, John M.\nNASA'} />

            {fields.map(f => (
              <FieldInput key={f} k={f} value={draft[f] as string} onChange={v => set({ [f]: v } as Partial<Citation>)} />
            ))}

            <label className="cite-label">Custom override <span className="cite-hint">(used when style = Custom)</span></label>
            <textarea className="cite-input" rows={2} value={draft.custom} onChange={e => set({ custom: e.target.value })} placeholder="Verbatim citation text…" />

            {/* Validation */}
            {(issues.length > 0 || dupInDoc) && (
              <ul className="cite-issues">
                {issues.map((i, k) => (
                  <li key={k} className={i.level === 'error' ? 'is-error' : 'is-warn'}>
                    <AlertTriangle size={12} aria-hidden /> {i.message}
                  </li>
                ))}
                {dupInDoc && <li className="is-warn"><AlertTriangle size={12} aria-hidden /> Already cited in this article — adding will reuse its number</li>}
              </ul>
            )}

            {/* Live preview */}
            <label className="cite-label">Preview · {CITATION_STYLES.find(s => s.value === style)?.label}</label>
            <div className="cite-preview">
              {preview
                ? <span dangerouslySetInnerHTML={{ __html: preview }} />
                : <span style={{ opacity: 0.5 }}>Fill in the fields to preview…</span>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" className="cite-btn cite-btn--primary" disabled={!canAdd} onClick={() => { addToArticle(draft); setDraft(emptyCitation(draft.type)) }}>
                <Plus size={14} /> Add to article
              </button>
              <button type="button" className="cite-btn" onClick={() => setDraft(emptyCitation(draft.type))}>
                <RotateCcw size={13} /> Clear
              </button>
            </div>
          </section>

          {/* ── This article + library ── */}
          <section className="cite-col">
            <h4 className="cite-h">In this article <span className="cite-count">{docCitations.length}</span></h4>
            {docCitations.length === 0 && <p className="cite-empty">No citations yet. Build one on the left and add it.</p>}
            <ol className="cite-list">
              {docCitations.map((c, i) => (
                <li key={c.id} className={dupKeys.includes(citationKey(c)) ? 'is-dup' : ''}>
                  <span className="cite-num">{i + 1}</span>
                  <span className="cite-doc-body" dangerouslySetInnerHTML={{ __html: formatCitation(c, style) }} />
                  <span className="cite-row-actions">
                    <button type="button" className="cite-icon" title="Edit in form" onClick={() => setDraft({ ...c })}><BookMarked size={13} /></button>
                    <button type="button" className="cite-icon" title="Remove from article" onClick={() => removeFromArticle(c.id)}><Trash2 size={13} /></button>
                  </span>
                </li>
              ))}
            </ol>

            <h4 className="cite-h" style={{ marginTop: 18 }}>Library <span className="cite-count">{library.length}</span></h4>
            <input className="cite-input" placeholder="Search the library…" value={search} onChange={e => setSearch(e.target.value)} />
            <ul className="cite-list cite-lib">
              {filteredLib.slice(0, 60).map(c => (
                <li key={c.id}>
                  <span className="cite-doc-body" dangerouslySetInnerHTML={{ __html: formatCitation(c, style) }} />
                  <span className="cite-row-actions">
                    <button type="button" className="cite-btn cite-btn--sm" onClick={() => addToArticle(c)}><Plus size={12} /> Cite</button>
                    <button type="button" className="cite-icon" title="Remove from library" onClick={() => setLibrary(removeFromLibrary(c.id))}><Trash2 size={13} /></button>
                  </span>
                </li>
              ))}
              {library.length === 0 && <li className="cite-empty" style={{ display: 'block' }}>Saved citations appear here for reuse.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

function FieldInput({ k, value, onChange }: { k: FieldKey; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <label className="cite-label">{FIELD_LABELS[k]}</label>
      <input className="cite-input" value={value} onChange={e => onChange(e.target.value)} />
    </>
  )
}
