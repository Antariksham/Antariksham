# What to build or update next

A prioritised review of the site as it stands, written after reading the code
rather than the roadmap. `MIGRATION.md` §10 tracks *follow-ups to things already
built*; this file asks a different question — **where is the site weakest right
now, and what gives the most back per hour spent?**

Every claim here was checked against the source. File references are exact.

---

## Tier 0 — Things that are simply broken

Small fixes, disproportionate impact. Do these first; none takes long.

### 1. The default social-share image does not exist — ✅ FIXED

> Done. `app/opengraph-image.tsx` now generates the card, `public/logo.svg` backs
> the Organization JSON-LD via `siteConfig.seo.logo`, and the eight pages below
> had their hardcoded `images:` line removed so they inherit it. Original
> writeup kept for the record:


`config/site.ts:16` declares `defaultImage: '/images/og-default.jpg'`, but
`public/images/` **is not a directory** — the file was never added. It is used in
two places that both matter:

- As the `openGraph.images` value on **eight public pages** — `/explore`,
  `/explore/solar-system`, `/explore/sky-tonight`, `/explore/topics`, every
  `/explore/topics/[slug]` hub, `/gallery`, `/gallery/apod`, `/lunar-sim`. Every
  share of those on X, WhatsApp, LinkedIn or Slack renders a card with a broken
  image.
- As the Organization `logo` in the **Article/NewsArticle JSON-LD on every
  article** (`modules/articles/services/articleMetadata.ts:51`) and in
  `modules/admin/seo/seoHelpers.ts:61`. A 404 logo is a structured-data error in
  Search Console.

**Fix well, not just quickly:** add `app/opengraph-image.tsx` using Next's
`ImageResponse`, so each page gets a generated, branded card carrying its own
title, in both themes' palette. That replaces the missing static file *and*
upgrades every page that currently has no image at all.

### 2. The homepage ships no Open Graph or Twitter metadata — ✅ FIXED

> Done. The root layout now carries `openGraph` and `twitter` defaults that every
> route inherits. Original writeup kept for the record:


`app/page.tsx:7-10` sets only `title` and `description`; the root layout
(`app/layout.tsx:29-36`) sets only `metadataBase`, `title`, `description`. There
is no `openGraph`, no `twitter`, no `og:site_name`, no card type anywhere in the
inherited defaults. The most-shared URL on the site previews as a bare link.

Put OG/Twitter defaults in the root layout metadata so every route inherits them
and individual pages only override what differs.

### 3. `robots.txt` is static and points at the old domain

`public/robots.txt` hardcodes `Sitemap: https://antariksham.org/sitemap.xml`.
The site is migrating to `cosmosdaily.space`, and `app/sitemap.ts:15` already
derives its base from `siteConfig.url` — so the sitemap will follow the domain
change and robots.txt silently will not.

Convert it to `app/robots.ts` reading `siteConfig.url`. This is the same class of
drift §6 exists to prevent, and it is a one-file change.

Related: `config/site.ts` is still entirely Antariksham branding (name, domain,
email, twitter handle, tagline). Whatever the cutover plan is, that file is the
single switch, and it is worth confirming it is the *only* place the old domain
is written down before Phase 3 starts.

### 4. There is no global 404 or error page

`app/articles/not-found.tsx` exists. `app/not-found.tsx`, `app/error.tsx` and
`app/global-error.tsx` do not. So any mistyped URL, any dead inbound link, and
any Supabase hiccup drops the visitor onto Next's unstyled default page — no
nav, no footer, no theme, no route back into the site.

For a site whose whole strategy is inheriting earned search traffic, the 404 is a
page real users will land on. It should be a branded dead end with search and
recent articles on it.

### 5. The nav advertises a `⌘K` shortcut that does nothing

`components/layout/Navbar.tsx:42` renders a `⌘K` badge inside the search pill.
No global key handler exists — a search across `app/`, `modules/` and
`components/` finds `metaKey`/`ctrlKey` only in `NavProgress.tsx` (detecting
modifier-clicks) and `modules/admin/editor/RichEditor.tsx:326` (Cmd+K for
inserting a link, admin-only). Pressing ⌘K on the public site does nothing.

Either build the palette (see Tier 1.1 — it becomes easy once search is good) or
remove the badge. A visible promise the product does not keep is worse than no
badge.

---

## Tier 1 — The highest-leverage things to build

### 1. Rebuild public search — it is the weakest system on the site

`modules/search/services/search.ts` is `ILIKE '%query%'` against **title and
excerpt only**, across three tables:

