/**
 * Topic hub registry — the curated gateways at /explore/topics.
 *
 * Each topic is a *lens* over content the site already has: the `terms` drive
 * the database lookup (articles / learn / missions), while `bodyId` and
 * `links` wire the hub to the interactive tools. Adding a topic here creates
 * a fully working, SEO-complete hub page — no other file needs to change.
 *
 * Pure data, DOM-free and dependency-free (unit-tested with node:test).
 * Per-topic `color` is depiction/content colour (the `DeepSpaceTracker` META
 * precedent), not UI chrome — all surrounding chrome uses design tokens.
 */

export interface TopicLink {
  label: string
  href:  string
}

export interface Topic {
  slug:        string
  name:        string
  /** Small label above the title, e.g. "Planetary Science". */
  eyebrow:     string
  emoji:       string
  color:       string
  /** One-line hook. */
  tagline:     string
  /** 2–3 sentence hub introduction. */
  description: string
  /**
   * Case-insensitive substring terms matched against content titles,
   * excerpts and (for missions) destinations. Order is irrelevant; the
   * first term is also used as the fallback site-search query.
   */
  terms:       string[]
  /** Solar System Explorer body, when the topic is a place. */
  bodyId?:     string
  /** Tools and live systems that belong to this topic. */
  links?:      TopicLink[]
  /** Query used for the /gallery cross-link. */
  galleryQuery: string
}

