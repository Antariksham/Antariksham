import Link from 'next/link'

export function LatestNewsSection() {
  return (
    <section style={{ padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ padding: '0 24px', maxWidth: '1380px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '8px' }}>Editorial</div>
            <div style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 400, color: '#ffffff', lineHeight: 1.1 }}>Space Intelligence & Journalism</div>
          </div>
          <Link href="/news" style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(240,244,250,0.6)', textDecoration: 'none', whiteSpace: 'nowrap', paddingTop: '4px' }}>
            All articles →
          </Link>
        </div>

        {/* LEAD ARTICLE */}
        <div style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px', marginBottom: '16px', cursor: 'pointer' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3b9eff', marginBottom: '14px' }}>NASA · Artemis</div>
          <h2 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 400, lineHeight: 1.2, color: '#ffffff', marginBottom: '14px' }}>
            Artemis III Moon Landing Delayed Again — NASA Cites Spacesuit Readiness and Orion Heat Shield Concerns
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.75, color: 'rgba(240,244,250,0.8)', marginBottom: '20px' }}>
            The agency has pushed the first crewed lunar landing since Apollo 17 past its 2026 target, citing ongoing development delays with Axiom Space's xEMU spacesuit system and outstanding structural work on Orion's heat shield.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'rgba(240,244,250,0.5)' }}>
            <span>By Priya Nair · 12 min read</span>
            <span style={{ padding: '4px 10px', borderRadius: '3px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', background: 'rgba(240,90,90,0.15)', color: '#f05a5a' }}>Breaking</span>
          </div>
        </div>

        {/* SECONDARY ARTICLES — single column on mobile, 2 col on tablet+ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          {[
            { cat: 'SpaceX · Starship', catColor: '#9f7aea', title: 'Starship IFT-8 Achieves Perfect Booster Catch — A New Era of Reusability', excerpt: 'The eighth integrated flight test marks the first fully successful Mechazilla catch, validating rapid reusability at scale.', time: '6 min', tag: 'Analysis', tagColor: '#3b9eff', tagBg: 'rgba(59,158,255,0.12)' },
            { cat: 'Discovery · JWST', catColor: '#34d897', title: 'JWST Detects Possible Biosignature in K2-18b Atmosphere — Scientists Urge Caution', excerpt: 'A spectral signal consistent with dimethyl sulfide sparks careful scientific debate about biological vs. abiotic origins.', time: '9 min', tag: 'Research', tagColor: '#34d897', tagBg: 'rgba(52,216,151,0.12)' },
          ].map((item) => (
            <div key={item.title} style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: item.catColor, marginBottom: '12px' }}>{item.cat}</div>
                <h3 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '20px', fontWeight: 400, lineHeight: 1.25, color: '#ffffff', marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(240,244,250,0.75)', marginBottom: '16px' }}>{item.excerpt}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'rgba(240,244,250,0.45)' }}>
                <span>{item.time} read</span>
                <span style={{ padding: '3px 8px', borderRadius: '3px', fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', background: item.tagBg, color: item.tagColor }}>{item.tag}</span>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {[
            { cat: 'ISRO · Moon', color: '#c9a96e', title: 'Chandrayaan-4 Mission Architecture Revealed — Sample Return by 2027', time: '5 min', tag: 'Mission', tagColor: '#c9a96e', tagBg: 'rgba(201,169,110,0.12)' },
            { cat: 'Astronomy · Solar', color: '#f97316', title: 'Sun Reaches Solar Maximum — Strongest Activity in Two Decades', time: '4 min', tag: 'Science', tagColor: '#fb923c', tagBg: 'rgba(249,115,22,0.12)' },
            { cat: 'ESA · Mars', color: '#e879f9', title: 'ExoMars Rosalind Franklin Rover Gets New Launch Window for 2028', time: '3 min', tag: 'Mission', tagColor: '#e879f9', tagBg: 'rgba(232,121,249,0.12)' },
            { cat: 'NASA · Deep Space', color: '#3b9eff', title: 'Voyager 1 Resumes Full Science Operations After 5-Month Anomaly', time: '7 min', tag: 'Update', tagColor: '#3b9eff', tagBg: 'rgba(59,158,255,0.12)' },
          ].map((item) => (
            <div key={item.title} style={{ background: '#10151c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '22px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: item.color, marginBottom: '10px' }}>{item.cat}</div>
                <h4 style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '17px', fontWeight: 400, lineHeight: 1.3, color: '#ffffff' }}>{item.title}</h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'rgba(240,244,250,0.45)', marginTop: '14px' }}>
                <span>{item.time} read</span>
                <span style={{ padding: '3px 8px', borderRadius: '3px', fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', background: item.tagBg, color: item.tagColor }}>{item.tag}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
