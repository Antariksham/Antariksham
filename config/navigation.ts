export type NavItem = {
  label: string
  href:  string
  isLive?: boolean
  isFuture?: boolean
  /**
   * Sub-sections for the mobile drawer's drill-down panel.
   *
   * A parent with `children` is still a real destination — `href` stays its
   * landing page and the sub-panel links back to it, so nothing here is a
   * dead toggle. The desktop row ignores `children` entirely and keeps its
   * flat six links; only the mobile drawer drills.
   *
   * Every entry mirrors a route that actually exists (nothing on this site may
   * navigate to a 404), which is why `Articles` and `Learn` have no children:
   * they have no sub-routes yet, only `/article/:slug` and `/learn/:slug`
   * detail pages.
   */
  children?: NavItem[]
}

export const mainNav: NavItem[] = [
  { label: 'Articles', href: '/articles' },
  {
    label: 'Explore',
    href:  '/explore',
    children: [
      { label: 'Solar System Explorer', href: '/explore/solar-system' },
      { label: 'Sky Tonight',           href: '/explore/sky-tonight'  },
      { label: 'Topic Hubs',            href: '/explore/topics'       },
    ],
  },
  {
    label: 'Live',
    href:  '/live',
    isLive: true,
    children: [
      { label: 'ISS Tracker',               href: '/live/iss-tracker' },
      { label: 'Launch Tracker',            href: '/live/launches'    },
      { label: 'NASA APOD',                 href: '/live/apod'        },
      { label: 'Deep Space',                href: '/live/deep-space'  },
      { label: 'Lunar Landing Simulator',   href: '/lunar-sim'        },
    ],
  },
  { label: 'Learn',   href: '/learn' },
  {
    label: 'Gallery',
    href:  '/gallery',
    children: [
      { label: 'APOD Archive', href: '/gallery/apod' },
    ],
  },
  {
    label: 'About',
    href:  '/about',
    children: [
      { label: 'Our Mission',      href: '/our-mission'      },
      { label: 'Editorial Policy', href: '/editorial-policy' },
      { label: 'Sources',          href: '/sources'          },
      { label: 'Contact',          href: '/contact'          },
    ],
  },
]

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
