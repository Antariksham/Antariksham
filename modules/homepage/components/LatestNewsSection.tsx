import Link from 'next/link'

export function LatestNewsSection() {
  return (
    <section style={{ padding: '70px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '38px' }}>
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '6px' }}>Editorial</div>
          <div style={{ fontFamily: 'Crimson Pro, serif', fontSize: '26px', fontWeight: 300 }}>Space Intelligence & Journalism</div>
        </div>
        <Link href="/news" style={{ fontFamily: 'DM Mono, monospace', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,241,246,0.22)', textDecoration: 'none' }}>
          All articles →
        </Link>
      </div>

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.85fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>

        {/* LEAD ARTICLE */}
        <div style={{ background: '#10151c', padding: '36px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '11px' }}>NASA · Artemis</div>
          <h2 style={{ fontFamily: 'Crimson Pro, serif', fontSize: '25px', fontWeight: 400, lineHeight: 1.24, marginBottom: '11px', flex: 1 }}>
            Artemis III Moon Landing Delayed Again — NASA Cites Spacesuit Readiness and Orion Heat Shield Concerns
          </h2>
          <p style={{ fontSize: '12px', fontWeight: 300, lineHeight: 1.65, color: 'rgba(238,241,246,0.5)', marginBottom: '18px' }}>
            The agency has pushed the first crewed lunar landing since Apollo 17 past its 2026 target, citing ongoing development delays with Axiom Space's xEMU spacesuit system and outstanding structural certification work on Orion's heat shield.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'rgba(238,241,246,0.22)' }}>
            <span>By Priya Nair · 12 min read</span>
            <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(240,90,90,0.12)', color: '#f05a5a' }}>Breaking</span>
          </div>
        </div>

        {/* COLUMN 2 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9f7aea', marginBottom: '11px' }}>SpaceX · Starship</div>
            <h3 style={{ fontFamily: 'Crimson Pro, serif', fontSize: '16px', fontWeight: 400, lineHeight: 1.24, marginBottom: '11px', flex: 1 }}>
              Starship IFT-8 Achieves Perfect Booster Catch — A New Era of Reusability
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'rgba(238,241,246,0.22)', marginTop: 'auto' }}>
              <span>6 min</span>
              <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(59,158,255,0.1)', color: '#3b9eff' }}>Analysis</span>
            </div>
          </div>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c9a96e', marginBottom: '11px' }}>ISRO · Moon</div>
            <h3 style={{ fontFamily: 'Crimson Pro, serif', fontSize: '16px', fontWeight: 400, lineHeight: 1.24, marginBottom: '11px', flex: 1 }}>
              Chandrayaan-4 Mission Architecture Revealed — Sample Return by 2027
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'rgba(238,241,246,0.22)', marginTop: 'auto' }}>
              <span>5 min</span>
              <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(201,169,110,0.1)', color: '#c9a96e' }}>Mission</span>
            </div>
          </div>
        </div>

        {/* COLUMN 3 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#34d897', marginBottom: '11px' }}>Discovery · JWST</div>
            <h3 style={{ fontFamily: 'Crimson Pro, serif', fontSize: '16px', fontWeight: 400, lineHeight: 1.24, marginBottom: '11px', flex: 1 }}>
              JWST Detects Possible Biosignature in K2-18b Atmosphere — Scientists Urge Caution
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'rgba(238,241,246,0.22)', marginTop: 'auto' }}>
              <span>9 min</span>
              <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(52,216,151,0.1)', color: '#34d897' }}>Research</span>
            </div>
          </div>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#f97316', marginBottom: '11px' }}>Astronomy · Solar</div>
            <h3 style={{ fontFamily: 'Crimson Pro, serif', fontSize: '16px', fontWeight: 400, lineHeight: 1.24, marginBottom: '11px', flex: 1 }}>
              Sun Reaches Solar Maximum — Strongest Activity in Two Decades Expected
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: 'DM Mono, monospace', fontSize: '9px', color: 'rgba(238,241,246,0.22)', marginTop: 'auto' }}>
              <span>4 min</span>
              <span style={{ padding: '2px 8px', borderRadius: '2px', fontSize: '7px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(249,115,22,0.1)', color: '#fb923c' }}>Science</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
      }
