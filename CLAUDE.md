# CLAUDE.md

**Antariksham is an independent space-journalism and knowledge platform, built
on Next.js and shipping at `antariksham.org`.** It is its own product — not a
migration, not a reskin, and not staged behind another site. Before doing
anything, read [`ENGINEERING.md`](./ENGINEERING.md) — it has the architecture,
design system, how-to recipes, engineering history, and roadmap.

## Non-negotiable rules (details in ENGINEERING.md §5–§6)

1. **No hardcoded colors.** Use the CSS variable tokens in `styles/globals.css`.
   For translucent white text/borders/overlays use **`rgba(var(--ink), a)`** —
   never `rgba(255,255,255, a)`. New colors → add a token.
2. **Everything must work in light AND dark.** A manual toggle sets
   `data-theme="light"`; light overrides live in `:root[data-theme="light"]`.
   Test both. Never hard-code `#ffffff`/`#fff`/`#0a0a0f` as text/surface — use
   `var(--white)` / `var(--black)`.
3. **Typography:** sans (Segoe UI stack) for UI/headings/cards; **Merriweather
   serif only for the reading body** of article & learn pages.
4. **Use the shared component classes** (`.container`, `.section`, `.card`,
   `.grid-3`, `.btn*`, `.page-header`, `.prose`, `.tag`). Copy an existing page
   as a template rather than inventing one-off styles.
5. **Live data = SSR fallback → client refresh from an `/api/*` proxy.** Preserve
   it. Live-incrementing numbers must be hydration-safe (tick only after mount).
6. **SEO discipline** whenever a public URL changes: 301 the old path, keep
   JSON-LD/OG/canonical correct, keep the sitemap in sync. See ENGINEERING.md §6.
7. **Never modify** the archived original design (`archive/antariksham-black-design`
   branch, `styles/themes/antariksham-black.css`). It is history, not a live theme.
8. **`next build` must compile before you commit.** The `supabaseUrl is required`
   page-data error (missing env) is expected, not a bug.
9. **The domain lives in exactly one place** — `config/site.ts`. Sitemap, robots,
   canonicals, JSON-LD and OG URLs all derive from it. Never write the domain
   into a second file.
10. Never put the internal model id in commits/PRs/code.

## Where things are
- Design system + all classes/tokens/themes → `styles/globals.css`
- Brand mark (themed SVG) + generated icons → `components/brand/`, `scripts/generate-icons.mjs`
- Global chrome + theme toggle → `components/layout/`
- Features → `modules/<feature>/{components,services}`
- Server proxy + admin CRUD → `app/api/`
- DB migrations + guide → `supabase/migrations/`

When you finish a task, update ENGINEERING.md §2 (done) and §10 (remaining).
