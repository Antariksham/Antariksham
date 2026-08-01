// Relative, with the extension, so `node --test` can load this file directly —
// the same reason modules/admin/* import ../../../lib/utils.ts. `topics.ts` is
// pure data with no imports of its own, so nothing else comes along with it.
import { TOPICS } from '../modules/explore/services/topics.ts'

export type NavItem = {
  label: string
  href:  string
  isLive?: boolean
  isFuture?: boolean
  /**
   * One line describing the section, shown under its title in the desktop
   * mega-menu. Carries the whole middle column for sections with no children
   * (Home, Missions, Learn), so every section reads as deliberate rather than
   * as an empty panel. Condensed from each section's own page metadata.
   */
  description?: string
  /**
   * Kept out of the desktop row, which is a single horizontal line with no
   * room left — logo + wordmark + six links + the search pill + the toggle
   * already collide below ~1080px (see the breakpoint note in globals.css).
   * The mobile drawer and the 404 page have vertical space and show it.
   */
  desktopHidden?: boolean
  /**
   * Sub-sections for the mobile drawer's drill-down panels. Nests to any
   * depth — Explore → Topic Hubs → the nine hubs is three levels.
   *
   * A parent with `children` is still a real destination: `href` stays its
   * landing page and each sub-panel's header links back to it, so nothing
   * here is a dead toggle. Every entry mirrors a route that actually exists
   * (nothing on this site may navigate to a 404).
   */
  children?: NavItem[]
}

/** The nine curated hubs, straight from the registry that renders them, so a
 *  new hub appears in the nav without a second edit. */
const topicHubs: NavItem[] = TOPICS.map((topic) => ({
  label: topic.name,
  href:  `/explore/topics/${topic.slug}`,
}))

/**
 * The site's sections, in reading order. Drives the desktop row (minus
 * `desktopHidden`), the mobile drawer (all of it, with drill-down) and the
 * 404 page's section list.
 *
 * A section's own landing page is never repeated in its `children` — the
 * sub-panel header already links there.
 */
export const mainNav: NavItem[] = [
  {
    label: 'Home',
    href:  '/',
    desktopHidden: true,
    description: 'The front page — latest coverage, active missions and live space intelligence.',
  },
  // No children: the lone "हिन्दी (Hindi)" row that used to live here was a
  // stopgap route into /hi/articles, and `components/layout/LanguageSwitch`
  // now does that job properly from every page. Articles is a plain link on
  // the desktop bar as a result — the mega-menu's highlights column renders
  // for whichever section is open, so nothing is lost with the caret.
  {
    label: 'Articles',
    href:  '/articles',
    description: 'Space journalism, mission updates and scientific discoveries from NASA, ISRO, SpaceX, ESA and beyond.',
  },
  // A first-class section on the homepage, in the sitemap at priority 0.8, and
  // until now reachable only from the footer.
  {
    label: 'Missions',
    href:  '/missions',
    desktopHidden: true,
    description: 'Active, upcoming and historic missions from every major agency, tracked in one place.',
  },
  {
    label: 'Explore',
    href:  '/explore',
    description: 'Interactive gateways to the cosmos — a live Solar System map, tonight\u2019s sky, and curated topic hubs.',
    children: [
      { label: 'Solar System Explorer', href: '/explore/solar-system' },
      { label: 'Sky Tonight',           href: '/explore/sky-tonight'  },
      { label: 'Topic Hubs',            href: '/explore/topics', children: topicHubs },
    ],
  },
  {
    label: 'Live',
    href:  '/live',
    isLive: true,
    description: 'Real-time space intelligence — station tracking, launch countdowns and deep-space telemetry.',
    children: [
      { label: 'ISS Tracker',             href: '/live/iss-tracker' },
      { label: 'Launch Tracker',          href: '/live/launches'    },
      { label: 'NASA APOD',               href: '/live/apod'        },
      { label: 'Deep Space',              href: '/live/deep-space'  },
      { label: 'Lunar Landing Simulator', href: '/lunar-sim'        },
    ],
  },
  {
    label: 'Learn',
    href:  '/learn',
    description: 'Deep dives on orbital mechanics, astrophysics, relativity and the mathematics behind spaceflight.',
  },
  {
    label: 'Gallery',
    href:  '/gallery',
    description: 'Imagery from NASA\u2019s archives — telescopes, spacecraft, launches and the Picture of the Day.',
    children: [
      { label: 'APOD Archive', href: '/gallery/apod' },
    ],
  },
  {
    label: 'About',
    href:  '/about',
    description: 'Who runs Antariksham, how it is edited, and where every fact comes from.',
    children: [
      { label: 'Our Mission',      href: '/our-mission'      },
      { label: 'Editorial Policy', href: '/editorial-policy' },
      { label: 'Sources',          href: '/sources'          },
      { label: 'Contact',          href: '/contact'          },
      { label: 'Privacy Policy',   href: '/privacy'          },
      { label: 'Terms',            href: '/terms'            },
    ],
  },
]

/** What the desktop bar can actually fit on one line. */
export const desktopNav: NavItem[] = mainNav.filter((item) => !item.desktopHidden)

/**
 * Is `href` the page being viewed, or an ancestor of it?
 *
 * Home is the exception: every path starts with "/", so it would otherwise
 * match everything. Note this is prefix matching on whole segments — `/live`
 * covers `/live/launches` but not `/lunar-sim`, and `/articles` does not cover
 * `/article/:slug` (the listing/detail split in lib/i18n.ts).
 */
export function isCurrent(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Current for its own page, its sub-pages, or any descendant's — so a section
 *  stays marked while you are anywhere inside it, at any nesting depth. */
export function sectionIsCurrent(pathname: string, item: NavItem): boolean {
  return (
    isCurrent(pathname, item.href) ||
    (item.children?.some((child) => sectionIsCurrent(pathname, child)) ?? false)
  )
}

export const footerNav = {
  platform: [
    { label: 'Articles', href: '/articles' },
    { label: 'Explore', href: '/explore' },
    { label: 'Live',    href: '/live' },
    { label: 'Learn',   href: '/learn' },
    { label: 'Gallery', href: '/gallery' },
  ],
  intelligence: [
    { label: 'ISS Tracker',     href: '/live/iss-tracker' },
    { label: 'Launch Schedule', href: '/live/launches' },
    { label: 'Deep Space',      href: '/live/deep-space' },
    { label: 'Lunar Lander Sim', href: '/lunar-sim' },
    { label: 'NASA APOD',       href: '/live/apod' },
    { label: 'All Missions',    href: '/missions' },
  ],
  organization: [
    { label: 'About',            href: '/about' },
    { label: 'Editorial Policy', href: '/editorial-policy' },
    { label: 'Sources',          href: '/sources' },
    { label: 'Contact',          href: '/contact' },
    { label: 'Our Mission',      href: '/our-mission' },
  ],
}
