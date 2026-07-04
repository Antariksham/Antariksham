# Antariksham

**Independent Space Intelligence & Knowledge Platform**

> Exploring Space Through Knowledge, Research & Discovery

Antariksham is an open-source, full-stack space platform combining original scientific journalism, live mission tracking, deep-space telemetry, launch intelligence, and an educational knowledge engine — built to NASA-level credibility standards with modern product design.

**Live:** [antariksham.vercel.app](https://antariksham.vercel.app) · **Domain:** antariksham.org

---

## What It Is

Antariksham is not a news blog. It is not a NASA mirror. It is not a sci-fi themed entertainment site.

It is a serious, independent space intelligence platform that treats its audience as intelligent, curious people. Every piece of content traces back to a primary source. Every live data system pulls from official APIs. Every design decision prioritises trust and clarity over engagement and clicks.

### Platform Layers

| Layer | What It Does |
|---|---|
| **Editorial** | Original space journalism — breaking news, mission analysis, research breakdowns, explainers |
| **Live Data** | ISS tracker, Deep Space telemetry (Voyager 1/2, Parker, Europa Clipper, Lucy), launch countdowns, NASA APOD |
| **Knowledge** | Evergreen educational content with LaTeX math rendering — orbital mechanics, black holes, relativity |
| **Missions** | Curated mission database with timelines, agency profiles, status tracking |
| **Admin** | Full content management system — articles, missions, authors, homepage builder, media library, SEO center |

---

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 14.2.3 — App Router + TypeScript strict mode |
| Database | Supabase — PostgreSQL with RLS policies |
| Hosting | Vercel |
| Styling | Inline React style props (no Tailwind in components) |
| Math rendering | KaTeX |
| Fonts | Crimson Pro · DM Mono · Outfit |
| Live APIs | NASA Open API · JPL Horizons · Launch Library 2 · WhereTheISS |

---

## Features

### Live Data Systems
- **ISS Tracker** — real-time position on SVG world map, crew cards, updated every 5 seconds
- **Deep Space Tracker** — live telemetry for Voyager 1, Voyager 2, Parker Solar Probe, Europa Clipper, Lucy via NASA JPL Horizons
- **Launch Tracker** — upcoming and recent launches across all agencies via Launch Library 2
- **NASA APOD** — Astronomy Picture of the Day, server-side fetched and cached

### Content System
- Dynamic article system with slug pages, view counts, related articles, author bylines
- Seven article types: Breaking News, Mission Update, Analysis, Explainer, Research Breakdown, Editorial, Guide
- Evergreen knowledge articles with KaTeX math rendering and difficulty levels
- Full-text search across articles, missions, and knowledge content

### Admin Panel
- Articles CRUD — draft, publish, schedule, feature
- Missions CRUD — timeline builder, image picker
- Authors management — profiles, avatars, social links, featured toggle
- Homepage builder — section toggle, reorder, hero edit
- Media library — drag and drop upload, inline picker
- SEO center — metadata, live Google SERP preview, character counters
- Launch dashboard — live read-only view of upcoming and recent launches

### Architecture
- Modular feature-based folder structure (`modules/` per feature)
- All APIs proxied through `/api/` routes — no direct frontend API calls
- Fail-safe data: if any API is unavailable, last cached data is shown — never blank pages
- Database-driven homepage — admin-controlled section ordering and visibility
- Built to scale from solo founder to full editorial team without a rebuild

---

## Project Structure

```
app/                  # Next.js routes only
modules/              # Feature logic + components
  news/
  missions/
  launches/
  homepage/
  learn/
  deepspace/
  gallery/
  search/
  admin/
components/           # Shared UI components
  layout/             # Navbar, Footer
lib/                  # Utilities, Supabase client
services/             # API integration layer
hooks/                # Reusable React hooks
types/                # TypeScript interfaces
config/               # Site configuration
styles/               # globals.css only
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [NASA API key](https://api.nasa.gov) (free)
- A [Vercel](https://vercel.com) account (for deployment)

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NASA_API_KEY=your_nasa_api_key
ADMIN_PASSWORD=your_chosen_admin_password
CRON_SECRET=your_cron_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Never commit `.env.local` to version control.**

### Installation

```bash
git clone https://github.com/mayank7643/Antariksham.git
cd Antariksham
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin) — login with the `ADMIN_PASSWORD` you set.

