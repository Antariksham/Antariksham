export type NavItem = {
  label: string
  href:  string
  isLive?: boolean
  isFuture?: boolean
}

export const mainNav: NavItem[] = [
  { label: 'News',    href: '/news' },
  { label: 'Explore', href: '/explore' },
  { label: 'Live',    href: '/live', isLive: true },
  { label: 'Learn',   href: '/learn' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About',   href: '/about' },
]

export const footerNav = {
  platform: [
    { label: 'News',    href: '/news' },
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
    { label: 'Our Mission',      href: '/mission' },
  ],
}
