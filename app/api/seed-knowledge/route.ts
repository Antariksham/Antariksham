import { NextResponse }    from 'next/server'
import { supabaseAdmin }   from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const ARTICLES = [
  {
    title: 'Orbital Mechanics — The Mathematics of Spaceflight',
    slug: 'orbital-mechanics',
    icon: '🚀',
    difficulty_level: 'Intermediate',
    excerpt: "Kepler's laws, escape velocity, Hohmann transfers, and the equations that guide every spacecraft ever launched.",
    related_topics: ['Kepler Laws', 'Escape Velocity', 'Hohmann Transfer', 'Delta-V'],
    featured: true,
    content: `## Introduction

Orbital mechanics — also called astrodynamics — is the branch of physics that governs how objects move under the influence of gravity in space. Every satellite, spacecraft, and planetary probe follows these laws with extraordinary precision.

## Kepler's Three Laws

Johannes Kepler derived three empirical laws from Tycho Brahe's observations in the early 17th century.

**First Law — Elliptical Orbits:**
Every planet moves in an ellipse with the Sun at one focus. For a spacecraft, the central body (Earth, Sun, etc.) occupies one focus.

$$r = \\frac{a(1 - e^2)}{1 + e\\cos\\theta}$$

Where $r$ is the orbital radius, $a$ is the semi-major axis, $e$ is the eccentricity ($0$ = circle, $1$ = parabola), and $\\theta$ is the true anomaly.

**Second Law — Equal Areas:**
A line joining a planet and the Sun sweeps equal areas in equal time intervals. This means spacecraft move *faster* at periapsis (closest point) and *slower* at apoapsis (farthest point).

**Third Law — Harmonic Law:**
The square of the orbital period $T$ is proportional to the cube of the semi-major axis $a$:

$$T^2 = \\frac{4\\pi^2}{GM} a^3$$

Where $G$ is the gravitational constant and $M$ is the mass of the central body.

## Escape Velocity

To permanently escape a gravitational field, an object must reach escape velocity — the minimum speed at which kinetic energy equals the magnitude of gravitational potential energy:

$$v_{\\text{escape}} = \\sqrt{\\frac{2GM}{r}}$$

At Earth's surface ($r = 6{,}371$ km), this works out to approximately **11.2 km/s**. The Moon's lower gravity means escape velocity there is only 2.38 km/s — one reason lunar landers could ascend with relatively small engines.

## Circular Orbital Velocity

For a stable circular orbit at radius $r$, the required velocity is:

$$v_{\\text{orbit}} = \\sqrt{\\frac{GM}{r}}$$

At the International Space Station's altitude of ~400 km, this gives approximately **7.66 km/s** — why the ISS completes one orbit every 92 minutes.

## Hohmann Transfer Orbit

The most fuel-efficient way to move between two circular orbits is the Hohmann transfer — a half-ellipse connecting the two orbits using exactly two engine burns.

**Delta-V for the first burn** (leaving low orbit):

$$\\Delta v_1 = \\sqrt{\\frac{GM}{r_1}} \\left( \\sqrt{\\frac{2r_2}{r_1 + r_2}} - 1 \\right)$$

**Delta-V for the second burn** (inserting into high orbit):

$$\\Delta v_2 = \\sqrt{\\frac{GM}{r_2}} \\left( 1 - \\sqrt{\\frac{2r_1}{r_1 + r_2}} \\right)$$

The total mission $\\Delta v = \\Delta v_1 + \\Delta v_2$. This is the currency of spaceflight — every mission is budgeted in delta-v.

## The Rocket Equation

Tsiolkovsky's rocket equation links the change in velocity to the mass ratio of the rocket:

$$\\Delta v = v_e \\ln\\left(\\frac{m_0}{m_f}\\right)$$

Where $v_e$ is the exhaust velocity, $m_0$ is the initial mass (fuel + spacecraft), and $m_f$ is the final mass (spacecraft only). This is why rockets are mostly fuel — achieving high $\\Delta v$ demands an exponentially large initial mass ratio.

## Conclusion

Orbital mechanics transforms spaceflight from science fiction into engineering. Every mission profile — from a Starlink deployment to a Mars transfer — is ultimately a solution to these equations.`
  },
  {
    title: 'Black Holes — From Theory to Observation',
    slug: 'black-holes',
    icon: '🕳️',
    difficulty_level: 'Intermediate',
    excerpt: 'Schwarzschild radius, event horizons, Hawking radiation, and how the Event Horizon Telescope captured the first image of a black hole.',
    related_topics: ['General Relativity', 'Schwarzschild Radius', 'Hawking Radiation', 'Event Horizon Telescope'],
    featured: true,
    content: `## What Is a Black Hole?

A black hole is a region of spacetime where gravity is so extreme that nothing — not even light — can escape once it crosses the **event horizon**. They form primarily from the gravitational collapse of massive stars after a supernova, or through mergers of neutron stars.

## The Schwarzschild Radius

Karl Schwarzschild solved Einstein's field equations in 1916 — just weeks after they were published — deriving the radius at which an object becomes a black hole:

$$r_s = \\frac{2GM}{c^2}$$

Where $G$ is the gravitational constant, $M$ is the mass, and $c$ is the speed of light.

For Earth, $r_s \\approx 8.9$ mm. Compress all of Earth's mass into a sphere smaller than a marble, and it becomes a black hole. For the Sun, $r_s \\approx 3$ km.

## Anatomy of a Black Hole

**Singularity:** The central point where density becomes infinite and known physics breaks down. General relativity predicts it; quantum mechanics suggests it cannot literally exist — resolving this is one of the greatest open problems in physics.

**Event Horizon:** The boundary of no return. Once crossed, escape requires exceeding the speed of light. From the outside, an infalling object appears to slow down and redshift into darkness — it never appears to cross the horizon due to gravitational time dilation.

**Photon Sphere:** At $r = 1.5 \\, r_s$, photons can orbit the black hole in unstable circular paths.

**Innermost Stable Circular Orbit (ISCO):** For a non-rotating black hole, the closest stable orbit is at $r = 3 \\, r_s = 6\\,GM/c^2$.

## Hawking Radiation

In 1974, Stephen Hawking showed that black holes are not perfectly black — they emit thermal radiation due to quantum effects near the event horizon. The temperature of this radiation is:

$$T_H = \\frac{\\hbar c^3}{8\\pi G M k_B}$$

Where $\\hbar$ is the reduced Planck constant and $k_B$ is Boltzmann's constant.

For stellar-mass black holes, $T_H$ is fantastically small — far below the cosmic microwave background temperature ($2.7$ K). Hawking radiation is currently undetectable but has profound implications: black holes slowly evaporate over timescales of $t \\sim 5120\\,\\pi G^2 M^3 / (\\hbar c^4)$.

## The First Images — EHT

The Event Horizon Telescope (EHT) is a planet-scale array of radio telescopes linked via very-long-baseline interferometry (VLBI). By synchronising dishes from Hawaii to Antarctica, it achieves an angular resolution of ~20 microarcseconds.

In April 2019, EHT released the first direct image of a black hole — the supermassive black hole **M87***, located 55 million light-years away with a mass of $6.5 \\times 10^9 \\, M_\\odot$. In 2022, they imaged **Sagittarius A*** — the 4 million solar-mass black hole at the centre of our own Milky Way.

## Gravitational Waves

When two black holes merge, they radiate energy as gravitational waves — ripples in spacetime itself. On September 14, 2015, LIGO detected the first such signal: two black holes of ~36 and ~29 solar masses merging 1.3 billion light-years away, releasing energy equivalent to ~3 solar masses in under a second.

The characteristic "chirp" signal matches general relativity's predictions to extraordinary precision.`
  },
  {
    title: 'The James Webb Space Telescope — Infrared Astronomy & Deep Time',
    slug: 'james-webb-space-telescope',
    icon: '🔭',
    difficulty_level: 'Beginner',
    excerpt: 'How JWST peers 13.5 billion years into the past using infrared optics, a sunshield the size of a tennis court, and L2 positioning.',
    related_topics: ['Infrared Astronomy', 'L2 Lagrange Point', 'Redshift', 'Exoplanet Atmospheres'],
    featured: false,
    content: `## Why Infrared?

Light from the earliest galaxies — formed just a few hundred million years after the Big Bang — has been travelling for over 13 billion years. As the universe expands, this light is **redshifted**: its wavelengths stretch from visible and ultraviolet into the infrared. To observe these ancient objects, a telescope must be sensitive to infrared light.

The relationship between redshift $z$ and the scale factor of the universe $a$ is:

$$1 + z = \\frac{a_{\\text{now}}}{a_{\\text{then}}} = \\frac{\\lambda_{\\text{observed}}}{\\lambda_{\\text{emitted}}}$$

At $z = 10$ — corresponding to roughly 480 million years after the Big Bang — visible light (400–700 nm) is redshifted to 4–8 micrometres, squarely in JWST's primary sensitivity range.

## The Observatory

**Primary Mirror:** 6.5 metres in diameter, composed of 18 hexagonal beryllium segments coated in a thin layer of gold (optimised for infrared reflectivity). The mirror is too large to launch in one piece and unfolds in space — one of the most complex deployment sequences ever attempted.

**Sunshield:** A five-layer kite-shaped shield the size of a tennis court (21 × 14 metres) made from Kapton polyimide film. Each layer reflects and radiates heat; the combined effect drops the temperature from ~85°C on the Sun-facing side to ~−233°C (40 K) on the telescope side. JWST's detectors must be kept colder than deep space to avoid swamping their own infrared signal.

**Instruments:** NIRCam (primary imager, 0.6–5 µm), NIRSpec (multi-object spectrograph), MIRI (mid-infrared camera and spectrograph, 5–28 µm), and FGS/NIRISS (guidance and slitless spectroscopy).

## L2 Lagrange Point

JWST orbits the Sun-Earth L2 Lagrange point — approximately 1.5 million kilometres from Earth in the anti-Sun direction. At L2, the gravitational forces of the Sun and Earth combine with centrifugal force to create a stable co-rotating position.

This is advantageous because the Sun, Earth, and Moon are always on the same side — the sunshield can permanently block all three heat sources simultaneously. Hubble, in low Earth orbit, experiences the Earth eclipsing the Sun every 90 minutes, causing thermal cycling that stressed its instruments.

## Early Science Results

Within months of full operations in 2022, JWST delivered transformative results:

- **Earliest galaxies:** Candidate galaxies at $z > 12$, corresponding to less than 400 million years after the Big Bang — far earlier than Hubble could probe.
- **Exoplanet atmospheres:** Transmission spectroscopy of WASP-39b revealed carbon dioxide ($\\text{CO}_2$), water, sulphur dioxide, and other molecules with unprecedented clarity.
- **Stellar nurseries:** The "Cosmic Cliffs" in the Carina Nebula revealed previously hidden protostars in extraordinary resolution.
- **Solar system:** Direct imaging of Neptune's rings and detailed storm tracking on Jupiter.

## Looking Forward

JWST carries enough propellant for at least 20 years of operations — twice the minimum mission requirement — thanks to the precision of the Ariane 5 launch. Future observations will continue probing the epoch of reionisation, the atmospheres of potentially habitable exoplanets, and the formation of the first stars in the universe.`
  },
  {
    title: 'Relativity & Spacetime — Einstein\'s Framework',
    slug: 'relativity-and-spacetime',
    icon: '🌌',
    difficulty_level: 'Advanced',
    excerpt: 'Special and general relativity, gravitational time dilation, length contraction, and why GPS satellites must correct for Einsteinian effects.',
    related_topics: ['Special Relativity', 'General Relativity', 'Time Dilation', 'GPS Corrections'],
    featured: false,
    content: `## Special Relativity (1905)

Einstein's special theory of relativity rests on two postulates: the laws of physics are identical in all inertial (non-accelerating) frames, and the speed of light $c$ is constant for all observers regardless of the motion of source or observer.

These simple postulates have profound consequences.

**Time Dilation:**
A moving clock runs slower than a stationary one. If a clock moves at velocity $v$ relative to an observer, it ticks at a rate:

$$t' = \\frac{t}{\\gamma}, \\quad \\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}$$

where $\\gamma \\geq 1$ is the Lorentz factor. At $v = 0.9c$, $\\gamma \\approx 2.29$ — the moving clock runs at less than half the rate of the stationary one.

**Length Contraction:**
Objects in motion appear contracted along the direction of travel:

$$L' = \\frac{L}{\\gamma}$$

**Mass-Energy Equivalence:**
The most famous equation in physics:

$$E = mc^2$$

More completely, for a moving particle: $E^2 = (pc)^2 + (mc^2)^2$, where $p$ is momentum.

## General Relativity (1915)

Special relativity handles inertial frames. General relativity extends this to accelerating frames and gravity. Einstein's key insight was the **equivalence principle**: there is no local experiment that can distinguish free fall in a gravitational field from inertial motion in empty space.

Gravity is not a force — it is the curvature of spacetime caused by mass and energy. The Einstein field equations relate spacetime curvature to the distribution of matter and energy:

$$G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}$$

Where $G_{\\mu\\nu}$ is the Einstein tensor (encoding curvature), $g_{\\mu\\nu}$ is the metric tensor, $\\Lambda$ is the cosmological constant, and $T_{\\mu\\nu}$ is the stress-energy tensor (encoding matter and energy).

**Gravitational Time Dilation:**
Clocks in stronger gravitational fields run slower. At height $h$ above a massive body of radius $R$:

$$\\frac{\\Delta t_h}{\\Delta t_0} = \\sqrt{1 - \\frac{2GM}{c^2(R+h)}} \\Bigg/ \\sqrt{1 - \\frac{2GM}{c^2 R}}$$

For small $h$, this approximates to:

$$\\frac{\\Delta t_h}{\\Delta t_0} \\approx 1 + \\frac{gh}{c^2}$$

## GPS: Relativity in Engineering

The Global Positioning System provides the clearest real-world demonstration that relativistic corrections are essential engineering, not abstract theory.

GPS satellites orbit at ~20,200 km altitude, moving at ~3.87 km/s. Two effects operate simultaneously:

**Special relativistic effect (time dilation):** The satellite's velocity causes its clock to run *slower* than Earth-surface clocks by:

$$\\Delta t_{\\text{SR}} \\approx -7.2 \\, \\mu\\text{s/day}$$

**General relativistic effect (gravitational time dilation):** The weaker gravitational field at altitude causes satellite clocks to run *faster* than surface clocks by:

$$\\Delta t_{\\text{GR}} \\approx +45.9 \\, \\mu\\text{s/day}$$

The net effect is approximately $+38.4 \\ \\mu$s/day — satellite clocks gain 38 microseconds per day relative to Earth clocks. Since GPS position accuracy depends on time measurements accurate to nanoseconds, this ~38,000 nanosecond daily error would accumulate to position errors of roughly **10 km per day** if uncorrected.

GPS satellite clocks are therefore pre-compensated: they are set to tick slightly slower before launch, so that in orbit they run at the correct rate from Earth's perspective. Every GPS fix you take is a practical application of both special and general relativity.`
  },
]

export async function GET() {
  try {
    const db = supabaseAdmin()

    const { error } = await db
      .from('knowledge_articles')
      .insert(ARTICLES)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${ARTICLES.length} knowledge articles successfully.`,
      slugs: ARTICLES.map(a => a.slug),
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
