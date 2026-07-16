# Antariksham → CosmosDaily — Migration & Engineering Guide

> **Read this first.** It explains what this repo is, what has been done, the
> rules that keep the site consistent, how to do common tasks, and what remains.
> It is written so a new AI agent or developer can continue the migration
> without re-deriving context.

---

## 1. What this project is

Three codebases are being consolidated into **one** production site at
**`cosmosdaily.space`**, without losing the SEO/design CosmosDaily has earned.

| Repo | Role | Fate |
|---|---|---|
| `space-website` | The **live** static HTML/CSS/JS site (the design source of truth). | Retires page-by-page. |
| `cosmosdaily-nextjs` | Early Next.js migration (article route only). | Superseded; rebuilt here. |
| **`Antariksham`** (this repo) | The **mature Next.js engine** (modules, API proxy, Supabase, admin CMS). | **Becomes production**, reskinned in CosmosDaily's design. |

**The decision:** Antariksham becomes the only engine going forward, **reskinned
in CosmosDaily's visual design**. It never launches under its own name — the
`cosmosdaily.space` domain, URLs, and content are what survive. Rollout is
page-by-page behind a `vercel.json` rewrite (see §9), each page verified in
Google Search Console for 1–2 weeks before the next.

The full strategy lives in the uploaded **CosmosDaily Engine Migration Plan**
(the four phases: Reskin → Data Migration → URL/Metadata Parity & Cutover →
Advanced Features). This guide is the engineering companion to that plan.

---

## 2. Current status (what's DONE)

Work happens on branch **`claude/understand-target-codebase-ecpqrw`** → PR **#20**
(draft) against `main`. Every change builds (`next build` compiles; the only
build error is a pre-existing `supabaseUrl is required` during page-data
collection when Supabase env vars are absent — unrelated to app code).

**Phase 1 (Reskin) — essentially complete:**
- ✅ **Design tokens & full color migration** to CosmosDaily's palette. Antariksham's
  CSS variable *names* were kept; only *values* were swapped, and every hardcoded
  color across ~50 files was routed to tokens.
- ✅ **CosmosDaily class system ported** into `styles/globals.css` (`.container`,
  `.section`, `.card`, `.grid-3`, `.btn*`, `.page-header`, `.page-title`,
  `.prose`, `.tag`, `.hero-badge`, etc.).
- ✅ **Every public page rebuilt on that system**: homepage, `/news`, `/missions`,
  `/live` hub, `/live/deep-space`, `/search`, article & learn reading pages, all
  static/legal pages, nav, footer.
- ✅ **Typography**: sans (Segoe UI stack) for UI/headings/cards; **Merriweather
  serif reserved for article & learn reading bodies only** (exactly how
  CosmosDaily uses type).
- ✅ **Universal light/dark theme toggle** (nav, every page, `localStorage`,
  no-flash). See §5.
- ✅ **Legibility pass**: small label sizes and low text-contrast raised across the
  site (both themes).
- ✅ **Learn thumbnails** + generated covers (`LearnThumb`) + a full **admin Learn
  CMS** (`/admin/learn`).
- ✅ **Deep Space page** rebuilt as a data-driven replica of `deep-space.html`
  with **live-incrementing counters** and 7 probes.
- ✅ **Original "black" design preserved** (see §8).
- ✅ **`/lunar-sim` (SHIPPED — indexed, linked from `/live` hub + footer
  Intelligence, OG/canonical/JSON-LD in place)** — Lunar Landing Simulator:
  the SELENE C++ flight software (`antariksham/moon-landing-code`) compiled to
  WebAssembly (artifacts in `public/wasm/`, built by that repo's
  `wasm/build.sh`), loaded client-side by `modules/lunar-sim/` and rendered as
  a space-agency telemetry dashboard (60 fps state vectors, 2-D descent
  profile, touchdown verdict; altitude also streams to the browser console)
  plus a **Three.js 3-D visual simulation** (`LunarScene.tsx`, plain `three`
  via `next/dynamic({ssr:false})` so WebGL stays off other routes): lunar
  surface, primitive-built lander posed 1:1 from the FSW state vectors,
  throttle-mapped engine plume, chase camera, trajectory trail, target ring
  and hazard-field markers, graceful no-WebGL fallback.
  The FSW repo's `wasm-publish.yml` workflow re-publishes fresh artifacts here
  on every push to its `main` (needs its `SITE_REPO_TOKEN` secret).
