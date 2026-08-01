// Relative, with the extension, so `node --test` can load this file directly —
// the same reason modules/admin/* import ../../../lib/utils.ts. `topics.ts` is
// pure data with no imports of its own, so nothing else comes along with it.
import { TOPICS } from '../modules/explore/services/topics.ts'

export type NavItem = {
  label: string
  /**
   * The label in each non-default language, keyed by code — `{ hi: 'लेख' }`.
   *
   * Deliberately here rather than in `lib/ui.ts` with the rest of the chrome
   * strings: this tree is data, and a label read apart from the href it names
   * is harder to keep honest, not easier. `navLabel()` in `lib/ui.ts` does the
   * lookup and falls back to `label`, so a missing translation renders English
   * instead of a gap.
   *
   * Typed loosely (plain string keys) to keep this file free of imports — see
   * the note at the top; `navLabel` is where it meets `LanguageCode`.
   */
  labels?: Record<string, string>
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
    labels: { hi: 'होम' },
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
    labels: { hi: 'लेख' },
    href:  '/articles',
    description: 'Space journalism, mission updates and scientific discoveries from NASA, ISRO, SpaceX, ESA and beyond.',
  },
  // A first-class section on the homepage, in the sitemap at priority 0.8, and
  // until now reachable only from the footer.
  {
    label: 'Missions',
    labels: { hi: 'मिशन' },
    href:  '/missions',
    desktopHidden: true,
    description: 'Active, upcoming and historic missions from every major agency, tracked in one place.',
  },
  {
    label: 'Explore',
    labels: { hi: 'अन्वेषण' },
    href:  '/explore',
    description: 'Interactive gateways to the cosmos — a live Solar System map, tonight\u2019s sky, and curated topic hubs.',
    children: [
      { label: 'Solar System Explorer', labels: { hi: 'सौर मंडल एक्सप्लोरर' }, href: '/explore/solar-system' },
      { label: 'Sky Tonight', labels: { hi: 'आज रात का आकाश' }, href: '/explore/sky-tonight'  },
      { label: 'Topic Hubs', labels: { hi: 'विषय केंद्र' }, href: '/explore/topics', children: topicHubs },
    ],
  },
  {
    label: 'Live',
    labels: { hi: 'लाइव' },
    href:  '/live',
    isLive: true,
    description: 'Real-time space intelligence — station tracking, launch countdowns and deep-space telemetry.',
    children: [
      { label: 'ISS Tracker', labels: { hi: 'आईएसएस ट्रैकर' }, href: '/live/iss-tracker' },
      { label: 'Launch Tracker', labels: { hi: 'लॉन्च ट्रैकर' }, href: '/live/launches'    },
      { label: 'NASA APOD', labels: { hi: 'नासा एपीओडी' }, href: '/live/apod'        },
      { label: 'Deep Space', labels: { hi: 'गहन अंतरिक्ष' }, href: '/live/deep-space'  },
      { label: 'Lunar Landing Simulator', labels: { hi: 'चंद्र लैंडिंग सिम्युलेटर' }, href: '/lunar-sim'        },
    ],
  },
  {
    label: 'Learn',
    labels: { hi: 'सीखें' },
    href:  '/learn',
    description: 'Deep dives on orbital mechanics, astrophysics, relativity and the mathematics behind spaceflight.',
  },
  {
    label: 'Gallery',
    labels: { hi: 'गैलरी' },
    href:  '/gallery',
    description: 'Imagery from NASA\u2019s archives — telescopes, spacecraft, launches and the Picture of the Day.',
    children: [
      { label: 'APOD Archive', labels: { hi: 'एपीओडी संग्रह' }, href: '/gallery/apod' },
    ],
  },
  {
    label: 'About',
    labels: { hi: 'परिचय' },
    href:  '/about',
    description: 'Who runs Antariksham, how it is edited, and where every fact comes from.',
    children: [
      { label: 'Our Mission', labels: { hi: 'हमारा मिशन' }, href: '/our-mission'      },
      { label: 'Editorial Policy', labels: { hi: 'संपादकीय नीति' }, href: '/editorial-policy' },
      { label: 'Sources', labels: { hi: 'स्रोत' }, href: '/sources'          },
      { label: 'Contact', labels: { hi: 'संपर्क' }, href: '/contact'          },
      { label: 'Privacy Policy', labels: { hi: 'गोपनीयता नीति' }, href: '/privacy'          },
      { label: 'Terms', labels: { hi: 'नियम व शर्तें' }, href: '/terms'            },
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
    { label: 'Articles', labels: { hi: 'लेख' }, href: '/articles' },
    { label: 'Explore', labels: { hi: 'अन्वेषण' }, href: '/explore' },
    { label: 'Live', labels: { hi: 'लाइव' }, href: '/live' },
    { label: 'Learn', labels: { hi: 'सीखें' }, href: '/learn' },
    { label: 'Gallery', labels: { hi: 'गैलरी' }, href: '/gallery' },
  ],
  intelligence: [
    { label: 'ISS Tracker', labels: { hi: 'आईएसएस ट्रैकर' }, href: '/live/iss-tracker' },
    { label: 'Launch Schedule', labels: { hi: 'लॉन्च कार्यक्रम' }, href: '/live/launches' },
    { label: 'Deep Space', labels: { hi: 'गहन अंतरिक्ष' }, href: '/live/deep-space' },
    { label: 'Lunar Lander Sim', labels: { hi: 'चंद्र लैंडर सिम' }, href: '/lunar-sim' },
    { label: 'NASA APOD', labels: { hi: 'नासा एपीओडी' }, href: '/live/apod' },
    { label: 'All Missions', labels: { hi: 'सभी मिशन' }, href: '/missions' },
  ],
  organization: [
    { label: 'About', labels: { hi: 'परिचय' }, href: '/about' },
    { label: 'Editorial Policy', labels: { hi: 'संपादकीय नीति' }, href: '/editorial-policy' },
    { label: 'Sources', labels: { hi: 'स्रोत' }, href: '/sources' },
    { label: 'Contact', labels: { hi: 'संपर्क' }, href: '/contact' },
    { label: 'Our Mission', labels: { hi: 'हमारा मिशन' }, href: '/our-mission' },
  ],
}
