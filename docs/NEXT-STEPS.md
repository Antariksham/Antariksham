# What to build next

**Start here if you are picking this project up.** This file is the working
queue: what is left, in priority order, with enough detail to start without
re-deriving anything. `ENGINEERING.md` is the reference (architecture, design
system, rules, and the full history of what was built and why); this is the
to-do list.

Everything below was checked against the source. File references are exact.

---

## 0. Before writing any code

**Read `CLAUDE.md` first** (10 non-negotiable rules), then `ENGINEERING.md` §5–§6
for the design system and invariants. The two that break things most often:

1. **No hardcoded colours** — use the tokens in `styles/globals.css`. For
   translucent white use `rgba(var(--ink), a)`, never `rgba(255,255,255, a)`.
2. **Everything must work in light AND dark.** Test both. This is not optional
   and it is not enforced by any test — see §2.5.

### Verify like this

```bash
npx tsc --noEmit        # must be clean
npm test                # 361 tests, all pure logic, must stay green
npx next lint           # baseline is 0 warnings — do not let it grow
npm run build           # must reach "Compiled successfully"
```

`next build` then fails at page-data collection with `supabaseUrl is required`
when Supabase env vars are absent. **That is expected, not a bug** (CLAUDE.md
rule 8). Compilation succeeding is the bar.

To see the site, run `next dev` with placeholder env vars — pages render, data
is empty:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
SUPABASE_SERVICE_ROLE_KEY=placeholder \
npx next dev -p 3000
```

Environment notes that cost time to rediscover:
- **Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`** and can
  screenshot pages. It **clamps `--window-size` to a minimum width**, so narrow
  breakpoints must be tested inside a sized `<iframe>`, not by shrinking the
  window. Its viewport is also ~90px shorter than the requested height.
- **Postgres 16 binaries are available** (`/usr/lib/postgresql/16/bin`) with
  `pg_trgm`. It refuses to run as root — `useradd pgtest` and run as that user.
  This is how the search migration was validated; do the same for any new SQL.
- **`pkill -f "next dev"` kills its own shell** (the pattern matches the invoking
  command line). Kill by listening port instead.
- The dev server caches metadata files: a changed `app/favicon.ico` keeps serving
  the old bytes until `.next` is removed.

---

## 1. Waiting on the repo owner (not a coding task)

**Run `supabase/migrations/20260731120000_content_search.sql`.** Until it is
applied, `modules/search/services/search.ts` silently falls back to the old
title-and-excerpt `ILIKE` query — search works but does not read article bodies.
The fallback is deliberate so deploy order does not matter, but it is not the
intended end state.

`pg_trgm` is needed only for the "did you mean" suggestions. The migration
creates it and raises a NOTICE if it lacks permission; enable it in Supabase →
Database → Extensions and re-run.

---

## 2. The queue

### 2.1 Give readers a way to come back — RSS and newsletter

**The last unfinished Tier 1 item, and the biggest growth ceiling.** The site has
no RSS feed, no newsletter, no comments, no follow of any kind — a grep for
`newsletter` or `subscribe` across `app/`, `modules/` and `components/` returns
nothing. Every visit is terminal.

- **RSS/Atom is an afternoon.** Add `app/feed.xml/route.ts` reusing exactly the
  queries `app/sitemap.ts` already makes (`getAllArticleSlugs` and friends).
  Space readers genuinely still use feeds and aggregators discover sites through
  them. Link it from the footer and add `<link rel="alternate" type="application/rss+xml">`
  to the root layout metadata.
- **Newsletter capture** is the higher-value half. Supabase is already there for
  storage, `/admin` for composing, the analytics beacon
  (`modules/articles/analytics/beacon.ts`) for measuring whether it works, and
  the publishing scheduler already proved the cron path
  (`supabase/migrations/20260726120000_article_scheduling.sql` runs pg_cron).
  Start with the capture form + table + double opt-in; sending can come later.

### 2.2 Hindi is a half-open door

The expensive part — translation storage, the language toggle, admin language
tabs — is **done**, and `app/hi/` now has its listings: `page.tsx` (home),
`articles/`, `learn/`, `missions/` plus the three detail routes. A reader who
picks Hindi now *stays* in Hindi: every chrome link (nav, mega-menu, footer,
logo) is routed through `localizeHref`, so following the site never silently
drops them back into English. What is still missing:

- ~~Site chrome is still English on `/hi/*`~~ **done** — `lib/ui.ts` holds the
  chrome strings, nav labels sit beside their hrefs in `config/navigation.ts`,
  and dates/mission taxonomy render per language. See §2. **One page still has
  English chrome: the mission detail page's field labels** — `ROLE_LABEL`,
  `SPEC_ROWS` (17 specification rows), the objective group headings, and the
  launch-information rows in `MissionSlugPage.tsx`. That is a mission-domain
  vocabulary (~40 entries) rather than site chrome; the dictionary and the
  `lang` plumbing are already there, so it is now mechanical.
- ~~`/hi/*` URLs in `app/sitemap.ts` with `hreflang` alternates~~ **done** — see
  §2. The sitemap lists every Hindi URL that actually exists, both sides of each
  pair carry the same `alternates.languages` map, and the four English pages
  that were silent now point back.

### 2.3 No component or route tests

All 361 tests are pure logic. **Nothing exercises a React component or an API
route**, so the light/dark rule (CLAUDE.md #2) is enforced only by a human
looking at a preview.

One Playwright smoke run — main routes, both themes, screenshot diff — is the
highest-value test investment available. It would have caught the two real
layout bugs this branch fixed by eye (the nav overlap between 900–1080px and the
media drawer's collapsed aspect-ratio box). Chromium is already installed; see
the environment notes in §0.

### 2.4 `/admin/team` does not exist

`admin_users` has `role` and `is_active` columns specifically to support this
(`supabase/migrations/20260720120000_admin_users.sql`), but there is no UI —
adding a colleague means hand-writing SQL. Fine while there is one editor; a hard
block the moment there are two.

### 2.5 Media Library Phase 3 — the usage graph

Without `media_usages` there is **no way to know whether an image is live on an
article before deleting it**, and dedupe only protects uploads from Phase 4
onward because older rows have no checksum. Deleting an in-use image is a mistake
that shows up on the public site. Full design in
[`MEDIA_LIBRARY_ARCHITECTURE.md`](./MEDIA_LIBRARY_ARCHITECTURE.md).

### 2.6 Three admin dead ends, all the same shape

Each is a safe refusal with no supported fix:

- **Bulk actions and CSV export act only on rows loaded so far.** Needs a
  "select all matching" that applies by filter server-side, no id list.
- **Category delete is refused while articles use it**, and re-categorising is
  one article at a time. `article_categories` has the same shape as
  `article_tags`, so the existing tag-merge code largely transfers.
- **Agency delete is refused while missions reference it**, same story. The
  collaborator side lives in `missions.details` jsonb, so that half needs a
  per-mission rewrite.

---

## 3. Smaller, well-defined wins

Ordered by payoff, not effort. Any of these is a reasonable single session.

- **`/tags/<slug>` archive pages.** Stable slugs and the relational join already
  exist (`20260730130000_tags_slug_unique.sql`); tags currently render as chips
  that go nowhere. Each becomes a ready-made landing page.
- **`/authors` index.** `app/authors/[slug]` exists and author pages are in the
  sitemap, but nothing lists them — the only way in is an article byline. Author
  pages are a direct E-E-A-T signal.
- **⌘K command palette.** Now unblocked: search reads article bodies and ranks
  properly, so a palette over it would feel good. The badge advertising it was
  removed (it bound nothing), so re-add it if you build this.
- **Topic-hub backlinks** on articles and missions ("part of the Mars hub"). The
  nine hubs exist and nothing points into them from the content they contain.
- **Per-article analytics deep dive + scroll heatmap.** The collector already
  records max scroll depth and dwell per view; only the read side is missing.
- **Mission completeness in `/admin/missions`.** `evaluateCompleteness` is
  written and tested; the list query just needs to fetch `details`.
- **Sky Tonight: planet and Moon rise/set** for the user's location. The existing
  sun geometry generalises to any RA/Dec.
- **Lunar sim: share-a-seed URLs (`?seed=`)** and difficulty presets.

---

## 4. Known rough edges

Not urgent, but do not rediscover these as if they were new.

- **0 ESLint warnings** is the baseline — `next lint --max-warnings=0` passes
  (it used to be 8; see ENGINEERING.md §2). Treat any new warning as a real
  signal and clear it, rather than letting a running count grow back. The raw
  `<img>` tags that remain are deliberate and each carries a scoped
  `eslint-disable-next-line` with the reason written beside it, so a bare `<img>`
  added by mistake still warns.
- **SVG never goes through `next/image`.** `dangerouslyAllowSVG: false` means the
  optimiser answers 400 for an SVG from *any* origin, same-origin included, so
  `isOptimizableImage` excludes it and `SmartImage` renders a plain `<img>`.
  Don't "fix" that as an oversight.
- **Existing article images have no `width`/`height`.** The editor now writes
  them on insert (`modules/admin/editor/imageDimensions.ts`), but content written
  before that still shifts. A backfill would have to fetch each image to measure
  it.
- **`/gallery` masonry still shifts.** Its heights come from the images and
  NASA's search API returns no dimensions to reserve space with.
- **Search ranking cost tracks matched rows** at ~3.3 µs each — a term matching
  50,000 articles takes 166 ms. Fine for a long time; the measurements and the
  revisit threshold are in the migration header. **Do not "fix" it by truncating
  candidates**, which silently returns something other than the best matches.
- **`/explore` overflows horizontally by ~9px at 320px.** Its `.card` grid items
  measure 324px against a 320px viewport, which gives the whole document a
  329px scroll width — and because `position: fixed` resolves against the layout
  viewport, that visibly stretches the nav bar and drawer too. Confirmed to be
  the page, not the chrome: removing both `.site-nav` and `.nav-drawer` at
  runtime leaves 329px, and `/gallery`, `/about` and `/learn` all measure
  exactly 320. Only `/explore` was checked — worth sweeping the other card grids
  at 320px in the same pass.
- **`--green` has no light-theme override**, so the "Live" nav link is `#2ecc71`
  on a `#f0f4ff` ground — roughly 1.8:1, well under AA for text. Pre-existing and
  site-wide (desktop row, mobile drawer, footer, every `LIVE` badge), which is
  why the drawer rebuild left it alone: the fix is one `--green` value inside
  `:root[data-theme="light"]`, but it repaints every green thing on the site and
  wants checking in one pass rather than piecemeal. The nav no longer hardcodes
  the hex, so that override is now all it would take.
- **`.page-container` in `styles/responsive.css` is dead** — no component uses
  that class, so its mobile padding rules have never done anything. `.container`
  is the real one.
- **The public category filter keys on the category NAME, not the slug**
  (`?category=NASA`). That is why renaming a category changes its filter link.
  Switching to the slug moves existing URLs, so it needs the §6 SEO treatment.
- **Non-Latin tag names are rejected** — `isValidTagName` needs an ASCII slug to
  key on. Has not bitten because tags are authored on the English article.
- **`sharp` is not a dependency.** `scripts/generate-icons.mjs` needs it only when
  the brand mark changes: `npm i --no-save sharp && node scripts/generate-icons.mjs`.
  The mark's path data is duplicated in five files — the header comment in
  `components/brand/Logo.tsx` lists them all.

---

## 5. Already done — do not rebuild

Full write-ups with reasoning are in `ENGINEERING.md` §2. Summary so the next
session does not redo any of it:

| Area | State |
|---|---|
| Independence from the cancelled migration | Done — one repo, one domain, no cutover, no rewrite proxy |
| Brand logo (nav, footer, favicon, PWA, iOS, share cards) | Done — themed inline SVG + generated icons |
| Global 404 / error / global-error pages | Done — branded, both themes |
| `robots.txt` → `app/robots.ts`, domain in one place | Done |
| Open Graph / Twitter defaults + generated share card | Done |
| Public search (full text over article bodies, ranked, fuzzy) | **Code done — migration not yet applied (§1)** |
| Structured data (FAQPage, breadcrumbs, missions, Learn, WebSite) | Done |
| Image CLS + `next/image` behind a host allow-list | Done |
| Mobile nav alignment and the desktop nav breakpoint | Done |
| Mobile nav drawer — drill-down sub-menus, compact 17px rows | Done |
| Every section reachable from the nav (Missions, hubs, Privacy/Terms, `/hi`) | Done |
| Desktop mega-menu — three columns, hover/click, article highlights | Done |

---

*Keep this file current. When you finish something, move it to §5 and record the
reasoning in `ENGINEERING.md` §2 — that is where future sessions look for "why",
and this file is only ever "what next".*

- **Listing URLs are plural, detail URLs are singular** — `/articles` browses,
  `/article/:slug` reads one; same for `/missions` → `/mission/:slug`. The
  mapping lives only in `DETAIL_SEGMENT` in `lib/i18n.ts`; don't hardcode either
  form at a call site. `/our-mission` is the about page (it used to be
  `/mission`, which now belongs to mission detail).
