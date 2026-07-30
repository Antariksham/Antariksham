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
- ✅ **Every public page rebuilt on that system**: homepage, `/articles`, `/missions`,
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
- ✅ **`/lunar-sim` stochastic missions**: the simulator is now an infinite,
  per-mission-unique experience. `modules/lunar-sim/services/proceduralTerrain.ts`
  generates a seeded simplex-noise + crater surface each **New mission**
  (rendered as a displaced `PlaneGeometry` in `LunarScene.tsx`), scans it for
  the flattest reachable **safe zone** (holographic ring + beacon marker),
  surveys the approach corridor and stages the rough stretches into the wasm
  bridge as **hazard zones** (`clearHazardZones`/`addHazardZone`) so the C++
  HDA reasons about the rendered surface. Gate physics are randomized per run
  (altitude 800–1500 m, lateral drift ±5 m/s, descent rate, payload/dry-mass
  variance, gate pitch — new `WebScenarioConfig` fields in the FSW repo's
  `wasm/selene_wasm.cpp`; ranges validated by Monte Carlo against the FSW).
  A **localStorage scoreboard** (`services/missionStats.ts`,
  `cosmosdaily.lunar-sim.stats.v1`: total_attempts / safe_landings / crashes)
  records each touchdown verdict and drives a hydration-safe **success-rate
  widget** in the telemetry grid.
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
  (`app/articles/[slug]`) was the only place still using `next/image`. With an empty
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

- ✅ **Admin auth moved to Supabase Auth**: retired the single shared
  `ADMIN_PASSWORD` (which was stored verbatim in the session cookie, with a
  brute-force lock that lived in a client-controlled cookie). Admin access now
  uses real Supabase Auth accounts gated by a new `admin_users` table (with a
  `role` column as the foundation for future team roles). Sign-in supports
  email + password and an email 6-digit code; password reset is OTP-based
  (`supabase/migrations/20260720120000_admin_users.sql`). SSR session handling
  lives in `utils/supabase/{client,server,middleware}.ts`; `middleware.ts`
  refreshes the session and protects `/admin`; the admin layout and every
  `/api/admin/*` route enforce active-admin membership via
  `modules/admin/services/getAdminUser.ts`. Bootstrap steps are in
  `supabase/migrations/README.md`.

- ✅ **Media Library — per-asset detail drawer (Phase 5a)** — until now metadata
  could only be set at the moment of upload, which left every pre-Phase-4 image
  stuck with a filename-derived title and no way to fix it.
  - **`MediaDetailDrawer`**: click any card (preview or filename) to edit title,
    alt text, caption, credit and tags, saved via `PATCH /api/admin/media/<id>`.
    Also shows read-only file facts (dimensions, size, type, provider, bucket,
    added date, storage key) plus copy URL / open / delete. Escape closes;
    closing with unsaved edits confirms first.
  - **Alt is required at upload but only warned about here** — refusing to save a
    title fix because a different field is incomplete would punish the person
    improving the record. Cards show a `No alt` badge instead, so the gap is
    visible without being an obstacle.
  - **Saves merge into the grid in place** (`updateItem`) rather than refetching:
    a refetch would reset scroll and can reorder or drop the row being edited,
    because results depend on the fields just changed.
  - `isMetaDirty` compares what would be *saved*, not raw fields, so a half-typed
    tag counts as a change while a decorative toggle that leaves the stored alt
    identical does not. `metaFromAsset` treats `alt_text = ''` as decorative and
    `null` as undescribed.
  - Verified by driving the drawer in a headless browser in both themes, which
    caught a real layout bug no test would have: as a flex child of the
    scrolling column, the preview's aspect-ratio box collapsed to zero height and
    the image vanished entirely. 8 new unit tests cover the seeding and
    dirty-tracking rules (45 total).

- ✅ **Media Library — Phase 4 follow-ups from review on the deployed panel.**
  Three defects surfaced once it was in front of real data:
  - **Every card showed a generic file icon instead of the image.** The grid
    draws an `<img>` only when `kind === 'image'`, and the mapping introduced in
    Phase 2 never set the field — the whole library rendered as a wall of icons.
    The mapping moved out of the route handler into a pure, tested
    `mediaMapping.ts` (untested glue between two layers is exactly where this
    hides), and a null mime now resolves to `image` rather than `file`, since
    rows imported by Sync from Storage often have no mime recorded.
  - **A tag typed without pressing Enter was silently discarded**, which looks
    identical to "I tagged it mars and search found nothing". The half-typed
    draft is now owned by the parent (`mediaMeta.ts`) and merged on submit by
    `resolveTags`, so what is on screen is what gets saved — committing on blur
    alone would only have turned the bug into a race with the click handler.
    Cards also show their tags now, so this is visible rather than silent.
  - **Search was scoped to the open bucket tab.** An image uploaded to
    `mission-images` was reported as "no matches" when searched from
    `article-images`. Buckets are storage locations, not subject boundaries: a
    query now spans both, the count says *all buckets*, and each result card
    carries a bucket badge. Tabs still scope browsing.
  - **Cloudinary asked for nothing** and left assets titled after the phone's
    filename. `<CldUploadWidget>` is a third-party iframe that hands the file
    over only after it lands, so metadata is collected immediately afterwards:
    `PATCH /api/admin/media/<id>` plus `MediaMetadataDialog`, sharing
    `MediaMetaFields` with the Supabase dialog so the two providers cannot drift.
  - 14 new regression tests cover the mapping and the tag-draft merge
    specifically (37 total across the media helpers).

- ✅ **Media Library — upload-time metadata (Phase 4)** — the step that makes
  the index worth having. Phases 1+2 made the whole library searchable, but
  could only index words that already existed, and `IMG_4471.jpg` has none.
  Files are now **staged, not uploaded**: `MediaUploadDialog` opens between
  picking and uploading and asks for a title (prefilled from the filename), alt
  text and tags.
  - **Findability**: tags apply to the whole batch with per-image extras, and
    autocomplete over existing tags (`media_tag_suggestions`, added in
    `supabase/migrations/20260730120000_media_tag_suggestions.sql`) keeps the
    vocabulary converging — `normalizeTags` enforces one spelling regardless.
  - **Accessibility**: alt text is required, with a *Decorative* checkbox that
    writes an explicitly empty alt — the correct signal, and a different thing
    from a missing one.
  - **Dedupe**: every file is SHA-256'd in the browser and checked against the
    library in one batched `POST /api/admin/media/precheck` before any bytes
    move; duplicates are shown in the dialog and skipped. The server recomputes
    the checksum itself and re-checks, so the client hint is an optimisation,
    never a gate.
  - **Content-hash keys**: `<yyyy>-<mm>-<slug>--<sha256[0..8]>.<ext>`, so
    uploads are idempotent and the objects can be served immutable for a year.
    Kept flat rather than `yyyy/mm/` folders because Supabase Storage's `list()`
    is non-recursive and folders would break the resumable sync walk. **Existing
    keys are never touched** — published articles store absolute URLs.
  - **Thumbnails**: a 400×250 WebP derivative generated in a canvas in the
    browser (the image is already decoded there), stored under a `thumbs/`
    prefix and deleted with its asset. Avoids both a native image dependency in
    the serverless bundle and the paid Storage render transform; degrades to the
    original if the browser cannot encode WebP.
  - Verified with 23 unit tests on the naming/hashing/tag helpers and 10 SQL
    cases covering tag suggestions, prefix and provider scoping, LIKE-escaping,
    soft-delete exclusion, and that the unique checksum index actually rejects a
    second live copy while freeing the checksum after a soft delete.

- ✅ **Media Library at scale (Phases 1+2)** — `media_assets` is now the
  searchable **index of record** for both providers, and the library no longer
  lists Storage. Previously the Supabase tab read the bucket directly with a
  hard `limit: 200` and filtered filenames in the browser, so image 201 was
  invisible and "mars" could only match a filename.
  - **Migration** (`supabase/migrations/20260729120000_media_library_index.sql`):
    per-asset descriptive columns (`alt_text`, `caption`, `credit`,
    `photographer`, `tags`, `collection_id`, `checksum_sha256`, `blurhash`,
    `deleted_at`, …), a one-level `media_collections` table, a weighted
    generated `search_vector`, GIN indexes (full text, tags, `pg_trgm` on
    `title` + `storage_key`), a partial btree for keyset pagination, and the
    `search_media_assets` / `count_media_assets` functions. Additive and
    idempotent.
  - **API** (`app/api/admin/media/route.ts`): `GET` searches the index with
    filters + an opaque keyset cursor and returns `{ items, nextCursor, total }`
    (total on the first page only, fetched in parallel); `POST` writes a row on
    every upload and rolls the object back if indexing fails; `DELETE` resolves
    by asset id. `POST /api/admin/media/sync` is a resumable importer for files
    uploaded before the index existed.
  - **UI**: shared `useMediaSearch` hook (debounced, race-safe) + `MediaSearchBar`
    + "Load more" in `MediaGrid`. **Both** panels use it, so the Cloudinary tab
    gains the search and pagination it never had.
  - **Measured at 50,003 rows**: first page 0.6 ms, deep keyset page 0.5 ms,
    selective search 0.7 ms, common search 1.1 ms. Four planner traps found by
    reading EXPLAIN rather than by inspection — a CTE in the function body cost
    ~300× by blocking inlining, a `count(*) over ()` window made every page scan
    the whole match set, a scalar count function planned blind at 190 ms, and an
    unindexed `OR` branch collapsed the whole `BitmapOr`. All four are written
    up in the doc and the migration comments.
  - Remaining phases (upload-time metadata, usage graph, filter rail) are in
    §10 and [`docs/MEDIA_LIBRARY_ARCHITECTURE.md`](./docs/MEDIA_LIBRARY_ARCHITECTURE.md).