- **Article bodies are never searched.** A reader looking for "Starship heat
  shield" gets nothing back unless those exact words are in a headline or
  excerpt. On a knowledge platform this is the single biggest discovery gap —
  the content exists and cannot be found.
- **No relevance ranking.** Results are ordered by `published_at`
  (`search.ts:75`), so the best match loses to the newest one.
- **Hard caps of 8 / 6 / 6 with no pagination** (`search.ts:76,87,95`). There is
  no way to see result nine.
- **A leading `%` wildcard cannot use a btree index**, so this becomes a
  sequential scan on every keystroke as the corpus grows.
- **The query is interpolated raw into the PostgREST filter string**
  (`search.ts:74`: `.or(\`title.ilike.${pattern},excerpt.ilike.${pattern}\`)`).
  A comma in the search box splits the filter into extra conditions and
  malforms the query. The `.eq('status','published')` is ANDed separately so
  drafts cannot leak, but a user searching `Apollo 11, 12` gets an error instead
  of results.

**You have already solved this once, correctly, in this repo.**
`supabase/migrations/20260729120000_media_library_index.sql` builds a weighted
generated `tsvector` (`:96-104`), GIN + `pg_trgm` indexes, keyset pagination, and
proper LIKE-escaping (`:196`) — measured at 50,003 rows with sub-millisecond
pages. Porting that pattern to `articles` / `knowledge_articles` / `missions`
gives body search, real ranking, typo tolerance and paging, with the design
already validated.

Once search is genuinely good, the ⌘K command palette from Tier 0.5 is a small
UI layer on top of it, and it becomes the site's best navigation surface.

### 2. Close the structured-data gaps — this is free search real estate

JSON-LD coverage is uneven. Present on `/explore/*`, `/gallery/*`, `/lunar-sim`
and articles. **Absent from missions and Learn entirely** — a grep for `ld+json`
across `modules/missions/` and `modules/learn/` returns nothing. Those are the
two content types the site is most differentiated on.

Four specific wins, roughly in order of effort-to-payoff:

- **`FAQPage` on articles that contain an FAQ block.** The editor already ships
  one (`modules/admin/editor/editorBlocks.ts:45`) and `.article-body` already
  styles it. The content exists; nothing emits the schema. This is one function
  over the parsed article HTML.
- **`BreadcrumbList` on articles, missions and Learn.** It exists on the Explore
  and Gallery pages and nowhere else. Breadcrumbs are among the most reliably
  displayed rich results Google offers.
- **Missions and Learn JSON-LD.** Learn maps cleanly onto `LearningResource`;
  missions now carry a rich structured model (`details.identity`,
  `.classification`, `.specifications`, `.launch`) that is *already* the hard
  part of emitting good schema.
- **`WebSite` + `SearchAction` on the homepage** for the sitelinks searchbox —
  which is worth much more once Tier 1.1 makes the search behind it good.

### 3. Fix image delivery — the biggest Core Web Vitals lever

There is **no `next/image` anywhere in the codebase**. There are 39 raw `<img>`
tags across `app/`, `modules/` and `components/`; **19 carry a `loading`
attribute and zero carry `width`/`height`.**

That means: no responsive `srcset` (phones download desktop-sized images), no
modern format negotiation, about twenty images loading eagerly, and — because
not one image declares its intrinsic size — **layout shift on every image on the
site**. CLS is a ranking signal, and this is a site whose entire strategy is
protecting and growing search traffic.

