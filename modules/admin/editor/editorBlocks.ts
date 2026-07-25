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
  { id: 'math', label: 'Equation',   hint: 'Mathematical equation (KaTeX)',  keywords: ['math', 'equation', 'formula', 'latex', 'science'], action: 'html',
    html: '<p class="math-block">E = mc^2</p>' },

  // ── Phase 2, Feature 3 — advanced components ──────────────────
  { id: 'callout-danger', label: 'Alert Box', hint: 'Red critical alert', keywords: ['callout', 'alert', 'danger', 'critical', 'box'], action: 'html',
    html: '<div class="callout callout-danger"><p class="callout-title">Alert</p><p>Critical information the reader must not miss…</p></div>' },
  { id: 'key-takeaways', label: 'Key Takeaways', hint: 'Bulleted summary box', keywords: ['takeaways', 'summary', 'key', 'points', 'tldr', 'recap'], action: 'html',
    html: '<aside class="callout key-takeaways"><p class="callout-title">Key Takeaways</p><ul><li>First key point…</li><li>Second key point…</li></ul></aside>' },
  { id: 'did-you-know', label: 'Did You Know', hint: 'Highlighted fact', keywords: ['did you know', 'fact', 'trivia', 'interesting'], action: 'html',
    html: '<aside class="callout did-you-know"><p class="callout-title">Did you know?</p><p>An interesting fact about the topic…</p></aside>' },
  { id: 'pullquote', label: 'Pull Quote', hint: 'Large emphasised quote', keywords: ['pull quote', 'pullquote', 'quote', 'highlight'], action: 'html',
    html: '<blockquote class="pullquote"><p>A striking line pulled from the article to draw the reader in.</p><cite>Attribution</cite></blockquote>' },
  { id: 'stat-grid', label: 'Mission Statistics', hint: 'Grid of key numbers', keywords: ['statistics', 'stats', 'numbers', 'mission', 'metrics', 'kpi'], action: 'html',
    html: '<div class="stat-grid"><div class="stat"><span class="stat-value">4</span><span class="stat-label">Crew</span></div><div class="stat"><span class="stat-value">10 days</span><span class="stat-label">Duration</span></div><div class="stat"><span class="stat-value">400,000 km</span><span class="stat-label">Distance</span></div></div>' },
  { id: 'glossary', label: 'Glossary', hint: 'Terms & definitions', keywords: ['glossary', 'terms', 'definitions', 'dictionary'], action: 'html',
    html: '<dl class="glossary"><dt>Perigee</dt><dd>The closest point of an orbit to Earth.</dd><dt>Apogee</dt><dd>The farthest point of an orbit from Earth.</dd></dl>' },
  { id: 'research-summary', label: 'Research Summary', hint: 'Structured study abstract', keywords: ['research', 'summary', 'study', 'abstract', 'paper', 'science'], action: 'html',
    html: '<aside class="research-summary"><p class="rs-title">Research Summary</p><dl><dt>Objective</dt><dd>…</dd><dt>Method</dt><dd>…</dd><dt>Findings</dt><dd>…</dd><dt>Significance</dt><dd>…</dd></dl></aside>' },
  { id: 'comparison', label: 'Comparison Table', hint: 'Compare options side by side', keywords: ['comparison', 'compare', 'versus', 'vs', 'table'], action: 'html',
    html: '<div class="table-wrap comparison"><table><thead><tr><th>Feature</th><th>Option A</th><th>Option B</th></tr></thead><tbody><tr><th scope="row">Criterion</th><td>…</td><td>…</td></tr><tr><th scope="row">Criterion</th><td>…</td><td>…</td></tr></tbody></table></div>' },
  { id: 'spec', label: 'Specification Table', hint: 'Key/value spec sheet', keywords: ['specification', 'spec', 'specs', 'sheet', 'table', 'technical'], action: 'html',
    html: '<div class="table-wrap spec"><table><tbody><tr><th scope="row">Mass</th><td>—</td></tr><tr><th scope="row">Height</th><td>—</td></tr><tr><th scope="row">Power</th><td>—</td></tr></tbody></table></div>' },
  { id: 'data-table', label: 'Interactive Data Table', hint: 'Sortable table', keywords: ['data', 'table', 'sortable', 'sort', 'interactive'], action: 'html',
    html: '<div class="table-wrap" data-sortable><table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>Alpha</td><td>10</td></tr><tr><td>Beta</td><td>25</td></tr><tr><td>Gamma</td><td>7</td></tr></tbody></table></div>' },
  { id: 'timeline-h', label: 'Horizontal Timeline', hint: 'Scrolling dated events', keywords: ['timeline', 'horizontal', 'events', 'history', 'dates'], action: 'html',
    html: '<ol class="timeline timeline-h"><li><span class="t-when">2026</span>Event description…</li><li><span class="t-when">2027</span>Event description…</li><li><span class="t-when">2028</span>Event description…</li></ol>' },
  { id: 'countdown', label: 'Countdown', hint: 'Live countdown to a date', keywords: ['countdown', 'timer', 'launch', 'clock', 'date'], action: 'html',
    html: '<div class="countdown" data-to="2026-12-31T00:00:00Z"><p class="cd-title">Countdown</p><p class="cd-target">Target: 31 December 2026</p></div>' },
  { id: 'carousel', label: 'Image Carousel', hint: 'Swipeable image slides', keywords: ['carousel', 'slider', 'slideshow', 'images', 'gallery'], action: 'html',
    html: '<div class="carousel"><figure><img src="https://picsum.photos/seed/a/960/540" alt="Slide 1"><figcaption>Caption for slide 1</figcaption></figure><figure><img src="https://picsum.photos/seed/b/960/540" alt="Slide 2"><figcaption>Caption for slide 2</figcaption></figure></div>' },
  { id: 'gallery', label: 'Interactive Gallery', hint: 'Grid with click-to-zoom', keywords: ['gallery', 'images', 'grid', 'photos', 'lightbox', 'zoom'], action: 'html',
    html: '<figure class="gallery"><img src="https://picsum.photos/seed/c/600/600" alt="Image 1"><img src="https://picsum.photos/seed/d/600/600" alt="Image 2"><img src="https://picsum.photos/seed/e/600/600" alt="Image 3"><figcaption>Gallery — tap an image to zoom</figcaption></figure>' },
  { id: 'embed-pdf', label: 'Embedded PDF', hint: 'Inline PDF document', keywords: ['pdf', 'document', 'embed', 'paper'], action: 'html',
    html: '<div class="embed embed-doc" data-kind="pdf" data-src="https://example.com/document.pdf"><a href="https://example.com/document.pdf">Open PDF ↗</a></div>' },
  { id: 'embed-tweet', label: 'Tweet / X Post', hint: 'Quoted social post', keywords: ['tweet', 'twitter', 'x', 'post', 'social', 'embed'], action: 'html',
    html: '<div class="embed embed-tweet" data-src="https://twitter.com/NASA"><blockquote><p>Post text…</p><a href="https://twitter.com/NASA">View on X ↗</a></blockquote></div>' },
  { id: 'embed-nasa', label: 'NASA Media', hint: 'Image/video with agency credit', keywords: ['nasa', 'media', 'image', 'photo', 'credit'], action: 'html',
    html: '<figure class="embed embed-media" data-kind="nasa"><img src="https://picsum.photos/seed/nasa/960/540" alt="NASA media"><figcaption>Credit: NASA</figcaption></figure>' },
  { id: 'embed-esa', label: 'ESA Media', hint: 'Image/video with agency credit', keywords: ['esa', 'media', 'image', 'photo', 'credit', 'europe'], action: 'html',
    html: '<figure class="embed embed-media" data-kind="esa"><img src="https://picsum.photos/seed/esa/960/540" alt="ESA media"><figcaption>Credit: ESA</figcaption></figure>' },
]