- ✅ **Launch Tracker "Next Launch" card theming fix**: the featured card's
  background was a hardcoded dark gradient (`#1a1a2e → #0a0a0f`), so it stayed
  black in light mode. Routed it through a new theme-aware `--featured-bg` token
  (dark gradient in dark mode, subtle white gradient in light) — matching the
  `--hero-scrim` / `--nav-bg` pattern.
- ✅ **Fixed-nav clearance + responsive layout fixes**:
  - Launch Tracker header started at only `40px` from the top, so its eyebrow and
    the **Refresh button slid under the 64px fixed nav** (clipped on desktop). Gave
    the page container `padding-top: var(--nav-height)` (the same pattern
    `DeepSpaceTracker` already uses) and trimmed the header's inner top padding.
  - Deep-space probe detail (`/live/deep-space/[id]`) used a fixed
    `minmax(0,1fr) 300px` grid with **no breakpoint**, so on mobile the 300px
    sidebar crushed the content column to near-zero and every word wrapped onto its
    own line. Moved the grid to a `.probe-detail-grid` class that stacks to a
    single full-width column ≤860px, and added nav clearance to that page too.
- ✅ **Launch Tracker hydration fix**: the "Updated {time}" stamp rendered
  `toLocaleTimeString()` during SSR, so server and client HTML differed and the
  whole root fell back to client rendering (which also stripped the `data-theme`
  set by the no-flash script, flipping light mode back to dark). Gated the stamp
  behind a `mounted` flag (renders `—` until after mount), per the §6 rule that
  live values must tick only after mount.
- ✅ **Single "featured" enforcement (admin)**: articles and missions had no
  exclusivity on the `featured` flag, so marking a new one featured never cleared
  the old — the homepage hero (most-recent featured article) could keep showing a
  stale pick. Added `modules/admin/services/featuredExclusive.ts`
  (`enforceSingleFeatured`) and wired it into the article + mission create/update
  services: saving a featured item now clears `featured` on all other rows of that
  table. (Learn `featured` is a per-card badge and author `featured` a plain flag,
  both multi by design — left alone.) Note: the homepage hero *pin* in Admin →
  Homepage still overrides the featured article by design.
- ✅ **Homepage featured-story background more visible**: the hero photo sat at
  `opacity: 0.28` under a heavy `--hero-scrim` (0.55→0.9 dark), so it read almost
  black. Raised the image to `opacity: 0.5` and lightened `--hero-scrim`
  (0.40→0.78 dark, 0.32→0.85 light) — the token is only used by the homepage hero,
  so nothing else is affected. Headline/excerpt stay legible in both themes.
- ✅ **Article hero image broken on the reading page**: the article detail page
  (`app/news/[slug]`) was the only place still using `next/image`. With an empty
  `next.config.js` (no `images.remotePatterns`), the Next optimizer returns 400
  for any external host, so the featured image and author avatar broke — while the
  cards (plain `<img>`) worked. Converted both to plain `<img>` (the site's house
  pattern everywhere else — cards, missions detail, learn thumbnails), so any
  external / admin-entered URL loads directly with no host allow-list to maintain.

- ✅ **Admin missions could not be saved/deleted**: `MissionForm` and
  `MissionRowActions` POST/PATCH/DELETE to `/api/admin/missions`, but that route
  handler never existed — every save hit a 404 HTML page, `res.json()` threw, and
  the form showed the generic “Something went wrong” error. Added
  `app/api/admin/missions/route.ts` (POST/PATCH/DELETE, cookie-auth + enum
  validation) that calls the already-complete `create/update/deleteAdminMission`
  service functions.
- ✅ **Learn thumbnails never appeared on cards or article pages**: the public
  reader used `CARD_SELECT`/`FULL_SELECT` that omitted the `thumbnail` column, so
  `row.thumbnail` was always `undefined` even after admins set an image. Added
  `thumbnail` to both selects (plus the homepage `LearnSection` preview query),
  mapped it through `normalizeFull`/the `KnowledgeArticle` type, and rendered a
  cover image on the article reading page. Each query has a graceful fallback that
  re-selects without `thumbnail` if the migration hasn’t been applied, so cards
  never disappear.
- ✅ **Learn save gave no on-screen confirmation**: `LearnForm` redirected on
  success with no “saved” message and had no `catch`, so a thrown error surfaced
  nothing. Added a green success banner, a catch that shows a failure message, and
  a brief delay before redirect so the confirmation is visible.
- ✅ **Homepage news fetched 7 but showed 6**: aligned `getLatestArticles(6)` so
  the fetch matches the section’s slice (limits: news 6, missions 4, learn 6).