### Database Setup

The Supabase schema includes 16 tables. You will need to set up:

- `articles`, `authors`, `categories`, `tags`, `article_categories`, `article_tags`
- `missions`, `launches`, `space_agencies`
- `gallery_images`, `knowledge_articles`
- `homepage_sections`, `deep_space_missions`, `live_data`
- `media_assets`, `seo_metadata`

Storage buckets required: `article-images` (public), `mission-images` (public).

---

## Data Sources

All live data comes from official primary sources:

| Source | Used For |
|---|---|
| [NASA Open APIs](https://api.nasa.gov) | APOD, Mars Rover, NEO data |
| [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | Deep space probe telemetry |
| [Launch Library 2](https://thespacedevs.com/llapi) | Launch schedules and status |
| [WhereTheISS](https://wheretheiss.at) | Real-time ISS position |

No data is fabricated. When APIs are unavailable, the last verified data is shown.

---

## Editorial Standards

Antariksham maintains strict editorial standards:

- All facts trace to primary sources — agency announcements, mission pages, peer-reviewed papers
- No other news websites are used as primary sources
- Corrections are addressed promptly — report errors at the contact page
- No advertising, sponsored content, or paid placements — ever
- AI-generated imagery is never used as editorial illustration

Full policy: [antariksham.org/editorial-policy](https://antariksham.org/editorial-policy)

---

## Contributing

Antariksham is open source. Contributions are welcome.

### How to Contribute

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature-name`
3. Make your changes following the code rules below
4. Open a pull request against the `main` branch with a clear description

### Code Rules

These are non-negotiable for all contributions:

- **Styling** — inline React style props only. Never Tailwind inside components.
- **Fonts** — Crimson Pro for headings, DM Mono for labels/metadata, Outfit for body text
- **No hardcoding** — all content from Supabase. No hardcoded strings in UI
- **API proxy** — never fetch external APIs from the frontend. Always via `/api/` routes
- **TypeScript** — strict mode. All new data structures need interfaces in `types/`
- **Grids** — `repeat(auto-fit, minmax(...))` only. No media queries
- **CSS variables** — use `--accent`, `--green`, `--gold`, `--red`, `--white`. No hardcoded colours
- **Fail-safe** — if any API fails, show cached data. Never blank pages
- **One file per PR step** — do not change multiple unrelated files in one commit
- **Force dynamic** — all API routes making external calls need `export const dynamic = 'force-dynamic'`
- **Next.js Image** — use `next/image` Image component, never raw `<img>` tags

### What We Welcome

- Bug fixes
- Performance improvements
- New knowledge articles (educational content)
- Accessibility improvements
- New live data integrations (with official API sources only)
- Internationalisation contributions

### What We Don't Accept

- Advertising or monetisation features
- Clickbait or SEO-spam content
- Designs that deviate from the established visual system
- Dependencies that significantly increase bundle size without clear benefit

---

## Roadmap

- [ ] Custom domain — antariksham.org
- [ ] Gallery — licensed NASA/ISRO/ESA imagery with full copyright metadata
- [ ] Explore section — missions, agencies, astronauts, rockets, celestial objects
- [ ] Public launches page — `/live/launches`
- [ ] Hindi language support — multilingual editorial system
- [ ] Reader accounts — bookmarks, personalisation
- [ ] Author contributor system — multi-author editorial workflow
- [ ] Video/documentary layer

---

## Licence

This project is open source under the [MIT Licence](LICENSE).

Content published on antariksham.org — including articles, mission analyses, and educational material — is the intellectual property of Antariksham and its contributors. The codebase is MIT licensed; the editorial content is not.

---

## Acknowledgements

Built with data from NASA, ISRO, ESA, JPL, The Space Devs, and the global space science community. This platform would not exist without the open data policies of these organisations.

---

*Antariksham — Independent Space Intelligence & Knowledge Platform*
