import Link from 'next/link'

export function LatestNewsSection() {
  return (
    <section style={{ padding: '80px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '8px' }}>Editorial</div>
          <div style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '36px', fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Space Intelligence & Journalism</div>
        </div>
        <Link href="/news" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.6)', textDecoration: 'none' }}>
          All articles →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.85fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>

        {/* LEAD */}
        <div style={{ background: '#10151c', padding: '40px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '16px' }}>NASA · Artemis</div>
          <h2 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '28px', fontWeight: 400, lineHeight: 1.2, color: '#ffffff', marginBottom: '16px', flex: 1 }}>
            Artemis III Moon Landing Delayed Again — NASA Cites Spacesuit Readiness and Orion Heat Shield Concerns
          </h2>
          <p style={{ fontSize: '15px', fontWeight: 400, lineHeight: 1.7, color: 'rgba(240,244,250,0.8)', marginBottom: '24px' }}>
            The agency has pushed the first crewed lunar landing since Apollo 17 past its 2026 target, citing ongoing development delays with Axiom Space's xEMU spacesuit system and outstanding structural certification work on Orion's heat shield.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'rgba(240,244,250,0.5)', marginTop: 'auto' }}>
            <span>By Priya Nair · 12 min read</span>
            <span style={{ padding: '3px 10px', borderRadius: '2px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(240,90,90,0.15)', color: '#f05a5a' }}>Breaking</span>
          </div>
        </div>

        {/* COL 2 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9f7aea', marginBottom: '12px' }}>SpaceX · Starship</div>
            <h3 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '20px', fontWeight: 400, lineHeight: 1.25, color: '#ffffff', marginBottom: '10px', flex: 1 }}>
              Starship IFT-8 Achieves Perfect Booster Catch — A New Era of Reusability
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(240,244,250,0.7)', lineHeight: 1.65, marginBottom: '16px' }}>
              The eighth integrated flight test marks the first fully successful Mechazilla catch, validating SpaceX's rapid reusability concept.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'rgba(240,244,250,0.45)', marginTop: 'auto' }}>
              <span>6 min</span>
              <span style={{ padding: '3px 8px', borderRadius: '2px', fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(59,158,255,0.12)', color: '#3b9eff' }}>Analysis</span>
            </div>
          </div>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c9a96e', marginBottom: '12px' }}>ISRO · Moon</div>
            <h3 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '20px', fontWeight: 400, lineHeight: 1.25, color: '#ffffff', marginBottom: '10px', flex: 1 }}>
              Chandrayaan-4 Mission Architecture Revealed — Sample Return by 2027
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(240,244,250,0.7)', lineHeight: 1.65, marginBottom: '16px' }}>
              ISRO's detailed mission profile targets 3 kg of lunar regolith from the south pole using orbital docking.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'rgba(240,244,250,0.45)', marginTop: 'auto' }}>
              <span>5 min</span>
              <span style={{ padding: '3px 8px', borderRadius: '2px', fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(201,169,110,0.12)', color: '#c9a96e' }}>Mission</span>
            </div>
          </div>
        </div>

        {/* COL 3 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#34d897', marginBottom: '12px' }}>Discovery · JWST</div>
            <h3 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '20px', fontWeight: 400, lineHeight: 1.25, color: '#ffffff', marginBottom: '10px', flex: 1 }}>
              JWST Detects Possible Biosignature in K2-18b Atmosphere — Scientists Urge Caution
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(240,244,250,0.7)', lineHeight: 1.65, marginBottom: '16px' }}>
              A spectral signal consistent with dimethyl sulfide sparks careful scientific debate about biological vs. abiotic origins.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'rgba(240,244,250,0.45)', marginTop: 'auto' }}>
              <span>9 min</span>
              <span style={{ padding: '3px 8px', borderRadius: '2px', fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(52,216,151,0.12)', color: '#34d897' }}>Research</span>
            </div>
          </div>
          <div style={{ background: '#10151c', padding: '28px', flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f97316', marginBottom: '12px' }}>Astronomy · Solar</div>
            <h3 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '20px', fontWeight: 400, lineHeight: 1.25, color: '#ffffff', marginBottom: '10px', flex: 1 }}>
              Sun Reaches Solar Maximum — Strongest Activity in Two Decades Expected
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(240,244,250,0.7)', lineHeight: 1.65, marginBottom: '16px' }}>
              Solar Cycle 25 has surpassed predictions. Intense aurora activity and geomagnetic storms through late 2026.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'rgba(240,244,250,0.45)', marginTop: 'auto' }}>
              <span>4 min</span>
              <span style={{ padding: '3px 8px', borderRadius: '2px', fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(249,115,22,0.12)', color: '#fb923c' }}>Science</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
