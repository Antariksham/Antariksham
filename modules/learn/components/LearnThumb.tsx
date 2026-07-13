// Generated, space-themed cover for Learn cards. Uses a real image when one is
// provided; otherwise renders an attractive deterministic cover from the topic's
// emoji + a hue derived from its slug, so every card looks designed without a
// stored thumbnail. When a thumbnail column is added later, pass `image`.

const COSMIC_HUES = [212, 244, 265, 190, 288, 226, 200, 320]

// Fixed star field (percent positions) — deterministic, no layout shift
const STARS: [number, number][] = [
  [14, 24], [80, 16], [40, 72], [88, 52], [26, 46],
  [62, 30], [9, 64], [53, 12], [72, 80],
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

interface Props {
  icon:    string
  seed:    string
  image?:  string | null
  height?: string
}

export function LearnThumb({ icon, seed, image, height = '170px' }: Props) {
  if (image) {
    return (
      <div className="card-image" style={{ height, position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    )
  }

  const hue       = COSMIC_HUES[hashStr(seed) % COSMIC_HUES.length]
  const glowCore  = `hsla(${hue}, 72%, 60%, 0.34)`
  const ringGlow  = `hsla(${hue}, 60%, 62%, 0.22)`

  return (
    <div
      className="card-image"
      style={{
        height,
        position:   'relative',
        overflow:   'hidden',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(150deg, hsl(${hue},46%,20%) 0%, hsl(${hue},42%,12%) 44%, #0a0a0f 100%)`,
      }}
    >
      {/* corner nebula glow */}
      <div style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', top: '-95px', right: '-70px', background: `radial-gradient(circle, ${glowCore} 0%, transparent 62%)` }} />
      {/* orbital rings */}
      <div style={{ position: 'absolute', width: '310px', height: '86px', borderRadius: '50%', border: '1px solid rgba(var(--ink),0.07)', transform: 'rotate(-16deg)' }} />
      <div style={{ position: 'absolute', width: '206px', height: '58px', borderRadius: '50%', border: `1px solid ${ringGlow}`, transform: 'rotate(-16deg)' }} />
      {/* stars */}
      {STARS.map(([x, y], i) => (
        <span key={i} aria-hidden style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: i % 3 === 0 ? '3px' : '2px', height: i % 3 === 0 ? '3px' : '2px', borderRadius: '50%', background: 'rgba(var(--ink),0.65)' }} />
      ))}
      {/* focal emoji */}
      <span style={{ fontSize: '54px', lineHeight: 1, position: 'relative', zIndex: 2, filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.55))' }}>
        {icon || '🔭'}
      </span>
    </div>
  )
}
