'use client'

/**
 * A reusable, controlled list of free-text items with reordering (Phase 1,
 * Feature 4 — also handy for later features).
 *
 * Reordering works two ways for accessibility: **drag-and-drop** via a grip
 * handle (HTML5 DnD; only the handle is draggable so the textarea stays
 * selectable) AND **keyboard** up/down buttons. Purely controlled — owns only
 * the transient drag state. Matches the CMS design language (tokens, both
 * themes).
 */
import { useRef, useState } from 'react'
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'

interface Props {
  items:        string[]
  onChange:     (items: string[]) => void
  placeholder?: string
  addLabel?:    string
}

export function ReorderableTextList({ items, onChange, placeholder, addLabel = 'Add item' }: Props) {
  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return
    const next = [...items]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    onChange(next)
  }
  const update = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n) }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add    = () => onChange([...items, ''])

  return (
    <div>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
          {items.map((item, i) => (
            <div
              key={i}
              onDragOver={e => { e.preventDefault(); if (overIndex !== i) setOverIndex(i) }}
              onDrop={e => {
                e.preventDefault()
                if (dragIndex.current != null) move(dragIndex.current, i)
                dragIndex.current = null; setOverIndex(null)
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '6px',
                borderRadius: '8px',
                background:  overIndex === i ? 'rgba(79,142,247,0.08)' : 'var(--surface)',
                border:      `1px solid ${overIndex === i ? 'var(--accent)' : 'var(--border)'}`,
                transition:  'background 0.12s, border-color 0.12s',
              }}
            >
              <span
                draggable
                onDragStart={e => { dragIndex.current = i; e.dataTransfer.effectAllowed = 'move' }}
                onDragEnd={() => { dragIndex.current = null; setOverIndex(null) }}
                role="button"
                aria-label="Drag to reorder"
                title="Drag to reorder"
                style={{ display: 'inline-flex', alignItems: 'center', paddingTop: '9px', color: 'rgba(var(--ink),0.4)', cursor: 'grab', flexShrink: 0 }}
              >
                <GripVertical size={14} />
              </span>

              <textarea
                value={item}
                onChange={e => update(i, e.target.value)}
                placeholder={placeholder}
                rows={2}
                style={{
                  flex: 1, resize: 'vertical', minHeight: '38px',
                  padding: '8px 10px', background: 'var(--black)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: 'var(--white)', fontFamily: 'var(--font-sans)', fontSize: '13px',
                  lineHeight: 1.5, outline: 'none', boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                <IconBtn onClick={() => move(i, i - 1)} disabled={i === 0} label="Move up"><ChevronUp size={12} /></IconBtn>
                <IconBtn onClick={() => move(i, i + 1)} disabled={i === items.length - 1} label="Move down"><ChevronDown size={12} /></IconBtn>
              </div>
              <IconBtn onClick={() => remove(i)} label="Remove" danger><Trash2 size={12} /></IconBtn>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'rgba(var(--ink),0.82)', fontFamily: 'var(--font-mono)',
          fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}
      >
        <Plus size={11} /> {addLabel}
      </button>
    </div>
  )
}

function IconBtn({ onClick, disabled, label, danger, children }: {
  onClick: () => void; disabled?: boolean; label: string; danger?: boolean; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '22px', height: '18px', borderRadius: '4px', border: 'none',
        background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
        color: danger ? 'rgba(231,76,60,0.7)' : 'rgba(var(--ink),0.6)',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  )
}
