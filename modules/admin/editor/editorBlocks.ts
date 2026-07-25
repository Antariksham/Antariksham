// ── Block catalogue ───────────────────────────────────────────
// The blocks the editor can insert. Each maps to the clean semantic HTML the
// public `.article-body` renderer already styles (see globals.css), so what you
// insert is exactly what ships. `action` blocks (image, link, video) are handled
// by the editor with extra UI; the rest insert their `html` at the caret.

export type BlockAction = 'image' | 'video' | 'link' | 'formatBlock' | 'command' | 'html'

export interface EditorBlock {
  id:        string
  label:     string
  hint:      string
  keywords:  string[]
  action:    BlockAction
  /** For action 'formatBlock' → tag; 'command' → execCommand name; 'html' → markup. */
  payload?:  string
  html?:     string
}

export const EDITOR_BLOCKS: EditorBlock[] = [
  { id: 'p',   label: 'Text',        hint: 'Plain paragraph',        keywords: ['paragraph', 'text', 'body'], action: 'formatBlock', payload: 'p' },
  { id: 'h2',  label: 'Heading 2',   hint: 'Big section heading',    keywords: ['heading', 'h2', 'title', 'section'], action: 'formatBlock', payload: 'h2' },
  { id: 'h3',  label: 'Heading 3',   hint: 'Medium sub-heading',     keywords: ['heading', 'h3', 'subheading'], action: 'formatBlock', payload: 'h3' },
  { id: 'h4',  label: 'Heading 4',   hint: 'Small sub-heading',      keywords: ['heading', 'h4'], action: 'formatBlock', payload: 'h4' },
  { id: 'ul',  label: 'Bulleted List', hint: 'Simple bullet list',   keywords: ['bullet', 'list', 'unordered', 'ul'], action: 'command', payload: 'insertUnorderedList' },
  { id: 'ol',  label: 'Numbered List', hint: 'Ordered list',         keywords: ['number', 'ordered', 'list', 'ol'], action: 'command', payload: 'insertOrderedList' },
  { id: 'checklist', label: 'Checklist', hint: 'To-do / task list',  keywords: ['todo', 'task', 'check', 'checkbox'], action: 'html',
    html: '<ul class="checklist"><li data-checked="false">To-do item</li></ul>' },
  { id: 'quote', label: 'Quote',     hint: 'Block quotation',        keywords: ['quote', 'blockquote', 'citation'], action: 'formatBlock', payload: 'blockquote' },
  { id: 'divider', label: 'Divider', hint: 'Horizontal rule',        keywords: ['divider', 'hr', 'rule', 'separator', 'line'], action: 'html', html: '<hr>' },
  { id: 'image', label: 'Image',     hint: 'Upload or pick an image', keywords: ['image', 'photo', 'picture', 'figure'], action: 'image' },
  { id: 'video', label: 'Video / YouTube', hint: 'Embed a video',    keywords: ['video', 'youtube', 'embed', 'vimeo'], action: 'video' },
  { id: 'code',  label: 'Code Block', hint: 'Monospace code',        keywords: ['code', 'pre', 'snippet'], action: 'html',
    html: '<pre><code>code</code></pre>' },
  { id: 'callout-info', label: 'Info Box', hint: 'Blue information callout', keywords: ['callout', 'info', 'note', 'box'], action: 'html',
    html: '<div class="callout callout-info"><p class="callout-title">Note</p><p>Information for the reader…</p></div>' },
  { id: 'callout-warning', label: 'Warning Box', hint: 'Amber warning callout', keywords: ['callout', 'warning', 'caution', 'box'], action: 'html',
    html: '<div class="callout callout-warning"><p class="callout-title">Warning</p><p>Something to be careful about…</p></div>' },
  { id: 'callout-success', label: 'Success Box', hint: 'Green success callout', keywords: ['callout', 'success', 'tip', 'box'], action: 'html',
    html: '<div class="callout callout-success"><p class="callout-title">Success</p><p>A positive takeaway…</p></div>' },
  { id: 'table', label: 'Table',     hint: '2×3 data table',         keywords: ['table', 'grid', 'data', 'rows', 'columns'], action: 'html',
    html: '<div class="table-wrap"><table><thead><tr><th>Header</th><th>Header</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table></div>' },
  { id: 'fact-card', label: 'Mission Fact Card', hint: 'Key/value facts', keywords: ['fact', 'card', 'mission', 'stats', 'facts'], action: 'html',
    html: '<aside class="fact-card"><p class="fact-label">Mission Facts</p><dl><dt>Launch</dt><dd>—</dd><dt>Agency</dt><dd>—</dd></dl></aside>' },
  { id: 'faq', label: 'FAQ Block',   hint: 'Expandable Q & A',       keywords: ['faq', 'question', 'answer', 'accordion', 'details'], action: 'html',
    html: '<details class="faq"><summary>Frequently asked question?</summary><p>The answer…</p></details>' },
  { id: 'timeline', label: 'Timeline', hint: 'Dated events',         keywords: ['timeline', 'events', 'history', 'dates'], action: 'html',
    html: '<ol class="timeline"><li><span class="t-when">2026</span>Event description…</li><li><span class="t-when">2027</span>Event description…</li></ol>' },
  { id: 'references', label: 'Reference Block', hint: 'Cited sources', keywords: ['reference', 'sources', 'citation', 'bibliography'], action: 'html',
    html: '<div class="references"><p class="references-title">References</p><ol><li>Author, <em>Title</em>, Source (2026).</li></ol></div>' },
  { id: 'math', label: 'Equation',   hint: 'Mathematical equation',  keywords: ['math', 'equation', 'formula', 'latex'], action: 'html',
    html: '<p class="math-block">E = mc<sup>2</sup></p>' },
]