- ✅ **Multi-provider Media Library (Supabase + Cloudinary)**: refactored the
  admin Media Library into a tabbed, provider-adapter architecture under
  `modules/admin/media/` (thin `MediaLibrary` shell + shared `MediaGrid` +
  per-provider panels). The Supabase tab is unchanged (lists Storage buckets
  directly); a **Cloudinary** tab (delivery-optimized AVIF/WebP) was added with
  signed uploads via `<CldUploadWidget>` + `actions/cloudinary-media.ts` +
  `app/api/admin/cloudinary/sign`. A new `media_assets` table
  (`supabase/migrations/20260720130000_media_assets.sql`) tracks non-Storage
  providers (the enum reserves an `r2` slot for a future Cloudflare R2 tier).
  The Cloudinary tab is **feature-flagged** on `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`,
  so the panel is identical to before until the Cloudinary env is set. Public
  props (`pickerMode`/`onPick`) are unchanged, so the article/mission/author/
  learn forms need no edits.

- ✅ **Renamed the news section to "Articles"**: `/news` → `/articles` (route,
  nav, page header, all internal links, sitemap) with permanent **301 redirects**
  from `/news` and `/news/:slug` in `next.config.js`. Code moved to
  `modules/articles/` (`ArticlesPage`, `getArticles`). The eventual CosmosDaily
  cutover 301s are now `/article/:slug → /articles/:slug`.