The history matters here: `next/image` was deliberately removed because an empty
`next.config.js` made the optimiser 400 on external hosts, and maintaining an
allow-list of `remotePatterns` for admin-entered URLs was not worth it. That
reasoning was right. **But Cloudinary is already wired up** (`next-cloudinary`,
signed uploads, the media library's Cloudinary tab), and a custom `next/image`
loader pointing at Cloudinary sidesteps the allow-list entirely.

Cheapest possible first step, independent of any of that: add `width`, `height`
and `loading="lazy"` to the existing tags. That alone kills the CLS and costs an
afternoon. It also clears 5 of the 8 open ESLint warnings
(`@next/next/no-img-element`).

### 4. Nothing brings a reader back

The site has no RSS feed, no newsletter, no comments, no follow mechanism of any
kind — grep finds `newsletter`/`subscribe` nowhere in `app/`, `modules/` or
`components/`. Every visit is terminal. For a publication, that is the growth
ceiling.

- **RSS/Atom is an afternoon.** `app/feed.xml/route.ts` reusing exactly the data
  `app/sitemap.ts` already fetches. Space readers genuinely still use feeds, and
  aggregators pick sites up from them.
- **Newsletter capture is the highest-value retention feature you could build.**
  Supabase is already there for storage, `/admin` is already there for
  composing, and the analytics beacon
  (`modules/admin/analytics/beacon.ts`) is already there to measure whether it
  works. The publishing scheduler even has the cron infrastructure.

---

## Tier 2 — Finish what is already started

These are all half-built: the hard part is done and the last mile is missing,
which is the most wasteful state for work to sit in.

### Hindi is a half-open door

Article, Learn and Mission *detail* pages translate. But `app/hi/` contains only
`articles/[slug]`, `articles/`, `learn/[slug]` and `missions/[slug]` — there is
**no `/hi` home, no `/hi/learn` listing, no `/hi/missions` listing, and no
language switch in the nav**. A Hindi reader can reach a translated article only
from the toggle on its English version, and once there has nowhere to go but
back to English. The sitemap (`app/sitemap.ts`) also emits no `/hi/*` URLs and no
`hreflang` alternates, so none of the translated content is discoverable in
search at all.

The translation infrastructure is the expensive part and it is finished. The
discoverability layer is a handful of listing pages and a nav control.

### `/admin/team` does not exist

`admin_users` has `role` and `is_active` columns specifically to support this
(§2), but there is no UI — adding a colleague today means hand-writing SQL. Fine
while you are the only editor; a hard block the moment you are not.

### Media Library Phase 3 — the usage graph

Without `media_usages` there is no way to know whether an image is live on an
article before deleting it, and dedupe only protects uploads from Phase 4 onward
because older rows have no checksum. Deleting an in-use image is a mistake that
shows up on the public site, and right now nothing prevents it.

### The loose ends the admin tools left behind

All three are the same shape — a safe refusal with no supported fix:

- **Bulk actions and CSV export act only on rows loaded so far.** A
  "select all matching" that applies by filter server-side is the missing piece.
- **Category delete is refused while articles use it**, and moving those articles
  is one-at-a-time in the editor. `article_categories` has the same shape as
  `article_tags`, so the tag-merge code you already wrote largely transfers.
- **Agency delete is refused while missions reference it**, with the same manual
  fix. Same pattern.

### No component or route tests

All 30 test suites cover pure logic — naming, scheduling, citations, search
ranking, analytics, mission validation. That is genuinely good discipline, and
it means nothing exercises a React component or an API route.

Rule 2 requires every change to work in **light and dark**, and today only a
human on a preview URL can confirm that. One Playwright smoke run — main routes,
both themes, screenshot diff — would be the highest-value test investment
available, and would have caught the kind of bug §2 records finding by hand (the
media drawer's collapsed aspect-ratio box).

---

## Tier 3 — Growth and differentiation

Ordered by payoff, not effort.

- **`/tags/<slug>` archive pages.** Stable slugs and the relational join already
  exist (`20260730130000_tags_slug_unique.sql`); tags currently render as chips
  that go nowhere. Each one is a ready-made landing page.
- **`/authors` index.** `app/authors/[slug]` exists and author pages are in the
  sitemap, but no page lists them — the only route in is an article byline.
  Author pages are a direct E-E-A-T signal for Google News.
- **Topic-hub backlinks on articles and missions** ("part of the Mars hub").
  The nine hubs exist and nothing points into them from the content they
  contain.
- **Per-article analytics deep dive + scroll heatmap.** The collector already
  records max scroll depth and dwell per view; only the read side is missing.
- **Mission completeness in `/admin/missions`.** `evaluateCompleteness` is
  written and tested; the list query just needs to fetch `details`.
- **Sky Tonight: planet and Moon rise/set for the user's location.** The sun
  geometry generalises to any RA/Dec.
- **Lunar sim: share-a-seed URLs (`?seed=`) and difficulty presets.** Turns a
  single-player toy into something people send each other.

---

## One strategic note

The most consequential thing on this list is not a feature.

**Phase 3 — the actual cutover to `cosmosdaily.space` — has not happened.** The
migration script (`scripts/migrate-cosmosdaily-articles.mjs`) is written but
never run, and it is waiting on credentials and a go-ahead rather than on any
engineering. Meanwhile `config/site.ts` and `public/robots.txt` still say
Antariksham.

Every feature added before cutover is a feature that has to be re-verified after
it. If the goal is still to become production at `cosmosdaily.space`, the
highest-value work is finishing the migration — and the Tier 0 SEO fixes above
are the natural first step, because they are exactly the things that must be
correct *before* traffic moves, not after.
