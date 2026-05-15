import Link from 'next/link'

export function MissionsSection() {
  return (
    <section style={{ padding: '80px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '48px' }}>
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '10px' }}>Mission Tracking</div>
          <div style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '40px', fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Active & Upcoming Missions</div>
        </div>
        <Link href="/missions" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.6)', textDecoration: 'none' }}>
          All missions →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          {
            agency: 'NASA · Lunar',
            name: 'Artemis III',
            status: 'upcoming',
            statusLabel: 'Upcoming · 2026+',
            dest: 'Moon — South Pole',
            desc: 'First crewed lunar landing since Apollo 17. Targets Shackleton crater rim at the lunar south pole. Crew includes first woman on the Moon.',
            color: '#3b9eff',
          },
          {
            agency: 'NASA · Jupiter',
            name: 'Europa Clipper',
            status: 'active',
            statusLabel: 'En Route · Active',
            dest: 'Jupiter — Europa',
            desc: 'Investigating habitability of Europa\'s subsurface ocean. 49 planned flybys of the moon. Arrives at Jupiter system in April 2030.',
            color: '#3b9eff',
          },
          {
            agency: 'SpaceX · LEO',
            name: 'Starship IFT-8',
            status: 'completed',
            statusLabel: 'Completed',
            dest: 'Low Earth Orbit',
            desc: 'Eighth integrated flight test achieved full-stack reusability milestone with perfect SuperHeavy booster catch by Mechazilla arms.',
            color: '#9f7aea',
          },
          {
            agency: 'ISRO · Lunar',
            name: 'Chandrayaan-4',
            status: 'upcoming',
            statusLabel: 'Development · 2027',
            dest: 'Moon — South Pole',
            desc: 'India\'s first lunar sample return mission. Will collect 3 kg of south pole regolith using orbital docking rendezvous strategy.',
            color: '#c9a96e',
          },
        ].map((m) => (
          <div key={m.name} style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.45)', marginBottom: '8px' }}>{m.agency}</div>
              <div style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '26px', fontWeight: 400, color: '#ffffff', lineHeight: 1.15, marginBottom: '6px' }}>{m.name}</div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.4)', marginBottom: '4px' }}>{m.dest}</div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: m.status === 'active' ? '#34d897' : m.status === 'upcoming' ? '#3b9eff' : 'rgba(240,244,250,0.4)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.status === 'active' ? '#34d897' : m.status === 'upcoming' ? '#3b9eff' : 'rgba(240,244,250,0.3)', display: 'inline-block', flexShrink: 0 }} />
              {m.statusLabel}
            </div>

            <p style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.7, color: 'rgba(240,244,250,0.7)', margin: 0 }}>{m.desc}</p>

          </div>
        ))}
      </div>

    </section>
  )
}