- ✅ **Bilingual content (Hindi, extensible) — Articles, Learn & Missions**: any
  of these can be read in English or a hand-written translation **without
  becoming a separate item** — one slug, shared metadata (and, for articles, one
  shared `views` counter). English lives in the base table; other languages live
  in a sibling `*_translations` table (`article_translations`,
  `knowledge_translations`, `mission_translations` — RLS public-read
  published-only, no anon writes). Translations are fetched in a **separate,
  tolerant lookup**, never embedded in the core read, so content still renders if
  a translation table is absent (deploy order doesn't matter). English is
  unprefixed; other languages are path-prefixed (`/hi/articles/:slug`,
  `/hi/learn/:slug`, `/hi/missions/:slug`) with an on-page language toggle
  (`components/LanguageToggle`), `hreflang`/canonical alternates, `lang`
  attributes, and a Devanagari system-font stack. Untranslated items fall back to
  English (`/hi` fallback page = `canonical→EN` + `noindex`). **All detail routes
  render dynamically** (`force-dynamic`) — required because the root layout reads
  `headers()`, which otherwise makes an on-demand SSG/ISR render throw
  `DYNAMIC_SERVER_USAGE`. Admin: a language tab in each editor (generic
  `TranslationEditor` → `/api/admin/{articles,learn,missions}/translations`).
  Config in `lib/i18n.ts` — add a language there + write translations, no schema
  change. Translated fields: articles/learn = title/excerpt/content; missions =
  name/description (timeline stays English for now). **Run migrations
  `20260722180000_article_translations.sql`, `20260723090000_knowledge_translations.sql`,
  `20260723091000_mission_translations.sql`.**

- ✅ **Click & navigation feedback indicators**: clicks worked but gave users no
  signal that the click registered or that a page was loading. Added (1) pressed
  `:active` states for `.btn`/`.card`/`.tag` plus an opt-in `.press` helper
  (transform+filter so it never collides with inline nav-link colors and fires
  on touch, where `:hover` doesn't) — applied to the nav links/logo/search pills;
  (2) a dependency-free site-wide top **navigation progress bar**
  (`components/layout/NavProgress.tsx`) that starts on any internal link click /
  browser back-forward and completes when the route commits
  (`usePathname`/`useSearchParams`), wired into the root layout under `Suspense`
  — the main "your click is loading" cue for slow `force-dynamic`/live routes;
  (3) hoisted `@keyframes spin` from `LaunchTracker`'s local `<style>` into
  `globals.css` (the admin Launches refresh spinner never actually rotated) and
  added a reusable theme-aware `components/ui/Spinner.tsx`. All feedback respects
  `prefers-reduced-motion`. Follow-up: the article/mission **"Related"
  recommendation cards** on detail pages were bespoke inline-styled divs (the
  article ones had no hover at all; the mission ones used imperative
  `onMouseEnter` JS) — converted both to the shared `.card` class so they get the
  same hover-lift + `:active` press as every other card. **Footer links** now use
  `.footer-link`/`.press` (hover brightens to primary text, active press) to
  match the nav. (Branch `claude/click-feedback-indicators-l6tm8o`, PR #41.)

- ✅ **Mission Control editor experience upgrade (Phase 1)** — the article editor
  (`ArticleForm`) is now a modern editorial system, backward compatible (content
  stays HTML; existing articles untouched). Branch `claude/nice-volta-x4b9yy`, PR #42.
  1. **Live preview** — the public reading column was extracted from `ArticleView`
     into a shared **`ArticleBody`** + `ArticleRenderModel` (one renderer for site
     *and* preview, so they can't drift). New **`.article-body`** stylesheet in
     `globals.css` is the theme-aware rendering contract for every rich block
     (headings, lists, checklists, quotes, callouts, tables, code, figures, fact
     cards, FAQ, timeline, references, math, kbd/mark/sup/sub) — it also gave
     articles proper paragraph spacing and restored list markers Tailwind Preflight
     strips. `modules/admin/preview/` renders it inside a same-origin **iframe**
     (real viewport → honest Desktop/Tablet/Mobile) with an Editor/Split/Preview/SEO
     toggle. New RGB-triplet tokens (`--accent-rgb`/`--green-rgb`/`--gold-rgb`/`--red-rgb`).
  2. **Rich block editor** (`modules/admin/editor/`) — contentEditable editor over
     the content field (toolbar, **slash commands**, shortcuts, markdown rules,
     sanitized paste) emitting the clean semantic HTML the `.article-body` classes
     style; Rich⇄HTML toggle. `sanitizeHtml` (allowlist, XSS-safe). **Autosave**
     (`useAutosave`): local backup + debounced server save (reuses the PATCH route,
     never republishes) + draft recovery + multi-tab conflict warning + SaveStatus.
  3. **Publish validation** (`modules/admin/publish/`) — `analyzeContent` +
     `validateArticle` → required/warning/SEO checks + live SEO/readability/content
     scores; sidebar **pre-flight checklist** gates Publish (Save-as-Draft always ok).
  4. **Featured image manager** (`modules/admin/media/FeaturedImageManager.tsx`) —
     drag-drop/paste/URL/library, validation, **focal point**, and attribution +
     licensing metadata persisted in the additive **`articles.featured_image_meta`**
     JSONB column (graceful fallback in admin + public reads; run
     `supabase/migrations/20260724120000_article_featured_image_meta.sql`). The
     public hero uses alt / focal / caption / credit.
  5. **SEO workspace** (`modules/admin/seo/`, "SEO" tab) — Google/X/Facebook
     previews of the real shipped metadata, focus-keyword analysis, meta
     optimise/generate, and Article/NewsArticle **JSON-LD** now emitted on the
     reading page (`ArticleView`) — structured data was previously absent.
  6. **Translation editor parity** (`ArticleTranslationEditor` rewritten) — the
     हिन्दी tab now gets the same rich block editor (Devanagari-aware via a `lang`
     prop threaded through `ContentEditorField`/`RichEditor`), Editor/Split/Preview
     modes (Editor shows the **rendered English reference** beside the Hindi editor;
     preview renders `lang="hi"` with the **shared** English metadata passed down as
     a `shared` prop from `ArticleForm`), autosave (per-language storage key, draft
     recovery, tab-conflict warning; server autosave only once the translation
     exists), and a **translation pre-flight** whose structure-parity check
     (`modules/admin/editor/translationChecks.ts`) enforces "same HTML tags,
     different words" against the English body. SEO workspace and featured-image
     manager are deliberately NOT in the translation tab — those fields are shared
     from English by design.

- ✅ **Automatic Table of Contents (Phase 2, Feature 1)** — every article now
  gets a TOC generated automatically from its H2/H3/H4 headings; no manual
  authoring, works for every article, updates live in the editor preview and on
  publish. Branch `claude/antariksham-phase-2-upgrade-erz812`.
  - **Pure, isomorphic core** (`modules/articles/services/toc.ts`): `buildToc`
    injects a stable, de-duplicated, unicode-aware (Hindi-safe) slug `id` onto
    every H2/H3/H4 and returns a nested `TocItem` tree. Deterministic → the ids
    rendered during SSR match what the client computes (hydration-safe) and
    authored ids are preserved. Zero-dependency unit tests (`toc.test.ts`, Node's
    built-in `node:test`; run `node --test --experimental-strip-types …`).
  - **`TableOfContents` component** (`modules/articles/components/TableOfContents.tsx`):
    sticky sidebar rail on desktop, collapsible `<details>` panel on mobile;
    scroll-spy current-section highlight, reading-progress meter, smooth
    scrolling, deep-link anchors + copy-section-link, expand/collapse, full
    keyboard/ARIA support, `prefers-reduced-motion`. **Iframe-safe**: resolves
    `document`/`window` from the nav's `ownerDocument`/`defaultView`, so
    scroll-spy is correct both on the real reader and inside the admin
    live-preview iframe.
  - **Integration**: `ArticleBody` injects the ids (so anchors work everywhere,
    including the preview) and renders the inline TOC; `ArticleView` adds the
    desktop rail inside a centred 3-track `.article-layout` grid (reading measure
    stays centred, rail floats in the right gutter). New theme-aware
    `.article-layout`/`.article-toc*` styles in `styles/globals.css` (tokens +
    `rgba(var(--ink),a)`; light + dark). Backward compatible — only additive
    `id`s change existing article HTML.

- ✅ **Professional Reader Experience (Phase 2, Feature 2)** — the article
  reading page gained an enterprise-grade reading layer, all additive and
  backward compatible. New `modules/articles/reader/` module.
  - **Reading progress bar** (`ReadingProgressBar`) — thin accent bar pinned
    under the nav, fills continuously via a GPU `scaleX` transform.
  - **Share** — desktop **sticky share rail** in the article grid's LEFT gutter
    (mirroring the TOC rail on the right): X, Facebook, LinkedIn, WhatsApp,
    Telegram, Email, Copy Link, Bookmark. Mobile **action dock** (`ReaderDock`)
    with a share FAB that uses the **native Web Share API** when present and a
    fallback menu otherwise, plus a back-to-top FAB. URL builders are pure &
    tested (`shareLinks.ts`).
  - **Reading preferences** (`ReaderPreferencesPanel`) — modal to set **font
    size / reading width / line height / theme**, persisted to localStorage and
    applied as CSS custom properties (`--reader-font-scale`, `--reader-line`,
    `--reader-measure`) the article body reads with fallbacks — so defaults and
    the admin preview are byte-identical to before. Pure prefs model + mapping
    tested (`readerPrefs.ts`).
  - **Reading statistics** — word count, reading time, views, publish + updated
    dates, and a live **“% complete · min left”** in the preferences panel.
  - **Scroll behaviour** — smooth anchor scrolling (shared with the TOC),
    back-to-top, and **remember/resume last position** per slug
    (`ResumeReading`, offers a resume pill on reload).
  - **Architecture**: a client `ReaderProvider` context holds prefs/bookmark/
    share-meta/panel-open; scroll work is isolated in a small `useReadingProgress`
    hook (no context re-renders on scroll). Wired into `ArticleView`; the body
    honours the reader vars. Theme-aware `.reader-*` styles in `globals.css`
    (light + dark, `prefers-reduced-motion`, full keyboard/ARIA). Zero-dependency
    `node:test` unit tests (`modules/articles/reader/reader.test.ts`).

- ✅ **Advanced Article Components (Phase 2, Feature 3)** — a big library of
  premium content blocks, all authored as sanitized semantic HTML (SEO-friendly,
  printable, backward compatible) and, where interactive, upgraded client-side.
  New `modules/articles/blocks/`.
  - **New static blocks** (pure `.article-body` CSS + editor entries): Key
    Takeaways, Did You Know, Alert box, Pull Quote, Mission Statistics grid,
    Glossary, Research Summary, Comparison Table, Specification Table, Horizontal
    Timeline — alongside the Phase-1 blocks (fact card, callouts, FAQ, vertical
    timeline, references, footnotes, math, table, code, gallery).
  - **`ArticleEnhancer`** (client, progressive enhancement, iframe-safe,
    defensive per-block, idempotent): code **syntax highlighting + copy button**
    (dependency-free tokenizer in `blockUtils.ts`), live **Countdown**, **Image
    Carousel** (track + arrows + dots), image **Lightbox** (gallery/carousel/
    opt-in), **sortable Data Table** (click/keyboard, `aria-sort`), **Embedded
    PDF**, and **KaTeX math** (code-split — `import('katex')` only when the
    article has math; CSS ships from the route page). Everything degrades
    gracefully with JS off.
  - **Embeds**: YouTube (existing), Embedded PDF, Tweet/X facade, NASA/ESA media
    (agency-badged figures).
  - **Editor**: ~18 new blocks added to `EDITOR_BLOCKS` (slash-searchable); the
    `sanitizeHtml` allowlist was extended for the new classes, structural
    containers and `data-*` config attributes (URLs still validated at enhance
    time).
  - **CSS**: theme-aware block styles + interactive-UI styles + the site's first
    **`@media print`** rules (drops the reading chrome, avoids break-inside on
    cards/tables, reveals collapsed FAQ answers, prints link URLs). Wired into
    `ArticleView` via `<ArticleEnhancer />`. Pure helpers covered by
    zero-dependency `node:test` tests (`modules/articles/blocks/blocks.test.ts`).

- ✅ **Reference & Citation Management (Phase 2, Feature 7)** — a scientific
  citation system for the editor. New `modules/admin/citations/`.
  - **Pure core** (`citationTypes.ts` + `formatCitation.ts`): 12 citation types
    (journal, book, research paper, conference, arXiv, DOI, website, video,
    dataset, NASA, ESA, ISRO) formatted in **APA / MLA / Chicago / IEEE** (+
    verbatim Custom), with per-style author reformatting (e.g. APA “Last, I. I.”
    vs IEEE “I. I. Last”), `validateCitation` (missing title/source/year, broken
    URL, malformed DOI), a stable reuse `citationKey`, duplicate detection, and
    the inline-marker + numbered references-block builders. All output is
    escaped (XSS-safe) and survives the editor sanitizer. 20 zero-dependency
    `node:test` cases (`citations.test.ts`).
  - **Citation Manager** (`CitationManager.tsx`): a modal launched from a new
    editor-toolbar button. Build a citation with type-specific fields, see it
    live-formatted + validated, then **insert a numbered inline `[n]` marker**
    at the caret and (re)generate the article’s **References section**. A
    browser-local **library** (`citationLibrary.ts`) makes citations reusable;
    the chosen style is stamped on the block (`data-style`) so it restores on
    reopen. Auto-numbering by add-order with de-dupe (reusing a source keeps its
    number).
  - **Public rendering**: inline `.cite-ref` superscript links + a numbered,
    anchored `.references.citations` list with `:target` highlight and
    back-links. `sanitizeHtml` extended (id/data-cite/data-style, `references`
    made structural, cite classes). Theme-aware CSS incl. print.
  - **Known follow-ups**: numbering is by add-order (removing/reordering may
    leave a stale inline marker — a full by-appearance renumber, and a shared
    server-backed team library, are natural next steps).

- ✅ **Advanced Search & Content Discovery (Phase 2, Feature 8)** — the admin
  Articles list became a professional content browser. New `modules/admin/search/`.
  - **Pure core** (`articleSearch.ts`): `searchArticles` = full-text search
    (every token must match across title/slug/author/category/tag) + filters by
    status/type/category/tag/author/featured, views & reading-time ranges, and a
    date range, then sort (updated/published/title/views/reading, asc/desc).
    Plus `computeFacets` (distinct values + counts) and `toCsv`. 11 zero-dep
    `node:test` cases (`articleSearch.test.ts`).
  - **`ArticleBrowser`** (client): instant search, a faceted filter panel
    (status/type/category/tag/author chips, metric ranges, date range, featured),
    **saved filter presets** (`savedFilters.ts`, localStorage), a sortable table
    with per-row + select-all **multi-select**, and a **bulk action bar**:
    Publish / Draft / Archive / Delete / Add category / Add tag / Assign author /
    **Export CSV**.
  - **Bulk backend**: efficient set-based service fns (`bulkUpdateStatus`,
    `bulkDeleteArticles`, `bulkAssignAuthor`, `bulkAddCategory`, `bulkAddTag` —
    single `.in('id', …)` queries) behind `app/api/admin/articles/bulk` (cookie-
    authed); the browser refreshes server data after each op.
  - **Scales to millions (done)**: search / filter / sort / paging now run in the
    **database** — `getAdminArticles(AdminArticleQuery)` builds the whole query
    server-side and returns one capped batch (`MAX_PER_PAGE = 100`), behind the
    admin-authed `app/api/admin/articles/list`. The page is **fully client-rendered**
    (no SEO behind admin auth): a static shell, then `ArticleBrowser` fetches its
    filter options (`app/api/admin/articles/options`) and first batch on mount and
    **infinite-scrolls** the rest (`IntersectionObserver` → fetch + append the next
    batch). A single API call never returns more than `perPage` rows regardless of
    corpus size — Supabase's per-request row ceiling is never approached. Category /
    tag / author are single-value DB filters (join-safe, exact counts); text search
    matches title + slug. `getFormOptions` is capped too. Multi-select / bulk / CSV
    operate on the loaded batches.
  - **Known follow-ups**: bulk / CSV act on the rows loaded so far — a
    "select-all-matching" that applies a bulk action by *filter* server-side (no
    id list) is the next step; facet chips show options without live counts
    (per-facet counts over millions are deliberately skipped).

- ✅ **Internal Linking Assistant (Phase 2, Feature 6)** — an editor helper for
  internal linking (better topical authority + crawlability, fewer orphans). New
  `modules/admin/links/`.
  - **Pure core** (`internalLinks.ts`): `suggestLinks` ranks internal pages by
    title-token overlap with the draft text (+ shared category/tag), excluding
    the current page and pages already linked (no duplicates); `searchTargets`
    (manual search); `extractInternalHrefs` + `findBrokenLinks` (internal links
    that don't resolve to a known page); `computeOrphans` (pages nothing links
    to); `buildLinkHtml`. 9 zero-dep `node:test` cases (`internalLinks.test.ts`).
  - **`LinkAssistant`** (editor modal, new toolbar button): fetches internal
    pages from `app/api/admin/link-targets` (published **articles** with facets,
    **missions**, **learn** pages, **authors** — real slug routes only, so a
    suggestion never itself becomes a broken link), shows ranked suggestions
    with colour-coded kind badges, a manual search, **one-click insert** (wraps
    the current selection or inserts the page title), an "already-linked" marker,
    and a **broken-internal-links** panel for the current draft.
  - **Known follow-ups**: tags/categories/launches have no dedicated slug pages
    yet (excluded to avoid broken links); a site-wide **orphan-pages dashboard**
    (the pure `computeOrphans` is ready) needs a cheap server link-graph.

- ✅ **Publishing Scheduler (Phase 2, Feature 4)** — schedule a future publish +
  automatic expiry, with the full publish lifecycle. New `modules/admin/scheduling/`.
  - **Pure core** (`scheduling.ts`): UTC-ISO ⇄ `datetime-local` conversion,
    `scheduleView` (draft/scheduled/live/expiring/expired/archived + countdown),
    `validateSchedule` (past schedule, expiry-before-publish), `humanizeMs`, and
    `dueForPublish`/`dueForExpiry` (cron selection). 5 zero-dep `node:test` cases.
  - **`PublishingScheduler`** panel (editor Publish sidebar): a live state pill +
    countdown, **Schedule publish** + **Auto-expire** datetime pickers (local
    time, stored UTC), validation, and lifecycle actions — **Publish now**
    (existing button), **Schedule**, **Republish** (re-stamp `published_at`),
    **Unpublish**, **Archive**, **Restore**. Hydration-safe (local-time inputs
    populate after mount).
  - **Backend**: additive migration **`20260726120000_article_scheduling.sql`**
    (`scheduled_at`, `expire_at` + partial indexes; run it). Service reads/writes
    with graceful fallback and honours `republish`; `runScheduledPublishing`
    promotes due scheduled → published and archives expired.
  - **Automatic transitions run inside Postgres via pg_cron** — the migration
    defines `public.run_scheduled_publishing()` and schedules it every minute, so
    **no external scheduler is required** (Vercel Hobby only allows daily crons).
    `app/api/cron/publish` remains for a manual "run now" (an admin, or a caller
    with `CRON_SECRET`). Scheduled/expired articles never leak — public reads
    already filter `status = 'published'`. If the migration can't enable pg_cron
    (permissions), it only NOTICEs — turn on pg_cron in Supabase → Database →
    Extensions and re-run.
  - **Known follow-up**: recurring publishing + real email/push notifications
    (the endpoint currently just performs the transitions; a scheduled-run digest
    is the natural next step).

- ✅ **Analytics Dashboard (Phase 2, Feature 5)** — a privacy-friendly audience &
  engagement dashboard at **`/admin/analytics`**. New `modules/admin/analytics/`.
  - **Pure core** (`analytics.ts`): DOM-free classifiers (`classifyReferrer`,
    `deviceFromUA`), `aggregateMetrics` (views, unique/returning visitors, avg
    read time, avg scroll depth, completion %, bounce %, shares, bookmarks),
    `timeSeries` bucketing (day/week/month/year), dimension `breakdown`
    (device/source/referrer/country), and `buildInsights` (best performing,
    fastest growing, top categories/tags/authors). Chart geometry helpers
    (`chartUtils.ts`: `niceMax`, `linePoints`, `toPath`, `toAreaPath`). 15
    zero-dep `node:test` cases (`analytics.test.ts`, `chartUtils.test.ts`).
  - **Privacy-friendly collection**: additive migration
    **`20260726130000_article_events.sql`** (`article_events`, RLS on, no public
    policies — service-role only; run it). No cookies, no PII: `visitor` is an
    opaque localStorage token, `session` a sessionStorage token; referrer is
    reduced to a host + coarse type, device to mobile/tablet/desktop, location to
    an ISO-2 country from the edge geo header. A client beacon (`beacon.ts` +
    `AnalyticsBeacon.tsx`, `navigator.sendBeacon`) records **view** on mount and
    **read** (max scroll depth + dwell) on page-hide; **share** and **bookmark**
    fire from the reader chrome. `app/api/analytics/collect` (public POST, always
    200) derives device/referrer/country server-side and inserts the row.
  - **Dashboard** (`AnalyticsDashboard.tsx`, client): a range selector (24h / 7d /
    30d / 12mo + custom dates), KPI tiles, a **single-series views-over-time
    line/area chart** with hover crosshair + tooltip, single-hue rounded
    horizontal **breakdown bars** (device / sources / referrers / countries),
    editorial **highlights** (best performing, fastest growing, top
    categories/tags), and a **top-articles** list. Follows the dataviz method
    (one accent hue, no legend — the title names the series; thin marks; recessive
    grid) and is **theme-aware by construction** (charts read `--accent-rgb` +
    `--ink`, so light + dark come for free). SSR fallback → client refresh from
    the admin-authed `app/api/admin/analytics` proxy on range change.
    `getAnalytics.ts` joins events with article metadata and **degrades gracefully**
    (friendly empty state) if the migration hasn't been applied. New sidebar link.
  - **Known follow-ups** (data populates as events accumulate): per-article deep
    dives, a scroll-depth heatmap, and metrics not yet tracked (comments/likes,
    city-level geo) are natural next steps; the collector + pure core are written
    to extend into them.

- ✅ **Collapsible admin sidebar** (`AdminShell.tsx`) — the admin chrome now
  wraps the fixed, independently-scrolling sidebar + content in a client shell
  that owns a collapse toggle. **Desktop**: a header button slides the sidebar
  off-canvas and the content reclaims the full width (choice persisted in
  localStorage); a floating button re-opens it. **Mobile (<900px)**: the sidebar
  becomes an off-canvas drawer over a scrim — hamburger to open, nav-tap /
  scrim-tap / Escape to close. `AdminSidebar` is now presentational (driven by
  props). Theme-aware CSS, `prefers-reduced-motion` respected.

- ✅ **Mission Management System — Enhanced Mission Identity (Phase 1, Feature 1)**
  — the first step of turning the Mission module from a basic form into a
  professional mission-management data model. Additive + fully backward
  compatible (legacy missions untouched). Branch `claude/antariksham-mission-upgrade-4zos7u`.
  - **Extensible data model**: one additive, nullable **`missions.details` jsonb**
    column (migration `20260726140000_mission_details.sql`, + `jsonb_path_ops`
    GIN index) namespaced by feature — `details.identity` for now, with room for
    `classification`/`specifications`/`objectives`/`launch`/`media`. Every
    existing top-level column (name, slug, status, mission_type, destination,
    launch_date, agency_id, featured, featured_image, timeline, description) is
    left alone. All read paths (`getMissionBySlug`, `getAdminMissionById`) and
    write paths (create/update) **degrade gracefully** — they re-select / retry
    without `details` if the migration hasn't been applied, so the core mission
    still saves and renders (same idiom as `articles.featured_image_meta`).
  - **New identity fields** (`MissionIdentity` in `types/mission.ts`, stored in
    `details.identity`): short name, acronym, subtitle, summary, objective,
    motto, official website, Wikipedia URL, press-kit URL, alias. Canonical
    name/slug/description stay top-level columns.
  - **Pure, tested core** (`modules/missions/services/`): `missionIdentity.ts`
    (normalize / defaults / `buildMissionDetails` merge that preserves future
    namespaces) and `missionValidation.ts` (URL validation + `coerceUrl`
    bare-domain→https, character limits, required vs. recommended rules).
    Severity model follows the spec — **errors block save, warnings allow it** —
    and is deliberately backward compatible: only name/slug/description (which
    every legacy mission has) and format errors (which legacy rows can't hit)
    block; missing summary/objective are **warnings**. 20 zero-dependency
    `node:test` cases (`missionIdentity.test.ts`, `missionValidation.test.ts`).
  - **Editor** (`MissionForm`): the mission info section is now a grouped
    **identity panel** (Mission Identity · Summary & Objective · Destination &
    Media · Links & References) with live character counters, inline field
    validation (errors after a save attempt; URL errors live), auto-`https://`
    on blur, and a post-save **suggestions** panel that surfaces the API's
    warnings — including a **duplicate-mission-name** check
    (`hasDuplicateMissionName`, non-blocking; slug stays hard-unique). Auto-slug
    from name + manual edit are preserved. Matches the existing CMS design
    language (tokens, font-mono labels, both themes).
  - **API** (`/api/admin/missions`): shared `validateMission` gates POST/PATCH
    (400 on blocking errors), coerces URL fields, and returns non-blocking
    `warnings[]`.
  - **Public mission page** (`MissionSlugPage`): additively renders acronym chip,
    subtitle, motto, a **summary lead** paragraph, a primary-objective callout,
    and official website / Wikipedia / press-kit links — all conditional, so
    legacy missions look exactly as before. Mission metadata now prefers the
    concise **summary** for the meta/OG description (falls back to description).
  - **Run migration `20260726140000_mission_details.sql`.** Remaining Phase 1
    features (2–8: classification, specifications, scientific objectives,
    advanced timeline, launch info, media management, completeness/validation)
    are queued — built one at a time.

- ✅ **Mission Management System — Rich Mission Classification (Phase 1, Feature 2)**
  — replaces the single status / type / destination / agency with a professional
  classification system. Additive + fully backward compatible. Branch
  `claude/antariksham-mission-upgrade-4zos7u`.
  - **Safe "primary projection" model** (no schema change, no enum risk): the
    base `status`, `mission_type`, `destination` and `agency_id` columns stay the
    canonical primaries that power every existing filter, card and join — they
    only ever receive a LEGACY value. The full richness lives in
    `details.classification`. `missionClassification.ts` owns the taxonomy AND
    the mapping (extended→legacy projection, legacy→extended fallback), so the
    feature is safe whether those columns are Postgres enums or plain text. 14
    zero-dep `node:test` cases.
  - **Status** — 15-stage lifecycle (Concept → Planning → Testing → Awaiting
    Launch → Launch Window Open → Upcoming → Active → Cruise → Orbiting →
    Landing → Surface Operations → Extended Mission → Completed → Failed →
    Cancelled), grouped Pre-Launch / In Flight / Concluded, each with a
    theme-safe colored indicator. The base `status` column stores the legacy
    rollup (e.g. *Cruise* → `active`), so the existing `/missions` status tabs
    keep working and even get more accurate. Legacy `in-development` ↔ `planning`
    round-trips.
  - **Mission Type** — multi-select over ~21 tags (Human Spaceflight, Robotic,
    Orbiter, Flyby, Lander, Rover, Helicopter, Space Telescope, Space Station,
    Sample Return, CubeSat, Cargo, Crewed, Tech Demo, Planetary Science, Earth
    Observation, Communications, Navigation, Astronomy, Deep Space, Experimental).
    The first selected is the primary (→ `mission_type` column).
  - **Destination** — searchable multi-select with 18 suggestions + free-form
    custom entries; first is primary (→ `destination` column).
  - **Space Agencies** — primary agency (→ `agency_id`) plus role-based
    multi-select for **Partner Agencies / Commercial Partners / Scientific
    Institutions** (arrays of `space_agencies` ids in `details.classification`).
    The public page resolves + renders them grouped by role.
  - **Editor**: new reusable `MissionClassificationFields` (type chips, a
    searchable `TokenField` for destinations + agency roles) in a "Mission
    Classification" group; the sidebar Status is now a grouped `StatusSelect`.
    All controlled + keyboard accessible; matches the CMS design language.
  - **Public + services**: `StatusBadge` now renders any status via the shared
    taxonomy (legacy on cards, extended on detail). `getMissionBySlug` resolves
    collaborator agencies; the mission detail page shows the extended status,
    multiple types, multiple destinations and a Partners & Collaborators section.
    `MissionPayload` now carries `classification`; the base columns are *derived*
    from it (single source of truth). No new migration (reuses `details`).

- ✅ **Mission Management System — Professional Mission Specifications (Phase 1,
  Feature 3)** — a dedicated engineering + programmatic spec sheet. Additive +
  backward compatible. Branch `claude/antariksham-mission-upgrade-4zos7u`.
  - **Model + validation** (`missionSpecifications.ts`, pure/tested): ~18 fields
    stored in `details.specifications` — launch vehicle, spacecraft name +
    manufacturer, launch/dry/payload mass, mission duration + expected lifetime,
    power source + output, comms, primary/secondary payload, budget, orbit type,
    scientific instruments (a list), mission family, program. Masses/power are
    free strings so editors can include units; `validateSpecifications` checks
    measurement fields read like a number (blocking), warns when dry/payload mass
    exceeds launch mass, and enforces character limits. Only stored when
    non-empty, so legacy rows stay clean. 11 zero-dep `node:test` cases (45
    total across the mission modules). Validation is **co-located** in the specs
    module (only the `FieldIssue` type crosses module lines) so the pure modules
    never import each other at runtime — keeping the TS-stripping test runner
    happy.
  - **Editor** (`MissionSpecificationsFields`): a grouped "Mission
    Specifications" section (spacecraft/programme, launch & orbit, a 3-up mass
    row, duration & power, payload & comms, an instruments token list, budget)
    that **reuses** the shared `SubLabel` + `TokenField` from the classification
    component. Primary/secondary **destination are shown read-only**, derived
    from the classification (single source of truth). Live validation feeds the
    same save gate.
  - **Public** (`MissionSlugPage`): a professional **spec-sheet grid** (blank
    fields skipped) plus scientific-instrument chips. `getMissionBySlug` /
    `getAdminMissionById` surface `specifications`; `MissionPayload` carries it;
    the API validates it. No new migration (reuses `details`).

- ✅ **Mission Management System — Scientific Objectives (Phase 1, Feature 4)** —
  expands the single objective field into a structured set. Additive + backward
  compatible. Branch `claude/antariksham-mission-upgrade-4zos7u`.
  - **Model** (`missionObjectives.ts`, pure/tested): `details.objectives` holds
    ordered lists of **secondary objectives, technology demonstrations,
    scientific questions, expected discoveries** plus a **mission significance**
    text. The single **primary objective stays in `identity.objective`**
    (Feature 1 — one source of truth); the objectives editor shows it read-only
    for context. Co-located `validateObjectives` enforces item + significance
    length limits (blocking; legacy rows have none). Only stored when non-empty.
    9 zero-dep `node:test` cases (54 total across the mission modules).
  - **Reusable `ReorderableTextList`** — a controlled string-list with **both**
    drag-and-drop (grip handle; HTML5 DnD, textarea stays selectable) **and**
    keyboard up/down reordering (accessible), add/remove. Feeds all four lists
    and is ready for Feature 5's timeline.
  - **Editor** (`MissionObjectivesFields`): a "Scientific Objectives" section
    (primary read-only reference + four reorderable lists + significance),
    reusing `SubLabel`. Live validation feeds the same save gate.
  - **Public** (`MissionSlugPage`): a Scientific Objectives section renders each
    non-empty list (bulleted) + the significance paragraph, below the primary
    objective callout. `getMissionBySlug` / `getAdminMissionById` surface
    `objectives`; `MissionPayload` carries it; the API validates it. No new
    migration (reuses `details`).

- ✅ **Mission Management System — Advanced Timeline Management (Phase 1,
  Feature 5)** — upgrades the simple timeline into a professional milestone
  system. Additive + backward compatible (old `{date,title,description,
  completed}` events normalise on load). Branch `claude/antariksham-mission-upgrade-4zos7u`.
  - **Model + logic** (`missionTimeline.ts`, pure/tested): `MissionTimeline` is
    extended with optional fields — detailed description, time, timezone,
    **status** (5 stages, color-coded), location, **importance** (4 levels),
    **event type** (17 suggested + custom), source/image/video URLs, notes, and
    a stable `id`. `completed` is kept in sync with `status === 'completed'` so
    old consumers still work. Includes `parseEventDate` (tolerant),
    `sortTimelineByDate`, `duplicateDateIndexes/Values`, and co-located
    `validateTimeline` (duplicate dates → warning; bad URLs + over-limits →
    error). 13 zero-dep `node:test` cases (67 total across the mission modules).
  - **Editor** (`MissionTimelineBuilder`): drag-and-drop reordering (grip
    handle; keyboard up/down too), expand/collapse per event, duplicate + delete,
    a one-click **Sort by date**, color-coded status + importance, a
    **duplicate-date** warning, an event-type `datalist`, and all the rich
    fields. Replaced the old inline builder in `MissionForm`. (Drag-reorder and
    auto-sort are both offered — stored order is WYSIWYG on the public page.)
  - **Public** (`MissionSlugPage`): the timeline rail now shows status-colored
    dots, date · time · timezone, event-type + importance badges, short + detailed
    descriptions, location, an image, and source/video links (notes stay private).
    Timelines are normalised in both read paths (`getMissionBySlug`,
    `getAdminMissionById`) and the API; the API validates them. No new migration
    (`timeline` stays its own jsonb column, now with richer objects).

- ✅ **Mission Management System — Improved Launch Information (Phase 1,
  Feature 6)** — a dedicated launch section with a live countdown. Additive +
  backward compatible. Branch `claude/antariksham-mission-upgrade-4zos7u`.
  - **Model + validation** (`missionLaunch.ts`, pure/tested): `details.launch`
    holds launch time, window start/end (`datetime-local`), site, pad, provider,
    rocket, country, mission number, **launch success** (unknown/success/partial/
    failure), livestream URL and a **countdown** flag. The launch **date reuses
    the base `launch_date` column** (single source of truth — moved into this
    section from the sidebar); the **press kit is shared from `identity.pressKit`**
    (shown read-only). Co-located `validateLaunch` enforces **logical date
    ordering** — window end ≥ start (error), launch date within the window
    (warning) — via lexicographic `datetime-local` comparison (no fragile Date
    maths), plus livestream-URL validation. Only stored when non-empty. 11
    zero-dep `node:test` cases (78 total across the mission modules).
  - **Editor** (`MissionLaunchFields`): the Launch Date + all launch fields in
    one "Launch Information" section (native date / datetime-local pickers, a
    success select, a countdown toggle, a read-only press-kit reference). The
    sidebar Launch Date panel was removed (it lives here now).
  - **Public** (`MissionSlugPage`): a Launch Information block — a success badge,
    a **hydration-safe live `LaunchCountdown`** (renders a placeholder until
    mount, then ticks to the window start / launch date+time), a key-value grid
    (date, time, site, pad, provider, rocket, country, mission number), the
    launch window, and a livestream link. `launchTargetTimestamp` picks the
    countdown target. Wired through `getMissionBySlug` / `getAdminMissionById` /
    the API (which validates it). No new migration (reuses `details` +
    `launch_date`).

- ✅ **Mission Management System — Enhanced Media Management (Phase 1,
  Feature 7)** — media beyond a single featured image, each asset with
  newsroom-grade metadata. Additive + backward compatible. Branch
  `claude/antariksham-mission-upgrade-4zos7u`.
  - **Model + validation** (`missionMedia.ts`, pure/tested): `details.media`
    holds single slots (**hero, patch, logo, agency logo, banner**) and list
    slots (**gallery, infographics, animations, videos, documents**). Every
    asset is a `MediaItem` (url + **alt, caption, credit, photographer, agency,
    source URL, copyright, license**). The **hero mirrors the base
    `featured_image` column** (single source of truth for cards + hero):
    `effectiveMedia` seeds the hero URL from `featured_image` on read, and
    `baseMissionColumns` writes `featured_image` back from `media.hero.url`.
    URL-less list items are dropped; co-located `validateMedia` blocks invalid
    asset/source URLs. Only stored when non-empty. 10 zero-dep `node:test` cases
    (88 total across the mission modules).
  - **Editor** (`MissionMediaFields`): replaces the single featured-image field
    with a full media section — single slots and add/reorder/remove list slots,
    each with a Media Library picker + a collapsible **Details & credits** panel
    (the 8 metadata fields). Images preview inline.
  - **Public** (`MissionSlugPage`): the **mission patch** floats by the title,
    the **agency logo** shows in the agency card, and a **Mission Media** section
    renders the banner, a responsive **gallery grid** (gallery + infographics +
    animations, with captions/credits, linking to the source), and **video** +
    **document** links. All images use `loading="lazy"` + `decoding="async"`.
  - **Optimisation**: automatic compression / responsive / **WebP + AVIF**
    delivery is provided by the existing **Cloudinary** media provider (the
    Media Library's Cloudinary tab) rather than reimplemented here; this feature
    adds lazy-loading, URL validation, and graceful `onError` hiding. Build-time
    blur placeholders would need `next/image` or a loader (a documented
    follow-up). No new migration (reuses `details` + `featured_image`).

- ✅ **Mission Management System — Mission Completeness & Validation (Phase 1,
  Feature 8)** — the capstone: a live completeness score + a professional
  checklist that pulls the whole system together. Branch
  `claude/antariksham-mission-upgrade-4zos7u`.
  - **Model** (`missionCompleteness.ts`, pure/tested): a `MissionSnapshot`
    (mirrors the form) is evaluated against a **checklist of 13 required + 9
    recommended** items across every feature; `evaluateCompleteness` returns each
    item's status (✓ done / ⚠ recommended-missing / ✕ required-missing) and a
    **weighted 0–100 score** (required fields weigh double). Checks read fields
    inline (no runtime cross-imports). 6 zero-dep `node:test` cases (**94 total**
    across the mission modules).
  - **Editor** (`MissionCompletenessPanel`, in the sidebar): a big live **score**
    + colored progress bar + "required / recommended complete" counts + the
    **to-do checklist** (outstanding items first, "Show all" reveals the ✓ ones),
    updating on every keystroke.
  - **Save-gating policy — the deliberate reconciliation.** Per the master
    prompt's "warnings allow saving; critical errors do not" **and** the hard
    backward-compatibility requirement: the save gate blocks only on **invalid
    data** — bad URLs, over-limit strings, illogical launch dates, missing
    name/slug/description — via the per-feature `validate*` functions
    (`validateAll` in the API + the form's live `issues`). **Incomplete** required
    fields (summary, hero, timeline, launch vehicle, objective, destination,
    primary agency, …) surface as ✕ in the checklist and lower the score but do
    **not** block saving, so every legacy mission stays editable. (Flipping any
    required item to hard-blocking is a one-line change in the checklist/gate if
    a stricter policy is ever wanted.) No new migration.

- ✅ **Explore section v1 — hub + Solar System Explorer** (`/explore`,
  `/explore/solar-system`) — the nav's `/explore` link finally resolves (it
  previously 404'd). New `modules/explore/` module. Branch
  `claude/explore-section-ideas-uuv5wo`.
  - **Interactive Solar System orrery** (`SolarSystemExplorer` + `OrrerySvg`):
    a top-down SVG map — Sun, 8 planets, the Moon (riding a small orbit around
    the Earth dot) and Pluto — with **true heliocentric positions** computed
    from JPL Keplerian elements (`services/orrery.ts`, pure, 11 node:test
    cases: Kepler solver, ecliptic projection, longitude/radius invariants).
    Distances are log-compressed (Pluto still visibly dips inside Neptune's
    orbit near perihelion) and body sizes exaggerated — an on-page note says so.
  - **Time travel**: Today / 1 mo/s / 1 yr/s controls + a locale-independent
    UTC date readout. Hydration-safe per §6: the server's render epoch is a
    prop (SSR = hydration byte-identical), the client re-syncs to "now" after
    mount, and animation only ever starts from a user action
    (`prefers-reduced-motion` gets 1 step/s instead of 10).
  - **Facts panel** (`BodyPanel`): per-body vitals grid, description, notable
    moons, and **"Missions here"** — the missions DB's free-text `destination`
    is matched to bodies via whole-word, longest-alias-wins matching
    (`services/bodyMissions.ts`, pure, 6 tests: "Jupiter's moon Europa" →
    Jupiter; "Galileo" never matches LEO). `getExploreMissions` imports
    Supabase **lazily inside its try/catch**, so the page renders (with empty
    cross-links) even with no DB env — it never 500s like DB-required pages.
    Cross-links per body to `/search?q=…`, `/live/deep-space`, `/lunar-sim`,
    `/live/iss-tracker`, `/missions/:slug`.
  - **Design-system compliant**: chips/panel/facts use the standard tokens
    (both themes verified in a headless browser); the orrery canvas itself is
    pinned dark via new `--space-*` tokens (it depicts space — same rationale
    as the deep-space hero), and per-body depiction colors are data in
    `services/solarSystemBodies.ts` (the `DeepSpaceTracker` META precedent).
    Deterministic seeded starfield (no `Math.random()` hydration risk).
    Keyboard-accessible: SVG bodies are tabbable buttons + the chip rail acts
    as tabs.
  - **Hub** (`/explore`): CosmosDaily-style card grid — Solar System Explorer
    (live) plus Sky Tonight and Topic Hubs as non-link "SOON" teasers. Full
    SEO on both routes: canonical, OG/Twitter, JSON-LD (CollectionPage;
    WebApplication + BreadcrumbList), sitemap entries. Titles rely on the root
    titleTemplate (avoids the "… — Antariksham | Antariksham" duplication
    other pages still have).

- ✅ **Explore — Sky Tonight (`/explore/sky-tonight`)** — the hub's second live
  experience: what's above you right now. Branch `claude/explore-section-ideas-uuv5wo`.
  - **Moon phase card**: elongation-based phase (mean longitudes + the Moon's
    equation of centre), SVG phase disc (two-arc terminator construction,
    Northern-Hemisphere convention), illumination %, moon age, next full/new
    moon (validated in tests against the real 2024-04-08 solar-eclipse new
    moon and 2024-01-25 full moon).
  - **Planets tonight**: evening / morning / all-night / hidden windows for
    all seven planets from geocentric solar elongation — location-independent,
    so it's SSR-safe with the same epoch-prop pattern as the orrery. Rows
    reuse the orrery's body colors; ice giants flagged binoculars/telescope.
  - **ISS passes for your location**: a new **`/api/iss/passes?lat&lon`**
    proxy route runs satellite.js SGP4 (48 h at 30 s steps) against the shared
    Celestrak TLE (extracted from the position route into
    `modules/iss/services/tle.ts` — one fetch + cache for both routes) and
    classifies each pass **actually visible** (ISS sunlit outside Earth's
    shadow cylinder while the observer's Sun is below −6°) — verified against
    real Delhi passes (post-sunset passes visible, daytime ones not).
    Coordinates are rounded to ~11 km before leaving the device and never
    stored. Client card: geolocation → pass rows (local times, compass path
    start→peak→end, max elevation, duration, Visible badge) + sunrise/sunset.
    satellite.js stays **server-only** (its v7 wasm runtime imports
    `node:module`, which client webpack can't bundle — discovered the hard
    way; the API-proxy pattern was the right architecture anyway).
  - **Pure core + tests**: `skyTonight.ts` (moon phase, planet windows, sun
    RA/Dec + altitude + NOAA-style sunrise/sunset incl. polar day/night) and
    `issPasses.ts` (pass scanning over any look function, 16-wind compass) —
    16 new zero-dep node:test cases (33 total in `modules/explore`).
    `skyTonight.ts` runtime-imports the orrery math via an explicit `.ts`
    extension — **`allowImportingTsExtensions` is now enabled** in
    tsconfig.json (legal with `noEmit` + bundler resolution) so pure modules
    CAN share code and still run under Node's type-stripping test runner
    (supersedes the "no runtime cross-imports" workaround where needed).
  - Hub teaser flipped to a live card (badge TONIGHT), sitemap entry, full
    SEO (canonical, OG/Twitter, WebApplication + BreadcrumbList JSON-LD).
    Theme-aware `.sky-*` styles (tokens only; the Moon disc reuses the
    pinned-dark `--space-*` canvas).

- ✅ **Gallery (`/gallery`)** — the nav's last dead link now resolves: a
  browse-and-search window on the **NASA Image and Video Library**
  (`images-api.nasa.gov` — NASA's official, keyless, actively-maintained API;
  deliberately NOT the retired community Mars Rover Photos API). Branch
  `claude/explore-section-ideas-uuv5wo`.
  - **Curated "Featured" tab = the SSR fallback**: twelve iconic, URL-verified
    images (Aldrin, Earthrise, Webb's Cosmic Cliffs, Pillars of Creation, Pale
    Blue Dot, eXtreme Deep Field, Perseverance's selfie, Artemis I, …) render
    with zero network on the server (deterministic → hydration-safe) and
    double as the graceful state when the API is down.
  - **Live browsing**: topic chips (Nebulae / Galaxies / Webb / Mars / Moon /
    Earth / Launches / Astronauts / Saturn), free-text search, result counts,
    **Load more** pagination (id-de-duped), CSS-columns masonry grid with
    hover titles, per-image `onError` hiding.
  - **Lightbox**: keyboard-accessible dialog (Esc close, arrow prev/next,
    wrap), title/date/photographer-credit, truncated description, link out to
    `images.nasa.gov/details/…`, body scroll lock.
  - **Proxy** (`app/api/gallery`): 10-min in-memory cache (capped keys),
    query sanitizing, 8 s upstream timeout, slimmed response via a pure,
    tested mapper (`modules/gallery/services/nasaImages.ts` — https-upgrade,
    space-encoding, photographer→secondary_creator→center credit fallback,
    video/malformed-item filtering; 5 node:test cases, **38 total**).
  - **Tokens**: photo scrim + lightbox are pinned dark via new `--photo-ink` /
    `--photo-scrim` / `--lightbox-bg` tokens (they frame photographs — the
    `--space-*` rationale); everything else uses standard theme tokens (both
    themes verified). Sitemap entry + ImageGallery JSON-LD + canonical/OG.

- ✅ **Explore — Topic Hubs (`/explore/topics`, `/explore/topics/[slug]`)** —
  the Explore section's discovery layer, and the last SOON teaser flipped
  live. Branch `claude/explore-section-ideas-uuv5wo`.
  - **Nine curated hubs**: Mars, The Moon, The Sun, The Giant Planets, Black
    Holes, Exoplanets, Human Spaceflight, Rockets & Launch, Deep Space. Each
    is a *lens* over content the site already has — no new tables, no new
    admin surface. `services/topics.ts` is a pure registry (slug, copy,
    depiction colour, `terms`, optional `bodyId` + tool `links`,
    `galleryQuery`); **adding a topic there creates a complete, SEO-ready hub
    page** — no other file changes.
  - **Ranked aggregation** (`services/topicContent.ts`): one `ilike` OR-query
    per source (articles / knowledge_articles / missions) built by
    `buildOrFilter` (strips PostgREST `,()*` syntax), then a pure
    `rankByTerms` — a term hit scores 3 in a title, 2 in a mission
    destination, 1 in body text, ties broken newest-first — so "Mars Sample
    Return" outranks an article that mentions Mars in passing. Fetches 4× the
    display limit so ranking has real choice. Supabase is imported **lazily
    inside the try/catch**, so a hub renders its intro + tool links even with
    no database (verified: shows a "Coverage coming soon" panel).
  - **Two new deep links, both post-mount reads of `location.search`** (not
    `useSearchParams`, so the routes stay statically renderable and SSR stays
    byte-identical): **`/explore/solar-system?body=<id>`** selects that world
    on arrival, and **`/gallery?q=<query>`** runs that image search. The hub's
    tool rail uses both, so "See Mars in the Solar System Explorer" and "Mars
    imagery in the Gallery" actually land on the right thing.
  - **SEO**: `generateStaticParams` over the registry (all nine prerendered),
    per-topic `generateMetadata`, CollectionPage + BreadcrumbList JSON-LD
    (the index also emits `hasPart` for the nine hubs), sitemap entries for
    the index and every topic, `notFound()` on an unknown slug (verified 404).
  - 10 new zero-dep `node:test` cases (**48 total**) covering scoring,
    ranking, de-dupe, filter building, and registry invariants — unique
    url-safe slugs, required copy, root-relative links, and that every
    `bodyId` resolves in the Solar System registry (a stale one would render
    a dead deep link).

- ✅ **APOD Archive (`/gallery/apod`)** — three decades of NASA's Astronomy
  Picture of the Day, browsable and deep-linkable. Branch
  `claude/explore-section-ideas-uuv5wo`.
  - **Date-window paging** (`modules/nasa/services/apodArchive.ts`, pure):
    all date maths is plain ISO strings in UTC — APOD is keyed by calendar
    date, never an instant, so parsing into local `Date`s would shift entries
    across midnight for some readers and break hydration parity.
    `latestWindow` / `olderWindow` / `windowEndingAt` produce contiguous,
    non-overlapping 24-day pages clamped to the **1995-06-16 epoch** (after
    which "Load earlier" reports the beginning rather than paging into the
    void).
  - **The open-end rule**: NASA 400s on any `end_date` past its most recent
    entry (its "today" follows US Eastern, which can lag UTC), so the newest
    window deliberately sends **no** `end_date` and lets the API decide where
    the archive ends. Verified against the live API. Backward pages always
    have two past bounds, so they send both.
  - **`/api/apod` proxy**: validates the ISO range (rejects junk, pre-epoch,
    inverted, and >60-day spans — all four verified), caches past windows for
    24 h and the open "latest" window for 1 h (entries are immutable once
    published), 8 s timeout, `NASA_API_KEY` stays server-side.
  - **SSR-first**: the route server-renders the newest 24 entries via
    `getApodWindow`, so the archive ships **indexable content** (plus
    ImageGallery JSON-LD describing exactly those server-rendered items) and
    the client only pages backwards from there. No key / outage → a friendly
    unavailable state, never a 500.
  - **UI**: masonry grid reusing the gallery's classes, per-tile date chip and
    ▶ Video badge (video days have no still — `thumbs=true` supplies
    `thumbnail_url`), **jump-to-date** picker bounded to the epoch…latest,
    Latest reset, `?date=YYYY-MM-DD` deep link (post-mount `location.search`
    read, so the route stays statically renderable), and the shared
    **Lightbox** showing the full astronomer's explanation.
    `GalleryImage` gained optional `sourceUrl`/`sourceLabel` so one lightbox
    serves both sources — APOD entries link to their `apod.nasa.gov/apod/apYYMMDD.html`
    permalink instead of images.nasa.gov. NASA's `copyright` field arrives
    with embedded newlines, so it is collapsed to one line.
  - 14 new zero-dep `node:test` cases (**62 total**) covering leap-year/
    year-boundary date shifts, window contiguity, epoch clamping, permalink
    formatting, credit cleaning, and defensive slimming (junk payloads, a
    single object, entries with no usable still). An entry point sits on
    `/gallery`; sitemap entry added.

**Mission Management System upgrade (Phase 1) — COMPLETE.** All 8 features
shipped (Enhanced Identity, Rich Classification, Professional Specifications,
Scientific Objectives, Advanced Timeline, Improved Launch Information, Enhanced
Media, Completeness & Validation) — see §2. The Mission module is now a
structured, extensible, professional mission-management data model on a single
additive `missions.details` jsonb column (+ the base columns it keeps in sync),
94 zero-dependency unit tests, and a fully backward-compatible editor + public
experience.

**Continuous integration — COMPLETE.** The 27 colocated `*.test.ts` suites
(**294 tests**) were runnable but unwired: no `test` script, no CI, so they only
ran when someone remembered to. Now `.github/workflows/ci.yml` runs
**lint → test → build** on every push and every PR into `main`, and
`package.json` gained `lint`, `test` (`node --test`) and `test:watch` scripts.
Node 22's built-in runner strips TypeScript, so the suites still need no test
framework — zero new dependencies. The build step passes placeholder Supabase env
vars, which sidesteps the `supabaseUrl is required` failure of rule 8 (§6) and
makes the build gate genuinely green rather than expected-red. All three gates
pass as of this commit.

**Not yet done:** All 8 Phase 2 features are complete. The Phase 1 Mission
Management System upgrade is complete (all 8 features). Remaining: Phases 3–4 of
the plan, and the polish items in §10.

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
- **CI is the backstop for that gate.** `.github/workflows/ci.yml` runs
  `npm run lint`, `npm test` and `npm run build` on every push and every PR into
  `main`, so a machine that can't build locally (tablet, phone) still gets the
  rule-8 check — read the PR's ✓/✗ instead. Locally the same three commands are
  `npm run lint && npm test && npm run build`; `npm run test:watch` re-runs the
  suites on save. CI supplies placeholder Supabase env vars, so its build must
  be **fully green** — a red build there is a real compile or type error, never
  the missing-env error.

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
  article (`app/articles/[slug]`) and learn pages. Nowhere else.
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
     on every migrated page (the `app/articles/[slug]` route is the proven pattern).
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
`.prose` column. Copy `/articles` or `/about` as a template.

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

**Mission Management System upgrade (Phase 1) — COMPLETE (all 8 features, see
§2).** The Mission module is now a professional, extensible data model. Natural
follow-ups (not required, but where the foundation is ready):
- **Completeness in the admin list** — show each mission's completeness % in
  `/admin/missions` (needs the list query to fetch `details`; the pure
  `evaluateCompleteness` is ready).
- **Media blur placeholders / build-time optimisation** — today optimisation is
  delegated to the Cloudinary provider + lazy-loading; true blur placeholders
  need `next/image` or a loader.
- **Translate the new structured fields** — mission translations still cover
  name + description only; identity/objectives/timeline text could be added to
  the `mission_translations` model without a schema change.
- **Public API / analytics / launches-integration** — the structured model is
  now ready to power those (the original goal of Phase 1).

**Media Library at scale — Phases 1, 2 and 4 shipped; 3 and 5 open.** See
[`docs/MEDIA_LIBRARY_ARCHITECTURE.md`](./docs/MEDIA_LIBRARY_ARCHITECTURE.md) for
the full design and the measured numbers. Still to do:

- **Phase 3 — backfill + usage graph.** `media_usages` (which article/mission
  uses which asset) for safe deletes and an "unused" filter, plus checksums,
  dimensions and blurhash for rows that predate Phase 4, and harvesting
  `articles.featured_image_meta` / `missions.details.media` onto the asset rows.
  That harvest is also the cheapest way to give pre-Phase-4 images real
  descriptions in bulk. Until it runs, dedupe only protects images uploaded from
  Phase 4 onward, since older rows have no checksum.
- **Phase 5 — the browsing experience.** Filter rail with tag facets,
  virtualised grid, per-asset detail drawer (edit title/alt/tags after the
  fact), bulk tag/move/delete, and `⌘K` quick-pick in the editor. `sort`,
  orientation/date/unused filters and facet counts land here too.
- **Context pre-fill on upload** — seeding tags from the article's own
  categories when the Media Library is opened from an editor needs a
  `defaultTags` prop threaded through the callers.

**Plan phases still open:**
- **Phase 2 — Data migration:** move CosmosDaily's flat category/tag fields into
  Antariksham's relational `categories`/`tags` join tables (one-time script).
  *Script written* — `scripts/migrate-cosmosdaily-articles.mjs` (dry-run by
  default; reads the old project, reshapes into the new relational schema). Old
  and new are **separate** Supabase projects, so it does export→import→reshape.
  Not yet run — needs the two projects' service keys + a go-ahead. See
  `scripts/README.md` for the field mapping, gap decisions, and the required
  `/article/:slug → /articles/:slug` 301s.
- **Phase 3 — URL & metadata parity, then staged cutover** via `vercel.json`
  (see §9), honoring §6.5.
- **Phase 4 — Advanced features** (only after cutover): 3D planet rendering
  (Three.js / R3F via `next/dynamic({ssr:false})`, scoped so the WebGL bundle
  never loads on other routes), satellite data control center (extend the
  API-proxy pattern), advanced astronomy tools (each as its own `modules/<tool>/`).

**Lunar Landing Simulator (`/lunar-sim`, testing):**
- ~~3-D visualization milestone~~ done — see §2. Possible polish: GLTF lander
  model, dust particles at low altitude, orbit controls for free camera.
- ~~Stochastic missions milestone~~ done — see §2 (procedural terrain,
  safe-zone targeting, randomized gate physics, localStorage success-rate
  widget). Possible polish: visualize the surveyed hazard zones on the 3-D
  terrain (e.g. red tint), share-a-seed URLs (`?seed=`), difficulty presets
  that widen the chaos ranges, streak/last-10 stats on the widget.
- ~~`SITE_REPO_TOKEN` setup~~ done — the FSW repo's CI has successfully
  auto-published wasm to `public/wasm/` (see the `chore(lunar-sim)` bot commit).
- ~~Ship-or-delete decision~~ shipped: noindex removed, OG/canonical/JSON-LD
  added, linked from the `/live` hub and footer Intelligence column. (No
  sitemap file exists in the app yet — when one is added, include `/lunar-sim`.)

**Explore section follow-ups (v1 + Sky Tonight shipped — see §2):**
- **Sky Tonight polish**: per-planet rise/set times for the user's location
  (the sun-geometry code generalises to planet RA/Dec), Moon rise/set, a
  notify-before-a-pass option, and localised (non-UTC) sun times display.
- ~~Topic hubs~~ **shipped** (see §2) — nine curated hubs. Natural follow-ups:
  surface hub links on the article/mission reading pages ("part of the Mars
  hub"), let editors pin a hero item per topic, and add topic hubs to the
  `/hi` bilingual surface.
- Orrery polish: ~~deep-linkable selection (`?body=`)~~ done; still open —
  true elliptical orbit paths for the eccentric bodies (Mercury/Pluto — the
  dot already sits at the true scaled radius, only the decorative ring is
  circular), dwarf planets (Ceres, Eris), and eventually the Phase-4 Three.js
  3-D upgrade (keep it `next/dynamic({ssr:false})`-scoped like `/lunar-sim`).
- ~~`/gallery` in the nav 404s~~ **shipped** (see §2) — NASA Image Library
  browser with curated Featured tab, topic chips, search + lightbox, plus the
  **APOD Archive** at `/gallery/apod` (see §2). Polish ideas: surfacing
  mission-media galleries from `missions.details.media`, higher-res lightbox
  assets via the library's `/asset/{id}` manifest, and per-day APOD permalink
  routes (`/gallery/apod/[date]`) if individual days should rank on their own.
  Note: the community-maintained NASA Mars Rover Photos API is retired — do
  not build against it. APOD needs `NASA_API_KEY` set in the environment
  (already used by `/live/apod`); without it the archive degrades to a
  friendly unavailable state.

**Admin auth follow-ups:**
- Team-management UI (`/admin/team`) to invite/deactivate members and set roles
  — the `admin_users.role` + `is_active` columns already back this; today
  membership is managed via SQL (see `supabase/migrations/README.md`).
- Optionally promote `role` into a Supabase `app_metadata` JWT claim if
  middleware-level role checks are wanted later.

**Internationalization follow-ups:**
- Bilingual **Articles, Learn & Missions** shipped (§2) — detail pages + toggle
  + admin language tabs. Remaining discoverability/expansion:
  - **`/hi` listing pages** (`/hi/articles` exists; add `/hi/learn`, `/hi/missions`)
    and a **global language switch in the nav** + a `/hi` home, so Hindi readers
    can enter and stay in Hindi site-wide (today the entry point is the toggle on
    an individual English page). Current scope is **content only** — site
    chrome/labels stay English by design.
  - **Mission `timeline`** entries (structured JSON) are not yet translated —
    only name + description are. Can be added without a schema change.
  - When a sitemap is added, include the `/hi/*` detail URLs for translated items
    with `hreflang` alternates.

**Editor experience follow-ups (Phase 1 upgrade shipped — see §2):**
- Per-article SEO overrides (custom SEO title / meta description / social image /
  robots) currently derive from the article's title/excerpt/featuredImage (what
  actually ships); persisting independent overrides would need columns or a link
  to the existing `seo_metadata` table.
- Autosave sends the full payload only when something changed (no redundant
  saves); a true partial/field-level PATCH would need an API change.
- Editor niceties: block drag-to-reorder, inline image upload-on-drop (today
  drop takes a URL; files go through the Media Library), and KaTeX rendering for
  `.math-block` (the class is styled; live rendering is code-split into Learn).
- Multi-tab conflict is a *warning* (+ local backup); a real 3-way merge is not
  implemented.

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
