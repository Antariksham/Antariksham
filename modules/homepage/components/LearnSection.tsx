import Link from 'next/link'

export function LearnSection() {
  return (
    <section style={{ padding: '70px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '38px' }}>
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '6px' }}>Knowledge Layer</div>
          <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: '26px', fontWeight: 300 }}>Learn Space Science</div>
        </div>
        <Link href="/learn" style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)', textDecoration: 'none' }}>
          Explore all topics →
        </Link>
      </div>

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>

        {[
          {
            icon: '🕳️',
            difficulty: 'Intermediate',
            title: 'Black Holes: From Theory to Observation',
            desc: 'Schwarzschild radius, event horizons, Hawking radiation, and how VLBI imaging captured M87* and Sgr A*.',
          },
          {
            icon: '🚀',
            difficulty: 'Beginner',
            title: 'Orbital Mechanics — The Math of Spaceflight',
            desc: 'Kepler\'s laws, escape velocity equations, Hohmann transfer orbits, and the mathematics guiding every mission.',
          },
          {
            icon: '🔭',
            difficulty: 'Advanced',
            title: 'JWST Explained: Infrared Astronomy & Deep Time',
            desc: 'How the James Webb Space Telescope peers 13.5 billion years back using infrared optics and L2 positioning.',
          },
          {
            icon: '🪐',
            difficulty: 'Beginner',
            title: 'The Outer Solar System: Ice Giants & Kuiper Belt',
            desc: 'Uranus, Neptune, Pluto\'s reclassification, Kuiper Belt objects, and the search for Planet Nine.',
          },
          {
            icon: '☀️',
            difficulty: 'Intermediate',
            title: 'Solar Physics: Cycles, Flares & Space Weather',
            desc: '11-year solar cycles, coronal mass ejections, geomagnetic storms and their effects on satellites.',
          },
          {
            icon: '🌌',
            difficulty: 'Advanced',
            title: 'Relativity & Spacetime — Einstein\'s Framework',
            desc: 'Special and general relativity, gravitational time dilation, and how GPS satellites correct for Einsteinian effects.',
          },
        ].map((topic) => (
          <div key={topic.title} style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '24px', cursor: 'pointer', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', flexShrink: 0, background: '#151c26', border: '1px solid rgba(255,255,255,0.06)' }}>
              {topic.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '7px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)', marginBottom: '5px' }}>
                {topic.difficulty}
              </div>
              <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: '15px', fontWeight: 400, lineHeight: 1.3, marginBottom: '7px' }}>
                {topic.title}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 300, lineHeight: 1.6, color: 'rgba(238,241,246,0.5)' }}>
                {topic.desc}
              </div>
            </div>
          </div>
        ))}

      </div>
    </section>
  )
}
