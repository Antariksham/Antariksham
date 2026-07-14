# CLAUDE.md

**Antariksham is the Next.js engine being reskinned into CosmosDaily's design to
become production at `cosmosdaily.space`.** Before doing anything, read
[`MIGRATION.md`](./MIGRATION.md) — it has the full context, architecture, design
system, how-to recipes, and roadmap.

## Non-negotiable rules (details in MIGRATION.md §5–§6)

1. **No hardcoded colors.** Use the CSS variable tokens in `styles/globals.css`.
   For translucent white text/borders/overlays use **`rgba(var(--ink), a)`** —
   never `rgba(255,255,255, a)`. New colors → add a token.
2. **Everything must work in light AND dark.** A manual toggle sets
   `data-theme="light"`; light overrides live in `:root[data-theme="light"]`.
   Test both. Never hard-code `#ffffff`/`#fff`/`#0a0a0f` as text/surface — use
   `var(--white)` / `var(--black)`.
3. **Typography:** sans (Segoe UI stack) for UI/headings/cards; **Merriweather
   serif only for the reading body** of article & learn pages.
4. **Use the CosmosDaily classes** (`.container`, `.section`, `.card`, `.grid-3`,
   `.btn*`, `.page-header`, `.prose`, `.tag`). Copy an existing page as a template.
5. **Live data = SSR fallback → client refresh from an `/api/*` proxy.** Preserve
   it. Live-incrementing numbers must be hydration-safe (tick only after mount).
6. **SEO discipline** for any page cutover: stable URLs (301 for changes),
   JSON-LD/OG/canonical, sitemap in sync, one page at a time. See MIGRATION.md §6.
7. **Never modify** the archived original design (`archive/antariksham-black-design`
   branch, `styles/themes/antariksham-black.css`).
8. **`next build` must compile before you commit.** The `supabaseUrl is required`
   page-data error (missing env) is expected, not a bug.
9. Work on branch `claude/understand-target-codebase-ecpqrw` (PR #20). Never put
   the internal model id in commits/PRs/code.

## Where things are
- Design system + all classes/tokens/themes → `styles/globals.css`
- Global chrome + theme toggle → `components/layout/`
- Features → `modules/<feature>/{components,services}`
- Server proxy + admin CRUD → `app/api/`
- DB migrations + guide → `supabase/migrations/`

When you finish a task, update MIGRATION.md §2 (done) and §10 (remaining).
