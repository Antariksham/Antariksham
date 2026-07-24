'use client'

import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react'
import {
  Bold, Italic, Underline, Strikethrough, Highlighter, Code, Link2,
  Heading2, Heading3, List, ListOrdered, Quote, Minus, Image as ImageIcon,
  Table as TableIcon, Info, Plus,
} from 'lucide-react'
import { sanitizeHtml } from './sanitizeHtml'
import { EDITOR_BLOCKS, type EditorBlock } from './editorBlocks'

export interface RichEditorHandle {
  insertImage: (opts: { src: string; alt?: string; caption?: string; credit?: string }) => void
  focus:       () => void
}

interface Props {
  value:       string
  onChange:    (html: string) => void
  onPickImage: () => void
  ariaLabel?:  string
}

// Parse a YouTube / Vimeo URL into an embeddable iframe src.
function embedSrc(url: string): string | null {
  const u = url.trim()
  let m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  m = u.match(/vimeo\.com\/(\d+)/)
  if (m) return `https://player.vimeo.com/video/${m[1]}`
  return null
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export const RichEditor = forwardRef<RichEditorHandle, Props>(function RichEditor(
  { value, onChange, onPickImage, ariaLabel }, ref,
) {
  const editorRef   = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef<string>(value)
  const savedRange  = useRef<Range | null>(null)
  const emitTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [slash, setSlash] = useState<{ open: boolean; query: string; top: number; left: number; index: number }>(
    { open: false, query: '', top: 0, left: 0, index: 0 },
  )

  // ── Emit (sanitize → onChange), debounced so huge docs don't stall typing ──
  const emit = useCallback((immediate = false) => {
    const run = () => {
      const el = editorRef.current
      if (!el) return
      const clean = sanitizeHtml(el.innerHTML)
      lastEmitted.current = clean
      onChange(clean)
    }
    if (emitTimer.current) clearTimeout(emitTimer.current)
    if (immediate) run()
    else emitTimer.current = setTimeout(run, 160)
  }, [onChange])

  // ── Initialise / re-sync innerHTML from `value` when not actively editing ──
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (document.activeElement === el) return          // don't clobber the caret
    if (value === lastEmitted.current) return           // our own echo
    el.innerHTML = value || '<p><br></p>'
    lastEmitted.current = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const el = editorRef.current
    if (el && !el.innerHTML) el.innerHTML = value || '<p><br></p>'
    // one-time defaults
    try { document.execCommand('defaultParagraphSeparator', false, 'p') } catch {}
    try { document.execCommand('styleWithCSS', false, 'false') } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Track the live selection so blocks can be inserted after the media modal
  // (which steals focus) reopens.
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection()
      const el = editorRef.current
      if (!sel || sel.rangeCount === 0 || !el) return
      const r = sel.getRangeAt(0)
      if (el.contains(r.commonAncestorContainer)) savedRange.current = r.cloneRange()
    }
    document.addEventListener('selectionchange', handler)
    return () => document.removeEventListener('selectionchange', handler)
  }, [])

  function restoreSelection() {
    const el = editorRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (savedRange.current && sel) {
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    }
  }

  // ── Primitive commands ─────────────────────────────────────
  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus()
    try { document.execCommand(cmd, false, val) } catch {}
    emit(true)
  }, [emit])

  const insertHtml = useCallback((html: string) => {
    editorRef.current?.focus()
    try { document.execCommand('insertHTML', false, html) } catch {}
    emit(true)
  }, [emit])

  const formatBlock = useCallback((tag: string) => exec('formatBlock', tag), [exec])

  function wrapInline(tag: 'mark' | 'code') {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) { insertHtml(`<${tag}>text</${tag}>`); return }
    const text = sel.toString()
    insertHtml(`<${tag}>${tag === 'code' ? escapeHtml(text) : escapeHtml(text)}</${tag}>`)
  }

  function addLink() {
    const url = window.prompt('Link URL')
    if (!url) return
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) exec('createLink', url)
    else insertHtml(`<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`)
  }

  function addVideo() {
    const url = window.prompt('Video URL (YouTube or Vimeo)')
    if (!url) return
    const src = embedSrc(url)
    if (!src) { window.alert('Could not recognise that video URL.'); return }
    insertHtml(`<div class="embed embed-video"><iframe src="${src}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`)
  }

  const insertImage = useCallback((opts: { src: string; alt?: string; caption?: string; credit?: string }) => {
    restoreSelection()
    const cap = [opts.caption, opts.credit && `<span class="credit">${escapeHtml(opts.credit)}</span>`].filter(Boolean).join(' ')
    const fig = `<figure><img src="${escapeHtml(opts.src)}" alt="${escapeHtml(opts.alt || '')}" loading="lazy">${cap ? `<figcaption>${cap}</figcaption>` : '<figcaption>Add a caption…</figcaption>'}</figure><p><br></p>`
    insertHtml(fig)
  }, [insertHtml])

  useImperativeHandle(ref, () => ({
    insertImage,
    focus: () => editorRef.current?.focus(),
  }), [insertImage])

  // ── Run a block from the toolbar / slash menu ───────────────
  const runBlock = useCallback((block: EditorBlock) => {
    switch (block.action) {
      case 'formatBlock': formatBlock(block.payload!); break
      case 'command':     exec(block.payload!); break
      case 'html':        insertHtml(block.html!); break
      case 'image':       onPickImage(); break
      case 'video':       addVideo(); break
      case 'link':        addLink(); break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formatBlock, exec, insertHtml, onPickImage])

  // ── Slash-command detection ─────────────────────────────────
  function slashContext() {
    const sel = window.getSelection()
    if (!sel || !sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeType !== 3) return null
    const node = sel.anchorNode as Text
    const offset = sel.anchorOffset
    const before = node.textContent!.slice(0, offset)
    const m = before.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/)
    if (!m) return null
    return { node, query: m[1], slashIndex: offset - m[1].length - 1 }
  }

  function refreshSlash() {
    const ctx = slashContext()
    if (!ctx) { setSlash(s => (s.open ? { ...s, open: false } : s)); return }
    const sel = window.getSelection()
    const rect = sel && sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null
    setSlash({ open: true, query: ctx.query, top: (rect?.bottom ?? 0) + 6, left: rect?.left ?? 0, index: 0 })
  }

  const filteredBlocks = EDITOR_BLOCKS.filter(b => {
    const q = slash.query.toLowerCase()
    if (!q) return true
    return b.label.toLowerCase().includes(q) || b.keywords.some(k => k.includes(q))
  })

  function chooseSlash(block: EditorBlock) {
    const ctx = slashContext()
    if (ctx) {
      try { ctx.node.deleteData(ctx.slashIndex, ctx.query.length + 1) } catch {}
      const sel = window.getSelection()
      if (sel) {
        const r = document.createRange()
        r.setStart(ctx.node, Math.min(ctx.slashIndex, ctx.node.length))
        r.collapse(true)
        sel.removeAllRanges(); sel.addRange(r)
      }
    }
    setSlash(s => ({ ...s, open: false }))
    runBlock(block)
  }

  // ── Markdown input rules + shortcuts ────────────────────────
  function currentBlock(): HTMLElement | null {
    const sel = window.getSelection()
    if (!sel || !sel.anchorNode) return null
    let node: Node | null = sel.anchorNode
    const editor = editorRef.current
    while (node && node !== editor) {
      if (node.nodeType === 1 && /^(P|H2|H3|H4|LI|BLOCKQUOTE|PRE|DIV)$/.test((node as HTMLElement).tagName)) return node as HTMLElement
      node = node.parentNode
    }
    return null
  }

  function replaceBlock(html: string) {
    const block = currentBlock()
    if (!block) { insertHtml(html); return }
    const tpl = document.createElement('template')
    tpl.innerHTML = html
    block.replaceWith(tpl.content)
    emit(true)
  }

  const MD_SPACE: Record<string, () => void> = {
    '##':   () => formatBlock('h2'),
    '###':  () => formatBlock('h3'),
    '####': () => formatBlock('h4'),
    '-':    () => exec('insertUnorderedList'),
    '*':    () => exec('insertUnorderedList'),
    '1.':   () => exec('insertOrderedList'),
    '>':    () => formatBlock('blockquote'),
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Slash menu navigation
    if (slash.open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlash(s => ({ ...s, index: Math.min(s.index + 1, filteredBlocks.length - 1) })); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSlash(s => ({ ...s, index: Math.max(s.index - 1, 0) })); return }
      if (e.key === 'Enter')     { e.preventDefault(); if (filteredBlocks[slash.index]) chooseSlash(filteredBlocks[slash.index]); return }
      if (e.key === 'Escape')    { e.preventDefault(); setSlash(s => ({ ...s, open: false })); return }
    }

    const mod = e.ctrlKey || e.metaKey

    // Keyboard shortcuts
    if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); addLink(); return }
    if (mod && e.shiftKey && e.key === '7') { e.preventDefault(); exec('insertOrderedList'); return }
    if (mod && e.shiftKey && e.key === '8') { e.preventDefault(); exec('insertUnorderedList'); return }
    if (mod && e.shiftKey && (e.key === 'h' || e.key === 'H')) { e.preventDefault(); wrapInline('mark'); return }
    if (mod && e.altKey && e.key === '2') { e.preventDefault(); formatBlock('h2'); return }
    if (mod && e.altKey && e.key === '3') { e.preventDefault(); formatBlock('h3'); return }
    if (mod && e.altKey && e.key === '4') { e.preventDefault(); formatBlock('h4'); return }
    if (mod && e.altKey && e.key === '0') { e.preventDefault(); formatBlock('p'); return }

    // Markdown: space after a trigger token at the start of a block
    if (e.key === ' ') {
      const block = currentBlock()
      const text = (block?.textContent || '').replace(/ /g, ' ')
      const rule = MD_SPACE[text.trim()]
      if (rule && block && text.trim() === text.replace(/\s+$/, '')) {
        e.preventDefault()
        block.textContent = ''
        const sel = window.getSelection()
        if (sel) { const r = document.createRange(); r.selectNodeContents(block); r.collapse(true); sel.removeAllRanges(); sel.addRange(r) }
        rule()
        return
      }
    }

    // Markdown: Enter on a '---' / '```' line
    if (e.key === 'Enter' && !e.shiftKey) {
      const block = currentBlock()
      const t = (block?.textContent || '').trim()
      if (t === '---' || t === '***') { e.preventDefault(); replaceBlock('<hr><p><br></p>'); return }
      if (t === '```')                { e.preventDefault(); replaceBlock('<pre><code></code></pre><p><br></p>'); return }
    }
  }

  // ── Paste — sanitize external HTML, wrap loose fragments ─────
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    if (html) {
      insertHtml(sanitizeHtml(html, { wrapLoose: true }))
    } else if (text) {
      // Plain text: paragraph per blank-line block, escape HTML.
      const blocks = text.split(/\n{2,}/).map(b => `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`).join('')
      insertHtml(blocks)
    }
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '7px', overflow: 'hidden', background: 'var(--black)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px',
        padding: '6px 8px', borderBottom: '1px solid var(--border)',
        background: 'rgba(var(--ink),0.02)', position: 'sticky', top: 0, zIndex: 5,
      }}>
        <TB icon={Bold}          title="Bold (Ctrl+B)"        onClick={() => exec('bold')} />
        <TB icon={Italic}        title="Italic (Ctrl+I)"      onClick={() => exec('italic')} />
        <TB icon={Underline}     title="Underline (Ctrl+U)"   onClick={() => exec('underline')} />
        <TB icon={Strikethrough} title="Strikethrough"        onClick={() => exec('strikeThrough')} />
        <TB icon={Highlighter}   title="Highlight (Ctrl+Shift+H)" onClick={() => wrapInline('mark')} />
        <TB icon={Code}          title="Inline code"          onClick={() => wrapInline('code')} />
        <TB icon={Link2}         title="Link (Ctrl+K)"        onClick={addLink} />
        <Sep />
        <TB icon={Heading2}      title="Heading 2 (Ctrl+Alt+2)" onClick={() => formatBlock('h2')} />
        <TB icon={Heading3}      title="Heading 3 (Ctrl+Alt+3)" onClick={() => formatBlock('h3')} />
        <TB icon={List}          title="Bulleted list (Ctrl+Shift+8)" onClick={() => exec('insertUnorderedList')} />
        <TB icon={ListOrdered}   title="Numbered list (Ctrl+Shift+7)" onClick={() => exec('insertOrderedList')} />
        <TB icon={Quote}         title="Quote"                onClick={() => formatBlock('blockquote')} />
        <TB icon={Minus}         title="Divider"              onClick={() => insertHtml('<hr><p><br></p>')} />
        <Sep />
        <TB icon={ImageIcon}     title="Image"                onClick={onPickImage} />
        <TB icon={TableIcon}     title="Table"                onClick={() => insertHtml(EDITOR_BLOCKS.find(b => b.id === 'table')!.html!)} />
        <TB icon={Info}          title="Info callout"         onClick={() => insertHtml(EDITOR_BLOCKS.find(b => b.id === 'callout-info')!.html!)} />
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 8px', color: 'rgba(var(--ink),0.5)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.05em' }}>
          <Plus size={11} /> type <kbd style={{ fontFamily: 'var(--font-mono)', background: 'rgba(var(--ink),0.06)', border: '1px solid var(--border)', borderRadius: '3px', padding: '0 4px' }}>/</kbd> for blocks
        </span>
      </div>

      {/* Editable surface — .article-body so WYSIWYG matches production */}
      <div
        ref={editorRef}
        className="article-body"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel || 'Article content'}
        onInput={() => { emit(); refreshSlash() }}
        onKeyDown={handleKeyDown}
        onKeyUp={refreshSlash}
        onMouseUp={refreshSlash}
        onPaste={handlePaste}
        onBlur={() => emit(true)}
        style={{
          minHeight: '360px',
          maxHeight: '640px',
          overflowY: 'auto',
          padding: '20px 22px',
          outline: 'none',
          fontFamily: 'var(--font-serif)',
          fontSize: '17px',
          lineHeight: 1.75,
          color: 'rgba(var(--ink),0.92)',
        }}
      />

      {/* Slash command palette */}
      {slash.open && filteredBlocks.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'fixed', top: slash.top, left: slash.left, zIndex: 60,
            width: '270px', maxHeight: '320px', overflowY: 'auto',
            background: 'var(--panel)', border: '1px solid var(--border-hi)',
            borderRadius: '10px', boxShadow: 'var(--card-shadow)', padding: '6px',
          }}
          onMouseDown={e => e.preventDefault()}
        >
          {filteredBlocks.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={i === slash.index}
              onMouseEnter={() => setSlash(s => ({ ...s, index: i }))}
              onClick={() => chooseSlash(b)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '1px', width: '100%',
                textAlign: 'left', padding: '7px 10px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', background: i === slash.index ? 'var(--accent)' : 'transparent',
              }}
            >
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: i === slash.index ? 'var(--black)' : 'var(--white)' }}>
                {b.label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: i === slash.index ? 'rgba(0,0,0,0.7)' : 'rgba(var(--ink),0.55)' }}>
                {b.hint}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

// ── Toolbar primitives ────────────────────────────────────────
function TB({ icon: Icon, title, onClick }: { icon: typeof Bold; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '30px', height: '30px', borderRadius: '5px', border: 'none',
        background: 'transparent', color: 'rgba(var(--ink),0.75)', cursor: 'pointer',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--ink),0.07)'; e.currentTarget.style.color = 'var(--white)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(var(--ink),0.75)' }}
    >
      <Icon size={15} />
    </button>
  )
}

function Sep() {
  return <span style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
}