**Not yet done:** Phases 2–4 of the plan, and the polish items in §10.

---

## 3. Repository & workflow rules

- **Branch:** develop on `claude/understand-target-codebase-ecpqrw`. Create it
  from `main` if missing. Never push to another branch without permission.
- **If PR #20 is already merged**, treat follow-ups as fresh work: restart the
  branch from latest `main` (`git fetch origin main && git checkout -B <branch>
  origin/main`) and open a new PR. Never stack new commits on merged history.
- **Push:** `git push -u origin <branch>`; retry on network errors with backoff.
- **PRs:** open as **draft**. Mirror any PR template if present.
- **Commit messages:** clear and descriptive. **Never** put the internal model
  identifier in commits/PRs/code.
- **Always run `next build` before committing** non-trivial changes and confirm
  it compiles. The `supabaseUrl` page-data error is expected without env vars.

---

## 4. Architecture

Next.js **14 App Router**, TypeScript, Supabase, deployed on Vercel.

```
app/                     # routes (App Router)
  page.tsx               # homepage → modules/homepage
  news/[slug]/           # article reading page (SSR metadata: JSON-LD/OG/canonical)
  missions/ , learn/ , live/*  # public sections
  live/deep-space/       # data-driven live tracker (+ [id] detail)
  admin/*                # CMS (own layout, no public nav/footer)
  api/                   # server API-proxy layer (Horizons, ISS, launches, admin CRUD)
modules/                 # feature modules: components/ + services/ per feature
  homepage, news, missions, learn, deepspace, iss, nasa, launches, search, admin
components/layout/       # Navbar, Footer, ThemeToggle (global chrome)
config/                  # site.ts, navigation.ts, api.ts
lib/                     # supabase.ts, utils.ts
styles/                  # globals.css (design system), responsive.css, themes/
types/                   # shared TS types
supabase/migrations/     # SQL migrations + guide (see §7)
```

**Data pattern (preserve this):** pages **SSR** an initial render from a static
fallback (no network, no hydration risk), then a **client component refreshes
live** from an `/api/*` proxy (which calls the real upstream — NASA Horizons,
Launch Library, Supabase — with cached fallbacks). Example: `/live/deep-space`
→ `getDeepSpaceProbes()` (SSR) → `DeepSpaceTracker` fetches `/api/deep-space`.

---

## 5. The design system  ⭐ (most important section)

Everything visual flows through **CSS custom properties** in
`styles/globals.css`. **Never hardcode colors in components.**

### Tokens
- Surfaces: `--black` (page), `--surface` (secondary), `--panel` (cards),
  `--raised`. CosmosDaily aliases exist too: `--bg-primary/secondary/card`.
- Text: `--white` (primary), `--dim` (secondary), `--faint` (muted). Aliases:
  `--text-primary/secondary/muted`.
- Accent/semantic: `--accent`, `--accent-hover`, `--green`, `--gold`, `--red`,
  `--border`.
- Geometry: `--radius` (12px), `--radius-sm` (8px), `--nav-height`, `--max-width`
  (1200px), `--card-shadow`, `--nav-bg`, `--hero-scrim`.

### Theme (`--ink`) — how light/dark works
- A manual toggle (`components/layout/ThemeToggle.tsx`) sets
  `data-theme="light"` on `<html>` and saves to `localStorage`. An inline script
  in `app/layout.tsx` applies it **before paint** (no flash).
- **Dark is the default** (`:root`); light overrides live in
  `:root[data-theme="light"]`. Only base tokens flip there.
- **`--ink`** is the RGB triplet behind translucent text/borders/overlays:
  `255,255,255` in dark, `15,15,26` in light. **Any translucent white must be
  written `rgba(var(--ink), <alpha>)`** — never `rgba(255,255,255, …)`. This is
  what makes text/borders/overlays theme-aware. (Dark mode is byte-identical to
  before, since `--ink` = white there.)

### Component classes (use these, don't reinvent)
`.container` (1200px, side padding) · `.section` (vertical padding **only** — see
gotcha in §11) · `.section-head` + `.section-title` + `.section-eyebrow` ·
`.grid-3` (auto-fill minmax 300px) · `.card` / `.card-image` / `.card-body` /
`.card-category` / `.card-title` / `.card-excerpt` / `.card-meta` (hover-lift
built in) · `.btn` / `.btn-primary` / `.btn-outline` · `.page-header` /
`.page-title` / `.page-lede` (inner-page header band) · `.prose` (static/legal
reading column) · `.tag` / `.tags-row` (filters/chips) · `.hero-badge`.