export const TOPICS: Topic[] = [
  {
    slug: 'mars', name: 'Mars', eyebrow: 'Planetary Science', emoji: '🔴',
    color: 'hsl(16, 72%, 55%)',
    tagline: 'The most explored world beyond Earth — and the next place humans will stand.',
    description:
      'Mars is the proving ground for everything humanity wants to do beyond Earth. A fleet of orbiters, landers and rovers has mapped its ancient riverbeds and lake floors, sampled its atmosphere and cached rock cores for return to Earth — all in pursuit of one question: did life ever begin here?',
    terms: ['mars', 'martian', 'perseverance', 'curiosity', 'ingenuity', 'phobos', 'deimos'],
    bodyId: 'mars',
    galleryQuery: 'mars surface',
  },
  {
    slug: 'moon', name: 'The Moon', eyebrow: 'Lunar Exploration', emoji: '🌙',
    color: 'hsl(220, 8%, 72%)',
    tagline: 'Humanity’s first destination — and the staging post for everything after.',
    description:
      'Half a century after Apollo, the Moon is busy again. Landers from several nations are targeting the south pole, where permanently shadowed craters hold water ice that could become drinking water, breathable oxygen and rocket propellant for missions heading further out.',
    terms: ['moon', 'lunar', 'apollo', 'artemis', 'chandrayaan', 'chang\'e'],
    bodyId: 'moon',
    links: [{ label: 'Fly the Lunar Landing Simulator', href: '/lunar-sim' }],
    galleryQuery: 'apollo lunar surface',
  },
  {
    slug: 'the-sun', name: 'The Sun', eyebrow: 'Solar Science', emoji: '☀️',
    color: 'hsl(42, 100%, 62%)',
    tagline: 'Our star, its violent weather, and the storms that reach Earth.',
    description:
      'The Sun drives every process on Earth and periodically hurls billions of tonnes of plasma at us. Understanding its magnetic cycle, its million-degree corona and the solar wind is both fundamental physics and practical defence for satellites, power grids and astronauts.',
    terms: ['sun', 'solar', 'corona', 'sunspot', 'solar wind', 'parker solar probe', 'heliophysics', 'aurora'],
    bodyId: 'sun',
    links: [{ label: 'Track Parker Solar Probe', href: '/live/deep-space' }],
    galleryQuery: 'sun solar corona',
  },
  {
    slug: 'giant-planets', name: 'The Giant Planets', eyebrow: 'Outer Solar System', emoji: '🪐',
    color: 'hsl(28, 55%, 62%)',
    tagline: 'Jupiter, Saturn and the ice giants — and the ocean moons they hide.',
    description:
      'The giant planets are systems in miniature, each ruling dozens of moons. Several of those moons — Europa, Enceladus, Titan — hold liquid water or liquid methane beneath their shells, which is why the search for life beyond Earth increasingly points to the outer Solar System.',
    terms: ['jupiter', 'saturn', 'uranus', 'neptune', 'europa', 'ganymede', 'titan', 'enceladus', 'cassini', 'juno', 'juice'],
    bodyId: 'jupiter',
    links: [{ label: 'Track Europa Clipper & JUICE', href: '/live/deep-space' }],
    galleryQuery: 'jupiter saturn cassini',
  },
  {
    slug: 'black-holes', name: 'Black Holes', eyebrow: 'Astrophysics', emoji: '🕳️',
    color: 'hsl(265, 60%, 62%)',
    tagline: 'Where gravity wins — and spacetime itself breaks down.',
    description:
      'Black holes are the universe at its most extreme: objects so dense that not even light escapes. From the supermassive giant anchoring our own galaxy to the merging pairs that ripple spacetime as gravitational waves, they are now directly imaged, weighed and heard.',
    terms: ['black hole', 'event horizon', 'singularity', 'quasar', 'gravitational wave', 'accretion', 'sagittarius a'],
    galleryQuery: 'black hole',
  },
  {
    slug: 'exoplanets', name: 'Exoplanets', eyebrow: 'Worlds Beyond', emoji: '🌍',
    color: 'hsl(150, 55%, 55%)',
    tagline: 'Thousands of known worlds orbiting other stars — and the hunt for a second Earth.',
    description:
      'Three decades ago we knew of no planets outside the Solar System; today the confirmed count runs into the thousands, including rocky worlds in their stars’ habitable zones. The frontier now is atmospheres — reading starlight filtered through alien air for the chemistry of life.',
    terms: ['exoplanet', 'habitable zone', 'transit', 'kepler', 'tess', 'trappist', 'super-earth', 'biosignature'],
    galleryQuery: 'exoplanet',
  },
  {
    slug: 'human-spaceflight', name: 'Human Spaceflight', eyebrow: 'Crewed Missions', emoji: '👨‍🚀',
    color: 'hsl(210, 75%, 58%)',
    tagline: 'People living and working off the planet, continuously, for decades.',
    description:
      'Humans have lived in orbit without a break since 2000. The International Space Station is a laboratory, a diplomatic project and a proving ground for the long-duration life support that missions to the Moon and Mars will depend on — with commercial stations preparing to succeed it.',
    terms: ['astronaut', 'cosmonaut', 'spacewalk', 'crew', 'iss', 'international space station', 'human spaceflight', 'gaganyaan', 'shenzhou'],
    bodyId: 'earth',
    links: [
      { label: 'Track the ISS live', href: '/live/iss-tracker' },
      { label: 'See ISS passes over you', href: '/explore/sky-tonight' },
    ],
    galleryQuery: 'astronaut spacewalk',
  },
  {
    slug: 'rockets-and-launch', name: 'Rockets & Launch', eyebrow: 'Access to Space', emoji: '🚀',
    color: 'hsl(28, 90%, 58%)',
    tagline: 'The machines that break gravity — and the economics reshaping who can.',
    description:
      'Reusability turned launch from an expendable, once-per-vehicle event into something closer to aviation, collapsing the cost of reaching orbit and multiplying how often anyone can go. The rockets flying now — and the heavy-lift vehicles being tested — set the ceiling on every other ambition in spaceflight.',
    terms: ['rocket', 'launch', 'falcon', 'starship', 'sls', 'ariane', 'pslv', 'gslv', 'booster', 'launch vehicle'],
    links: [{ label: 'Upcoming launch schedule', href: '/live/launches' }],
    galleryQuery: 'rocket launch',
  },
  {
    slug: 'deep-space', name: 'Deep Space', eyebrow: 'Interstellar Frontier', emoji: '🛰️',
    color: 'hsl(214, 70%, 60%)',
    tagline: 'The probes leaving the Solar System — and the space between the stars.',
    description:
      'A handful of spacecraft are on one-way journeys out of the Solar System, still returning data decades after launch from distances where sunlight is a faint star and a radio round trip takes the better part of a day. They are humanity’s farthest reach, and our first physical contact with interstellar space.',
    terms: ['voyager', 'interstellar', 'new horizons', 'kuiper', 'pluto', 'heliosphere', 'deep space', 'pioneer'],
    bodyId: 'pluto',
    links: [{ label: 'Live deep-space telemetry', href: '/live/deep-space' }],
    galleryQuery: 'voyager interstellar',
  },
]

export const TOPIC_BY_SLUG: Record<string, Topic> = Object.fromEntries(
  TOPICS.map(t => [t.slug, t]),
)

export const getTopic = (slug: string): Topic | null => TOPIC_BY_SLUG[slug] ?? null
