export function StatusStrip() {
  return (
    <div style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(11,14,19,0.95)', display: 'flex', alignItems: 'stretch', overflowX: 'auto', padding: '0 48px' }}>

      {/* ISS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 30px 15px 0', marginRight: '30px', borderRight: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: 'rgba(52,216,151,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>🛸</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)' }}>ISS Position</span>
          <span style={{ fontSize: '12px', fontWeight: 500 }}>27,580 km/h</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', color: '#34d897', letterSpacing: '0.08em', animation: 'blink 2s infinite' }}>● Live tracking</span>
        </div>
      </div>

      {/* LAUNCH */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 30px 15px 0', marginRight: '30px', borderRight: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: 'rgba(59,158,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>🚀</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)' }}>Next Launch</span>
          <span style={{ fontSize: '12px', fontWeight: 500 }}>Falcon 9 · Crew Dragon</span>
          <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(238,241,246,0.5)' }}>T−2d 14h 32m</span>
        </div>
      </div>

      {/* APOD */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 30px 15px 0', marginRight: '30px', borderRight: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: 'rgba(201,169,110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>🌌</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)' }}>NASA APOD</span>
          <span style={{ fontSize: '12px', fontWeight: 500 }}>M42 — Orion Nebula</span>
          <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(238,241,246,0.5)' }}>Updated today</span>
        </div>
      </div>

      {/* VOYAGER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 30px 15px 0', marginRight: '30px', borderRight: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: 'rgba(159,122,234,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>🛰️</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)' }}>Voyager 1</span>
          <span style={{ fontSize: '12px', fontWeight: 500 }}>23.6 billion km</span>
          <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(238,241,246,0.5)' }}>Interstellar · 46 years</span>
        </div>
      </div>

      {/* MISSIONS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', padding: '15px 0', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: 'rgba(240,90,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>🌍</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)' }}>Active Missions</span>
          <span style={{ fontSize: '12px', fontWeight: 500 }}>47 worldwide</span>
          <span style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(238,241,246,0.5)' }}>All agencies tracked</span>
        </div>
      </div>

    </div>
  )
}
