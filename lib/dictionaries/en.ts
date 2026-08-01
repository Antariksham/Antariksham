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

  // ── Per-page metadata ──────────────────────────────────────────────────────
  // Titles are bare: app/layout.tsx applies the '%s | Antariksham' template.
  // Descriptions are the meta description, so keep them under ~160 characters.
  'page.home.title':  'Antariksham — Space Intelligence & Knowledge Platform',
  'page.home.desc':   'Scientific journalism, live mission tracking, deep-space telemetry, and an educational knowledge engine — all in one independent platform.',

  'page.learn.title': 'Learn',
  'page.learn.desc':  'Deep-dive articles on orbital mechanics, astrophysics, black holes, relativity and the mathematics powering space exploration.',

  'page.missions.title': 'Space Missions',
  'page.missions.desc':  'Active, upcoming, and historic space missions from NASA, ISRO, SpaceX, ESA and all major agencies — tracked in one place.',

  'page.articles.title': 'Articles',
  'page.articles.desc':  'Space articles, mission updates and scientific discoveries from NASA, ISRO, SpaceX, ESA and beyond.',

  'page.about.title': 'About',
  'page.about.desc':  'Antariksham is an independent space intelligence and knowledge platform combining scientific journalism, live mission tracking, and deep educational content.',

  'page.contact.title': 'Contact',
  'page.contact.desc':  'Get in touch with the Antariksham team — for corrections, tips, collaborations, or general enquiries.',

  'page.privacy.title': 'Privacy Policy',
  'page.privacy.desc':  "Antariksham's privacy policy — what data we collect, how we use it, and your rights.",

  'page.terms.title': 'Terms & Conditions',
  'page.terms.desc':  'The terms and conditions governing your use of Antariksham.',

  'page.sources.title': 'Sources',
  'page.sources.desc':  "The primary sources, APIs, and data providers that power Antariksham's journalism, live data, and educational content.",

  'page.editorialPolicy.title': 'Editorial Policy',
  'page.editorialPolicy.desc':  "Antariksham's editorial standards, sourcing policy, correction process, and publishing guidelines.",

  'page.ourMission.title': 'Our Mission',
  'page.ourMission.desc':  'The philosophy and long-term vision behind Antariksham — why we built it, what we stand for, and where we are going.',

  'page.search.title': 'Search',
  'page.search.desc':  'Search articles, missions, and space science topics on Antariksham.',

  'page.gallery.title': 'Gallery',
  'page.gallery.desc':  "Space imagery from NASA and the world's great observatories — nebulae, galaxies, planets and mission photography.",

  'page.apod.title': 'APOD Archive',
  'page.apod.desc':  "Browse the archive of NASA's Astronomy Picture of the Day, with full explanations.",

  'page.live.title': 'Live',
  'page.live.desc':  'Live space intelligence systems — ISS tracker, launch countdowns, NASA APOD and deep space telemetry.',

  'page.issTracker.title': 'ISS Live Tracker',
  'page.issTracker.desc':  'Track the International Space Station in real-time. Live position, altitude, velocity and current crew.',

  'page.launches.title': 'Launch Tracker',
  'page.launches.desc':  'Live rocket launch tracker. Upcoming and recent space launches with countdown timers, launch windows, and livestream links.',

  'page.deepSpace.title': 'Deep Space Tracker',
  'page.deepSpace.desc':  'Live telemetry for Voyager 1, Voyager 2, Parker Solar Probe, Europa Clipper and Lucy.',

  'page.explore.title': 'Explore',
  'page.explore.desc':  'Interactive tools for exploring the solar system, tonight’s sky, and the topics that connect space science together.',

  'page.skyTonight.title': 'Sky Tonight',
  'page.skyTonight.desc':  'What is visible in your sky tonight — planets, the Moon phase, and upcoming ISS passes for your location.',

  'page.solarSystem.title': 'Solar System Explorer',
  'page.solarSystem.desc':  'An interactive orrery of the solar system — planetary positions, orbits, and the missions exploring each world.',

  'page.topics.title': 'Topic Hubs',
  'page.topics.desc':  'Curated hubs that gather the articles, missions and learning material for each major area of space science.',

  'page.lunarSim.title': 'Lunar Landing Simulator',
  'page.lunarSim.desc':  'Fly an Apollo-style lunar descent — manage thrust, fuel and velocity, and try to touch down safely.',
} as const

/** Every valid dictionary key, as a literal union. */
export type DictionaryKey = keyof typeof en

/** The contract each non-English dictionary must satisfy in full. */
export type Dictionary = Record<DictionaryKey, string>
