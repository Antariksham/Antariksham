'use client'

import { useRef, useState } from 'react'
import { Sparkles, FileCode, X } from 'lucide-react'
import { MediaLibrary } from '@/modules/admin/components/MediaLibrary'
import { RichEditor, type RichEditorHandle } from './RichEditor'
import { sanitizeHtml } from './sanitizeHtml'

/**
 * The article body editor. Wraps the block-based RichEditor with a Rich ⇄ HTML
 * source toggle (backward-compatible: every existing article is just HTML) and
 * an image picker wired to the Media Library. Emits clean semantic HTML that
 * the public `.article-body` renderer already styles.
 */
export function ContentEditorField({
  value, onChange,
}: {
  value:    string
  onChange: (html: string) => void
}) {
  const [mode, setMode] = useState<'rich' | 'html'>('rich')
  const [showMedia, setShowMedia] = useState(false)
  const richRef = useRef<RichEditorHandle>(null)

  function handlePick(url: string) {
    if (mode === 'rich') {
      richRef.current?.insertImage({ src: url, alt: '' })
    } else {
      const fig = `<figure><img src="${url}" alt="" loading="lazy"><figcaption>Add a caption…</figcaption></figure>\n`
      onChange((value ? value + '\n' : '') + fig)
    }
    setShowMedia(false)
  }

  return (
    <div>
      {/* Rich / HTML toggle */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
        <ModeBtn active={mode === 'rich'} icon={Sparkles}  label="Rich"        onClick={() => setMode('rich')} />
        <ModeBtn active={mode === 'html'} icon={FileCode}  label="HTML source" onClick={() => { if (mode === 'rich') onChange(sanitizeHtml(value)); setMode('html') }} />
      </div>

      {mode === 'rich' ? (
        <RichEditor
          ref={richRef}
          value={value}
          onChange={onChange}
          onPickImage={() => setShowMedia(true)}
        />
      ) : (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={'<p>Start writing your article…</p>'}
          rows={22}
          spellCheck={false}
          style={{
            width: '100%', padding: '14px', background: 'var(--black)',
            border: '1px solid var(--border)', borderRadius: '7px',
            color: 'var(--white)', fontFamily: 'var(--font-mono)', fontSize: '13px',
            lineHeight: 1.7, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
      )}

      {/* Media picker modal */}
      {showMedia && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowMedia(false) }}
        >
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', width: '100%', maxWidth: '760px', maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--ink),0.85)' }}>
                Insert Image
              </span>
              <button onClick={() => setShowMedia(false)} style={{ background: 'none', border: 'none', color: 'rgba(var(--ink),0.8)', cursor: 'pointer', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <MediaLibrary pickerMode defaultBucket="article-images" onPick={handlePick} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModeBtn({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Sparkles; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '5px 11px', borderRadius: '6px', cursor: 'pointer',
        border: '1px solid', borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'rgba(var(--accent-rgb),0.12)' : 'transparent',
        color: active ? 'var(--accent)' : 'rgba(var(--ink),0.65)',
        fontFamily: 'var(--font-mono)', fontSize: '11px',
        letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.15s',
      }}
    >
      <Icon size={12} /> {label}
    </button>
  )
}