### Typography rule
- **Sans** (`var(--font-sans)`, Segoe UI stack) for UI, headings, card titles,
  labels. Headings are **bold sans**.
- **Merriweather serif** (`var(--font-serif)`) **only** for the *reading body* of
  article (`app/news/[slug]`) and learn pages. Nowhere else.
- **DM Sans** (`var(--font-mono)` — misnamed; it's the label face) for
  eyebrows/meta/labels.

---

## 6. RULES / invariants (do not break)

1. **No hardcoded colors** in components. Use tokens, or `rgba(var(--ink),a)` for
   translucent text/borders/overlays. New colors → add a token.
2. **Everything must work in both themes.** Test the toggle. Headings/text that
   used hard `#ffffff` or `#0a0a0f` must use `var(--white)` / `var(--black)`.
3. **Typography rule** from §5 (sans everywhere; serif = reading body only).
4. **Preserve the SSR-fallback → client-live-refresh** data pattern for live data.
5. **SEO discipline (Plan §8)** — non-negotiable for the eventual cutover:
   - Keep URLs stable; any changed URL gets a **permanent 301** (never JS redirect).
   - Carry forward/improve **meta description, OG tags, canonical URL, JSON-LD**
     on every migrated page (the `app/news/[slug]` route is the proven pattern).
   - Keep `sitemap.xml` in sync; preserve `robots.txt` (admin stays disallowed).
   - Roll out **one page at a time** behind the `vercel.json` rewrite; watch
     Search Console 1–2 weeks before the next. Never gut page content.
6. **Never touch the archive** (`archive/antariksham-black-design` branch,
   `styles/themes/antariksham-black.css`).
7. **Don't break dark mode** — it's the shipped identity. New tokens must keep
   dark rendering unchanged.
8. **Leave intentional exceptions alone**: the Google SERP preview colors in
   `modules/admin/components/SEOCenter.tsx` are meant to look like Google.
9. **Build before commit.**

---

## 7. How-to recipes

**Add a public page:** wrap in `<div style={{paddingTop:'var(--nav-height)'}}>`,
a `<header className="page-header"><div className="container">…</div></header>`
(eyebrow via `.card-category`, `.page-title`, `.page-lede`), then
`<main className="container section">` with a `.grid-3` of `.card`s or a
`.prose` column. Copy `/news` or `/about` as a template.

**Add a card:** `<a className="card"><img className="card-image"/><div
className="card-body"><p className="card-category"/><h3 className="card-title"/>
<p className="card-excerpt"/><div className="card-meta"/></div></a>`. Hover-lift
is automatic.

**Add a live-data feature:** create `app/api/<thing>/route.ts` (proxy upstream +
cached fallback), a `modules/<thing>/services/get<Thing>.ts` (static SSR
fallback), and a client component that SSRs the fallback then fetches the API on
an interval. For **live-incrementing numbers**, follow `DeepSpaceTracker`: render
the base value on the server, start a `setInterval` tick after mount
(`mounted` flag) to avoid hydration mismatch, compute `base + rate × elapsed`.

**Add a Learn thumbnail:** run `supabase/migrations/*_add_knowledge_article_thumbnail.sql`,
then add `thumbnail` to the two selects noted in `supabase/migrations/README.md`.
The admin Learn editor (`/admin/learn`) already writes it (degrades gracefully
before the migration).

**Add an admin CMS section:** mirror the Learn CMS — a
`modules/admin/services/admin<Thing>.ts` (list/getById/create/update/delete), an
`app/api/admin/<thing>/route.ts` (cookie-authed POST/PATCH/DELETE), a
`<Thing>Form.tsx`, `<Thing>RowActions.tsx`, `app/admin/<thing>/{page,new,[id]}`,
and a sidebar entry in `AdminSidebar.tsx`.

**Add a deep-space probe:** add it to the registry in
`app/api/deep-space/route.ts` (with a verified Horizons SPKID + fallback) and to
`STATIC_PROBES` in `getDeepSpace.ts`, plus a `META` entry (emoji/hue/blurb) in
`DeepSpaceTracker.tsx`. A card + detail page appear automatically. (Only add
craft that **recede** from the Sun; L2/orbiting instruments like JWST need a
different card variant.)

---

## 8. Original design preservation

The pre-reskin "black" identity is frozen in three places (all safe to revive
from; none should be modified):
- `styles/themes/antariksham-black.css` — the original `:root` tokens; copy back
  to revive.
- Remote branch **`archive/antariksham-black-design`** at the pre-reskin commit.
- Local tag `design/antariksham-black-v1` (tag push was blocked by the env; the
  branch is the pushable equivalent).

---

## 9. Rollout / cutover mechanism (Plan Phase 3)

Production cutover happens through `space-website/vercel.json` **rewrites**: a
route on `cosmosdaily.space` is proxied to the new engine one page at a time
(already proven for `/article/:slug`). To migrate a page: reach URL/metadata
parity, add a rewrite for that path, verify in Search Console, then proceed. A
bad migration is a one-line revert.

---

## 10. Remaining work / roadmap

**Plan phases still open:**
- **Phase 2 — Data migration:** move CosmosDaily's flat category/tag fields into
  Antariksham's relational `categories`/`tags` join tables (one-time script).
  *Script written* — `scripts/migrate-cosmosdaily-articles.mjs` (dry-run by
  default; reads the old project, reshapes into the new relational schema). Old
  and new are **separate** Supabase projects, so it does export→import→reshape.
  Not yet run — needs the two projects' service keys + a go-ahead. See
  `scripts/README.md` for the field mapping, gap decisions, and the required
  `/article/:slug → /news/:slug` 301s.
- **Phase 3 — URL & metadata parity, then staged cutover** via `vercel.json`
  (see §9), honoring §6.5.
- **Phase 4 — Advanced features** (only after cutover): 3D planet rendering
  (Three.js / R3F via `next/dynamic({ssr:false})`, scoped so the WebGL bundle
  never loads on other routes), satellite data control center (extend the
  API-proxy pattern), advanced astronomy tools (each as its own `modules/<tool>/`).

**Lunar Landing Simulator (`/lunar-sim`, testing):**
- ~~3-D visualization milestone~~ done — see §2. Possible polish: GLTF lander
  model, dust particles at low altitude, orbit controls for free camera.
- ~~`SITE_REPO_TOKEN` setup~~ done — the FSW repo's CI has successfully
  auto-published wasm to `public/wasm/` (see the `chore(lunar-sim)` bot commit).
- ~~Ship-or-delete decision~~ shipped: noindex removed, OG/canonical/JSON-LD
  added, linked from the `/live` hub and footer Intelligence column. (No
  sitemap file exists in the app yet — when one is added, include `/lunar-sim`.)

**Site-level polish TODOs:**
- Nav links are still Antariksham's uppercase-mono style; CosmosDaily's are
  sentence-case sans — decide.
- Light-mode edge cases: decorative gradient covers (LearnThumb, hero fallback)
  fade toward the light surface — consider pinning dark. A few badges flip to
  dark-on-color text.
- Admin CMS still uses serif headings (internal tooling; flip if desired).
- Deep Space: JWST/orbiting-instrument card variant; real probe photos via
  `META.image`.
- Learn: wire real thumbnails after running the migration.

---

## 11. Gotchas / lessons

- **CSS cascade collisions:** don't put the `padding` *shorthand* on a class that
  co-occurs with another padding-setting class. `.section` sets
  `padding-top/bottom` only so `.container.section` keeps its horizontal padding.
  Watch for `.class-a.class-b` fighting over the same property.
- **Hydration-safe live numbers:** render the base/data value on the server;
  only start ticking after mount (a `mounted` flag), or SSR/CSR diverge.
- **`next/font`:** fonts are self-hosted via `next/font/google` in
  `app/layout.tsx` (Merriweather, DM Sans). No external font CDN.
- **The `supabaseUrl is required` build error** at page-data collection is
  expected when Supabase env vars are missing; it is not an app bug.
- **Two white forms exist:** `#ffffff` and `#fff`. When tokenizing, sweep both.
  Also check globals.css rules (`h1–h6`, `.card-title`) not just components.

---

## 12. Key files

| Path | What |
|---|---|
| `styles/globals.css` | **The design system** — tokens, themes, all CosmosDaily classes. |
| `app/layout.tsx` | Root layout, fonts, no-flash theme script, nav/footer wiring. |
| `components/layout/{Navbar,Footer,ThemeToggle}.tsx` | Global chrome + theme toggle. |
| `modules/*/components|services` | Feature UI + data. |
| `app/api/*` | Server proxy + admin CRUD routes. |
| `supabase/migrations/` | SQL migrations + how-to guide. |
| `styles/themes/antariksham-black.css` | Archived original design. |
| The uploaded **Engine Migration Plan PDF** | Strategy of record (phases, SEO rules, Appendix A tokens). |

---

*Keep this file current. When you finish a task, update §2 (done) and §10
(remaining) so the next reader starts from truth.*
