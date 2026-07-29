/**
 * Solar System body data for the Explore section.
 *
 * Pure presentational + reference data (no fetching): what a data feed can't
 * provide — descriptions, key facts, depiction colors, and the destination
 * aliases used to match the missions database to each body. Follows the
 * `DeepSpaceTracker` META precedent: per-item depiction colors are content
 * (Mars *is* red), not UI chrome, so they live here rather than in the theme
 * tokens. All UI chrome around them uses the standard design tokens.
 *
 * Orbital elements live separately in `orrery.ts` (keyed by the same ids).
 */

export interface BodyFact {
  label: string
  value: string
}

export interface RelatedLink {
  label: string
  href:  string
}

export interface SolarBody {
  id:        string
  name:      string
  kind:      'star' | 'planet' | 'dwarf' | 'moon'
  /** Human label for the kind chip, e.g. "Terrestrial planet". */
  kindLabel: string
  /** Depiction color (content, like a photo — not themed UI chrome). */
  color:     string
  /** Display dot radius in the orrery, px in SVG units (NOT to scale). */
  size:      number
  /** One-line hook shown under the name. */
  tagline:   string
  /** 2–3 sentence description for the facts panel. */
  description: string
  facts:     BodyFact[]
  /** Notable-moons line, when it earns one. */
  moons?:    string
  /** Lowercase tokens matched (whole-word) against mission `destination`. */
  aliases:   string[]
  /** Query for the site-search cross-link. */
  search:    string
  related?:  RelatedLink[]
}

