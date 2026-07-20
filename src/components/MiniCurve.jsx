// Traza una mini-curva de función determinada por un "seed" (ej. el id de la misión),
// como firma visual: cada misión es literalmente una función distinta por explorar.
function seedFromString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

export default function MiniCurve({ seed = 'default', stroke = '#FF6B4A', width = 96, height = 40, animate = true }) {
  const n = seedFromString(String(seed))
  const a = ((n % 20) - 10) / 10 // -1..1
  const b = (((n >> 4) % 20) - 10) / 6
  const phase = (n >> 8) % 100

  const points = []
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = t * width
    const wave = Math.sin(t * Math.PI * 2 + phase) * a
    const curve = (t - 0.5) * (t - 0.5) * b * 4
    const y = height / 2 - (wave * height * 0.3 + curve * height * 0.3)
    points.push(`${x.toFixed(1)},${Math.max(2, Math.min(height - 2, y)).toFixed(1)}`)
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeOpacity="0.15" strokeWidth="1" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'curve-path' : ''}
      />
      <circle cx={points[points.length - 1].split(',')[0]} cy={points[points.length - 1].split(',')[1]} r="2.5" fill={stroke} />
    </svg>
  )
}
