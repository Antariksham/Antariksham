// English UI strings — the source of truth for every translatable label.
//
// This file defines the KEY SET. `hi.ts` is typed as `Record<keyof typeof en,
// string>`, so a key added here without a Hindi counterpart fails `next build`
// (CLAUDE.md rule 8) rather than silently shipping English to a Hindi reader.
//
// SHAPE: flat, dot-namespaced keys rather than nested objects. Flat keys make
// the parity check a one-line type, and make a missing key a precise compile
// error naming the key instead of a structural mismatch.
//
// SCOPE: chrome and shared labels. Article/Learn/Mission *content* is not here —
// that is author-written text living in the `*_translations` tables.
//
// Anything a reader can see belongs here. Anything only an admin sees does not:
// /admin is deliberately English-only, and is excluded from the language switch.

export const en = {
  // ── Global navigation ──────────────────────────────────────────────────────
  'nav.articles':   'Articles',
  'nav.explore':    'Explore',
  'nav.live':       'Live',
  'nav.learn':      'Learn',
  'nav.gallery':    'Gallery',
  'nav.about':      'About',
  'nav.search':     'Search',
  'nav.home':       'home',
  'nav.openMenu':   'Open menu',
  'nav.closeMenu':  'Close menu',

  // ── Footer ─────────────────────────────────────────────────────────────────
  'footer.platform':        'Platform',
  'footer.intelligence':    'Intelligence',
  'footer.organization':    'Organization',
  'footer.issTracker':      'ISS Tracker',
  'footer.launchSchedule':  'Launch Schedule',
  'footer.deepSpace':       'Deep Space',
  'footer.lunarSim':        'Lunar Lander Sim',
  'footer.apod':            'NASA APOD',
  'footer.allMissions':     'All Missions',
  'footer.editorialPolicy': 'Editorial Policy',
  'footer.sources':         'Sources',
  'footer.contact':         'Contact',
  'footer.ourMission':      'Our Mission',
  'footer.privacy':         'Privacy Policy',
  'footer.terms':           'Terms',

  // ── Brand copy ─────────────────────────────────────────────────────────────
  // Mirrors config/site.ts. The domain itself is NOT here — it lives in exactly
  // one place (CLAUDE.md rule 9) and is never translated.
  'site.tagline':     'Independent Space Intelligence & Knowledge Platform',
  'site.positioning': 'Independent Space Intelligence Organization',
  'site.description': 'Scientific journalism, live mission tracking, deep-space telemetry, and an educational knowledge engine — all in one independent platform.',

  // ── Language switch ────────────────────────────────────────────────────────
  'lang.choose': 'Choose language',
} as const

/** Every valid dictionary key, as a literal union. */
export type DictionaryKey = keyof typeof en

/** The contract each non-English dictionary must satisfy in full. */
export type Dictionary = Record<DictionaryKey, string>
