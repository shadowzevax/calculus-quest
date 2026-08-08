import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import MathText from '@/lib/mathText'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Un color distinto por conexión, para que se puedan diferenciar cuando hay varias a la vez.
const LINE_COLORS = ['#FF6B4A', '#457B9D', '#F4A261', '#9B5DE5', '#2A9D8F', '#E76F51', '#3A86FF', '#D62858']

export default function MatchingExercise({ exercise, onComplete }) {
  const pairs = exercise.metadata?.pairs || []
  const rightItems = useMemo(() => shuffle(pairs.map((p, i) => ({ text: p.right, pairIndex: i }))), [pairs])

  const [selectedLeft, setSelectedLeft] = useState(null)
  const [connections, setConnections] = useState({}) // leftIndex -> rightPairIndex
  const [submitted, setSubmitted] = useState(false)
  const [lines, setLines] = useState([])

  const containerRef = useRef(null)
  const leftRefs = useRef({})
  const rightRefs = useRef({})

  // Recalcula las líneas (posición de cada extremo) cada vez que cambian las conexiones,
  // o si la ventana cambia de tamaño y los botones se mueven.
  useLayoutEffect(() => {
    const recalc = () => {
      const container = containerRef.current
      if (!container) return
      const containerBox = container.getBoundingClientRect()
      const next = Object.entries(connections).map(([leftIndexStr, rightPairIndex]) => {
        const leftIndex = Number(leftIndexStr)
        const leftEl = leftRefs.current[leftIndex]
        const rightEl = rightRefs.current[rightPairIndex]
        if (!leftEl || !rightEl) return null
        const leftBox = leftEl.getBoundingClientRect()
        const rightBox = rightEl.getBoundingClientRect()
        return {
          leftIndex,
          rightPairIndex,
          x1: leftBox.right - containerBox.left,
          y1: leftBox.top + leftBox.height / 2 - containerBox.top,
          x2: rightBox.left - containerBox.left,
          y2: rightBox.top + rightBox.height / 2 - containerBox.top,
          color: LINE_COLORS[leftIndex % LINE_COLORS.length],
          correct: leftIndex === rightPairIndex,
        }
      }).filter(Boolean)
      setLines(next)
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [connections, submitted])

  if (pairs.length === 0) {
    return <p className="text-red-500 text-sm">Este ejercicio no tiene pares configurados.</p>
  }

  const usedRightIndexes = new Set(Object.values(connections))

  const handleLeftClick = (i) => {
    if (submitted) return
    if (connections[i] !== undefined) {
      // Ya tenia pareja: se quita para poder elegir de nuevo.
      setConnections((prev) => {
        const next = { ...prev }
        delete next[i]
        return next
      })
    }
    setSelectedLeft(i)
  }

  const handleRightClick = (rightPairIndex) => {
    if (submitted) return
    const connectedLeftIndex = Object.entries(connections).find(([, v]) => v === rightPairIndex)?.[0]
    if (connectedLeftIndex !== undefined) {
      // Ya tenia pareja: se quita, y si habia un elemento izquierdo en espera lo conecta aqui.
      setConnections((prev) => {
        const next = { ...prev }
        delete next[connectedLeftIndex]
        if (selectedLeft !== null) next[selectedLeft] = rightPairIndex
        return next
      })
      setSelectedLeft(null)
      return
    }
    if (selectedLeft === null) return
    setConnections((prev) => ({ ...prev, [selectedLeft]: rightPairIndex }))
    setSelectedLeft(null)
  }

  const allConnected = Object.keys(connections).length === pairs.length

  const submit = () => {
    setSubmitted(true)
    const correctCount = pairs.filter((_, i) => connections[i] === i).length
    onComplete({ isCorrect: correctCount === pairs.length })
  }

  return (
    <div>
      <p className="text-xs font-mono-lab text-ink/35 mb-3">CONECTA CADA ELEMENTO CON SU PAREJA</p>
      <div ref={containerRef} className="relative grid grid-cols-2 gap-3">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {lines.map((l) => {
            const midX = (l.x1 + l.x2) / 2
            const stroke = submitted ? (l.correct ? '#2A9D8F' : '#EF4444') : l.color
            return (
              <path
                key={l.leftIndex}
                d={`M ${l.x1} ${l.y1} C ${midX} ${l.y1}, ${midX} ${l.y2}, ${l.x2} ${l.y2}`}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
            )
          })}
        </svg>

        <div className="space-y-2 relative" style={{ zIndex: 2 }}>
          {pairs.map((p, i) => (
            <button
              key={i}
              ref={(el) => { leftRefs.current[i] = el }}
              onClick={() => handleLeftClick(i)}
              className={`w-full text-left border rounded-lg px-3 py-2 text-sm font-mono-lab transition-colors bg-white ${
                selectedLeft === i ? 'border-coral bg-coral/5' : 'border-ink/10'
              } ${
                submitted && connections[i] === i ? 'border-teal bg-teal/10' : ''
              } ${submitted && connections[i] !== i && connections[i] !== undefined ? 'border-red-300 bg-red-50' : ''}`}
              style={!submitted && connections[i] !== undefined ? { borderColor: LINE_COLORS[i % LINE_COLORS.length] } : undefined}
            >
              <MathText text={p.left} />
            </button>
          ))}
        </div>
        <div className="space-y-2 relative" style={{ zIndex: 2 }}>
          {rightItems.map((r) => {
            const connectedLeftIndex = Object.entries(connections).find(([, v]) => v === r.pairIndex)?.[0]
            return (
              <button
                key={r.pairIndex}
                ref={(el) => { rightRefs.current[r.pairIndex] = el }}
                onClick={() => handleRightClick(r.pairIndex)}
                disabled={submitted}
                className={`w-full text-left border rounded-lg px-3 py-2 text-sm font-mono-lab transition-colors bg-white ${
                  usedRightIndexes.has(r.pairIndex) ? 'text-ink/70' : 'border-ink/10'
                }`}
                style={!submitted && connectedLeftIndex !== undefined ? { borderColor: LINE_COLORS[Number(connectedLeftIndex) % LINE_COLORS.length] } : undefined}
              >
                <MathText text={r.text} />
              </button>
            )
          })}
        </div>
      </div>

      {submitted && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 ${
          pairs.every((_, i) => connections[i] === i) ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{pairs.every((_, i) => connections[i] === i) ? '¡Todas las conexiones son correctas!' : 'Algunas conexiones no son correctas, revisa en rojo.'}</span>
        </div>
      )}

      <button
        onClick={submit}
        disabled={!allConnected || submitted}
        className="mt-4 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
      >
        Verificar conexiones
      </button>
    </div>
  )
}