export const SOLAR_BODIES: SolarBody[] = [
  {
    id: 'sun', name: 'Sun', kind: 'star', kindLabel: 'G-type star',
    color: 'hsl(42, 100%, 62%)', size: 17,
    tagline: 'The star that holds — and powers — everything on this map.',
    description:
      'The Sun contains 99.8% of the Solar System’s mass and fuses about 600 million tonnes of hydrogen into helium every second. Its outer atmosphere, the corona, is millions of degrees hotter than its surface — a mystery probes like Parker Solar Probe were built to solve.',
    facts: [
      { label: 'Diameter',     value: '1.39 million km' },
      { label: 'Mass',         value: '333,000 × Earth' },
      { label: 'Surface temp', value: '5,505 °C' },
      { label: 'Core temp',    value: '≈15 million °C' },
      { label: 'Rotation',     value: '≈25 days (equator)' },
      { label: 'Age',          value: '≈4.6 billion years' },
    ],
    aliases: ['sun', 'solar', 'heliocentric', 'corona'],
    search: 'Sun',
    related: [{ label: 'Track Parker Solar Probe live', href: '/live/deep-space' }],
  },
  {
    id: 'mercury', name: 'Mercury', kind: 'planet', kindLabel: 'Terrestrial planet',
    color: 'hsl(30, 8%, 63%)', size: 4.5,
    tagline: 'The smallest planet, racing around the Sun every 88 days.',
    description:
      'Sun-scorched by day and frozen by night, Mercury swings through the largest temperature range of any planet. With almost no atmosphere to protect it, its cratered surface records four billion years of impacts.',
    facts: [
      { label: 'Distance from Sun', value: '57.9 million km' },
      { label: 'Diameter',          value: '4,879 km' },
      { label: 'Gravity',           value: '3.7 m/s²' },
      { label: 'Day (solar)',       value: '176 Earth days' },
      { label: 'Year',              value: '88 Earth days' },
      { label: 'Temperature',       value: '−173 to 427 °C' },
    ],
    aliases: ['mercury'],
    search: 'Mercury',
  },
  {
    id: 'venus', name: 'Venus', kind: 'planet', kindLabel: 'Terrestrial planet',
    color: 'hsl(38, 64%, 70%)', size: 6.5,
    tagline: 'A runaway greenhouse — the hottest surface of any planet.',
    description:
      'Beneath unbroken clouds of sulphuric acid, Venus bakes at 465 °C under an atmosphere 92 times denser than Earth’s. It spins backwards, so slowly that its day outlasts its year — yet it is nearly Earth’s twin in size.',
    facts: [
      { label: 'Distance from Sun', value: '108.2 million km' },
      { label: 'Diameter',          value: '12,104 km' },
      { label: 'Gravity',           value: '8.87 m/s²' },
      { label: 'Day (rotation)',    value: '243 Earth days' },
      { label: 'Year',              value: '225 Earth days' },
      { label: 'Surface temp',      value: '≈465 °C' },
    ],
    aliases: ['venus', 'venusian'],
    search: 'Venus',
  },
  {
    id: 'earth', name: 'Earth', kind: 'planet', kindLabel: 'Terrestrial planet',
    color: 'hsl(210, 75%, 58%)', size: 7,
    tagline: 'You are here — the only world known to hold life.',
    description:
      'A water world with a protective magnetic field and an oxygen-rich atmosphere, Earth is the baseline against which every other planet is measured. Most of spaceflight still happens here, in low Earth orbit.',
    facts: [
      { label: 'Distance from Sun', value: '149.6 million km' },
      { label: 'Diameter',          value: '12,742 km' },
      { label: 'Gravity',           value: '9.81 m/s²' },
      { label: 'Day',               value: '23 h 56 m' },
      { label: 'Year',              value: '365.25 days' },
      { label: 'Average temp',      value: '15 °C' },
    ],
    moons: '1 moon — the Moon',
    aliases: ['earth', 'low earth orbit', 'earth orbit', 'leo', 'geostationary'],
    search: 'Earth',
    related: [{ label: 'Track the ISS live', href: '/live/iss-tracker' }],
  },
  {
    id: 'moon', name: 'Moon', kind: 'moon', kindLabel: 'Earth’s moon',
    color: 'hsl(220, 8%, 72%)', size: 3,
    tagline: 'Humanity’s first stepping stone beyond Earth.',
    description:
      'The Moon stabilises Earth’s tilt, drives its tides, and preserves a pristine record of the early Solar System. Twelve people have walked on it — and a new generation of landers and crewed missions is heading back, aiming for the water ice at its south pole.',
    facts: [
      { label: 'Distance from Earth', value: '384,400 km' },
      { label: 'Diameter',            value: '3,475 km' },
      { label: 'Gravity',             value: '1.62 m/s²' },
      { label: 'Orbital period',      value: '27.3 days' },
      { label: 'Day (lunar)',         value: '29.5 Earth days' },
      { label: 'Temperature',         value: '−173 to 127 °C' },
    ],
    aliases: ['moon', 'lunar', 'the moon', 'cislunar'],
    search: 'Moon',
    related: [{ label: 'Fly the Lunar Landing Simulator', href: '/lunar-sim' }],
  },
  {
    id: 'mars', name: 'Mars', kind: 'planet', kindLabel: 'Terrestrial planet',
    color: 'hsl(16, 72%, 55%)', size: 5.5,
    tagline: 'The most explored planet beyond Earth — and the next horizon.',
    description:
      'Rovers, landers and orbiters have made Mars the best-studied world after our own. Its rusty deserts hide dry riverbeds, ancient lake floors and subsurface ice — evidence it was once warm and wet, and the reason the search for past life centres here.',
    facts: [
      { label: 'Distance from Sun', value: '227.9 million km' },
      { label: 'Diameter',          value: '6,779 km' },
      { label: 'Gravity',           value: '3.71 m/s²' },
      { label: 'Day',               value: '24 h 37 m' },
      { label: 'Year',              value: '687 Earth days' },
      { label: 'Average temp',      value: '−65 °C' },
    ],
    moons: '2 moons — Phobos & Deimos',
    aliases: ['mars', 'martian', 'phobos', 'deimos'],
    search: 'Mars',
  },
  {
    id: 'jupiter', name: 'Jupiter', kind: 'planet', kindLabel: 'Gas giant',
    color: 'hsl(28, 55%, 62%)', size: 13,
    tagline: 'A planet so massive it shapes the entire Solar System.',
    description:
      'Jupiter out-weighs every other planet combined. Its Great Red Spot is a storm wider than Earth that has raged for centuries, and its icy moon Europa — target of the Europa Clipper mission — may hide a habitable ocean beneath its frozen shell.',
    facts: [
      { label: 'Distance from Sun', value: '778.5 million km' },
      { label: 'Diameter',          value: '139,820 km' },
      { label: 'Gravity',           value: '24.79 m/s²' },
      { label: 'Day',               value: '9 h 56 m' },
      { label: 'Year',              value: '11.9 Earth years' },
      { label: 'Cloud-top temp',    value: '−110 °C' },
    ],
    moons: '95 confirmed moons — incl. Io, Europa, Ganymede, Callisto',
    aliases: ['jupiter', 'jovian', 'europa', 'ganymede', 'callisto', 'io'],
    search: 'Jupiter',
    related: [{ label: 'Track Europa Clipper live', href: '/live/deep-space' }],
  },
  {
    id: 'saturn', name: 'Saturn', kind: 'planet', kindLabel: 'Gas giant',
    color: 'hsl(45, 55%, 68%)', size: 11,
    tagline: 'The ringed giant — and keeper of ocean-moon Enceladus.',
    description:
      'Saturn’s rings are made of countless shards of nearly pure water ice, some as small as dust and some as large as houses. Its moon Titan has rivers and seas of liquid methane, while tiny Enceladus vents its buried ocean into space.',
    facts: [
      { label: 'Distance from Sun', value: '1.43 billion km' },
      { label: 'Diameter',          value: '116,460 km' },
      { label: 'Gravity',           value: '10.44 m/s²' },
      { label: 'Day',               value: '10 h 33 m' },
      { label: 'Year',              value: '29.4 Earth years' },
      { label: 'Cloud-top temp',    value: '−140 °C' },
    ],
    moons: '270+ confirmed moons — incl. Titan & Enceladus',
    aliases: ['saturn', 'titan', 'enceladus'],
    search: 'Saturn',
  },
  {
    id: 'uranus', name: 'Uranus', kind: 'planet', kindLabel: 'Ice giant',
    color: 'hsl(182, 55%, 65%)', size: 8.5,
    tagline: 'The sideways planet, rolling around the Sun on its side.',
    description:
      'Knocked over long ago — likely by a giant impact — Uranus spins with its axis tilted 98°, giving each pole 42 straight years of sunlight and darkness. Visited only once, by Voyager 2 in 1986, it is a top-priority target for a future flagship mission.',
    facts: [
      { label: 'Distance from Sun', value: '2.87 billion km' },
      { label: 'Diameter',          value: '50,724 km' },
      { label: 'Gravity',           value: '8.87 m/s²' },
      { label: 'Day',               value: '17 h 14 m' },
      { label: 'Year',              value: '84 Earth years' },
      { label: 'Temperature',       value: '−195 °C' },
    ],
    moons: '28 known moons, named for Shakespeare characters',
    aliases: ['uranus'],
    search: 'Uranus',
  },
  {
    id: 'neptune', name: 'Neptune', kind: 'planet', kindLabel: 'Ice giant',
    color: 'hsl(222, 70%, 60%)', size: 8,
    tagline: 'The windiest world — found with mathematics before telescopes.',
    description:
      'Neptune was predicted on paper from wobbles in Uranus’s orbit before anyone saw it. Its supersonic winds top 2,000 km/h, and its captured moon Triton — orbiting backwards — erupts geysers of nitrogen ice.',
    facts: [
      { label: 'Distance from Sun', value: '4.50 billion km' },
      { label: 'Diameter',          value: '49,244 km' },
      { label: 'Gravity',           value: '11.15 m/s²' },
      { label: 'Day',               value: '16 h 6 m' },
      { label: 'Year',              value: '165 Earth years' },
      { label: 'Temperature',       value: '−200 °C' },
    ],
    moons: '16 known moons — Triton dominates them all',
    aliases: ['neptune', 'triton'],
    search: 'Neptune',
  },
  {
    id: 'pluto', name: 'Pluto', kind: 'dwarf', kindLabel: 'Dwarf planet',
    color: 'hsl(28, 25%, 68%)', size: 3.5,
    tagline: 'The Kuiper Belt’s king — a frozen world with a heart.',
    description:
      'Demoted but never diminished: New Horizons revealed Pluto as a strikingly active world with nitrogen-ice glaciers, water-ice mountains and a hazy blue atmosphere. Its orbit is so eccentric it periodically comes closer to the Sun than Neptune.',
    facts: [
      { label: 'Distance from Sun', value: '5.91 billion km (avg)' },
      { label: 'Diameter',          value: '2,377 km' },
      { label: 'Gravity',           value: '0.62 m/s²' },
      { label: 'Day',               value: '6.4 Earth days' },
      { label: 'Year',              value: '248 Earth years' },
      { label: 'Temperature',       value: '≈−230 °C' },
    ],
    moons: '5 moons — Charon is half Pluto’s size',
    aliases: ['pluto', 'charon', 'kuiper belt', 'kuiper'],
    search: 'Pluto',
    related: [{ label: 'Track New Horizons live', href: '/live/deep-space' }],
  },
]

/** Fast id → body lookup. */
export const BODY_BY_ID: Record<string, SolarBody> = Object.fromEntries(
  SOLAR_BODIES.map(b => [b.id, b]),
)
