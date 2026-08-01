import type { DictionaryKey } from '@/lib/dictionaries/en'

// Navigation is defined by dictionary KEY, not by literal text, so one
// structure renders in every language. `href` is always the default-language
// path; components prefix it for the active language via swapLangPath, so
// there is one list to maintain rather than one per language.
export type NavItem = {
  labelKey: DictionaryKey
  href:  string
  isLive?: boolean
  isFuture?: boolean
}

export const mainNav: NavItem[] = [
  { labelKey: 'nav.articles', href: '/articles' },
  { labelKey: 'nav.explore',  href: '/explore' },
  { labelKey: 'nav.live',     href: '/live', isLive: true },
  { labelKey: 'nav.learn',    href: '/learn' },
  { labelKey: 'nav.gallery',  href: '/gallery' },
  { labelKey: 'nav.about',    href: '/about' },
]

export const footerNav: Record<string, NavItem[]> = {
  platform: [
    { labelKey: 'nav.articles', href: '/articles' },
    { labelKey: 'nav.explore',  href: '/explore' },
    { labelKey: 'nav.live',     href: '/live' },
    { labelKey: 'nav.learn',    href: '/learn' },
    { labelKey: 'nav.gallery',  href: '/gallery' },
  ],
  intelligence: [
    { labelKey: 'footer.issTracker',     href: '/live/iss-tracker' },
    { labelKey: 'footer.launchSchedule', href: '/live/launches' },
    { labelKey: 'footer.deepSpace',      href: '/live/deep-space' },
    { labelKey: 'footer.lunarSim',       href: '/lunar-sim' },
    { labelKey: 'footer.apod',           href: '/live/apod' },
    { labelKey: 'footer.allMissions',    href: '/missions' },
  ],
  organization: [
    { labelKey: 'nav.about',              href: '/about' },
    { labelKey: 'footer.editorialPolicy', href: '/editorial-policy' },
    { labelKey: 'footer.sources',         href: '/sources' },
    { labelKey: 'footer.contact',         href: '/contact' },
    { labelKey: 'footer.ourMission',      href: '/our-mission' },
  ],
}

// Column headings for the footer nav grid, in the same order as footerNav.
export const footerColumns: { key: keyof typeof footerNav; titleKey: DictionaryKey }[] = [
  { key: 'platform',     titleKey: 'footer.platform'     },
  { key: 'intelligence', titleKey: 'footer.intelligence' },
  { key: 'organization', titleKey: 'footer.organization' },
]

// The bottom strip — legal + policy links.
export const footerLegal: NavItem[] = [
  { labelKey: 'footer.privacy',         href: '/privacy'          },
  { labelKey: 'footer.terms',           href: '/terms'            },
  { labelKey: 'footer.editorialPolicy', href: '/editorial-policy' },
  { labelKey: 'footer.sources',         href: '/sources'          },
  { labelKey: 'footer.contact',         href: '/contact'          },
]
