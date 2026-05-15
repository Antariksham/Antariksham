import Link from 'next/link'

export function LearnSection() {
  return (
    <section style={{ padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '0 24px', maxWidth: '1380px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '8px' }}>Knowledge Layer</div>
            <div style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Learn Space Science</div>
          </div>
          <Link href="/learn" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.6)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Explore all topics →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { icon: '🕳️', difficulty: 'Intermediate', title: 'Black Holes: From Theory to Observation', desc: 'Schwarzschild radius, event horizons, Hawking radiation, and how VLBI imaging captured M87* and Sgr A*.' },
            { icon: '🚀', difficulty: 'Beginner', title: 'Orbital Mechanics — The Math of Spaceflight', desc: 'Kepler\'s laws, escape velocity equations, Hohmann transfer orbits, and the mathematics guiding every mission.' },
            { icon: '🔭', difficulty: 'Advanced', title: 'JWST Explained: Infrared Astronomy & Deep Time', desc: 'How the James Webb Space Telescope peers 13.5 billion years back using infrared optics and L2 positioning.' },
            { icon: '🪐', difficulty: 'Beginner', title: 'The Outer Solar System: Ice Giants & Kuiper Belt', desc: 'Uranus, Neptune, Pluto\'s reclassification, Kuiper Belt objects, and the search for Planet Nine.' },
            { icon: '☀️', difficulty: 'Intermediate', title: 'Solar Physics: Cycles, Flares & Space Weather', desc: '11-year solar cycles, coronal mass ejections, geomagnetic storms and their effects on satellites.' },
            { icon: '🌌', difficulty: 'Advanced', title: 'Relativity & Spacetime — Einstein\'s Framework', desc: 'Special and general relativity, gravitational time dilation, and how GPS satellites correct for Einsteinian effects.' },
          ].map((topic) => (
            <div key={topic.title} style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>{topic.icon}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.4)', marginBottom: '10px' }}>{topic.difficulty}</div>
              <h3 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '20px', fontWeight: 400, lineHeight: 1.3, color: '#ffffff', marginBottom: '10px' }}>{topic.title}</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(240,244,250,0.75)', margin: 0 }}>{topic.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
