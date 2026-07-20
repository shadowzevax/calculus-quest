import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MatchingExercise({ exercise, onComplete }) {
  const pairs = exercise.metadata?.pairs || []
  const rightItems = useMemo(() => shuffle(pairs.map((p, i) => ({ text: p.right, pairIndex: i }))), [pairs])

  const [selectedLeft, setSelectedLeft] = useState(null)
  const [connections, setConnections] = useState({}) // leftIndex -> rightPairIndex
  const [submitted, setSubmitted] = useState(false)

  if (pairs.length === 0) {
    return <p className="text-red-500 text-sm">Este ejercicio no tiene pares configurados.</p>
  }

  const usedRightIndexes = new Set(Object.values(connections))

  const handleLeftClick = (i) => {
    if (submitted) return
    setSelectedLeft(i)
  }

  const handleRightClick = (rightPairIndex) => {
    if (submitted || selectedLeft === null || usedRightIndexes.has(rightPairIndex)) return
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <button
              key={i}
              onClick={() => handleLeftClick(i)}
              className={`w-full text-left border rounded-lg px-3 py-2 text-sm font-mono-lab transition-colors ${
                selectedLeft === i ? 'border-coral bg-coral/5' : 'border-ink/10'
              } ${connections[i] !== undefined ? 'bg-ink/[0.03]' : ''} ${
                submitted && connections[i] === i ? 'border-teal bg-teal/10' : ''
              } ${submitted && connections[i] !== i ? 'border-red-300 bg-red-50' : ''}`}
            >
              {p.left} {connections[i] !== undefined && <span className="text-ink/30">→ conectado</span>}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rightItems.map((r) => (
            <button
              key={r.pairIndex}
              onClick={() => handleRightClick(r.pairIndex)}
              disabled={usedRightIndexes.has(r.pairIndex) && Object.values(connections).indexOf(r.pairIndex) === -1}
              className={`w-full text-left border rounded-lg px-3 py-2 text-sm font-mono-lab transition-colors ${
                usedRightIndexes.has(r.pairIndex) ? 'bg-ink/[0.03] text-ink/30' : 'border-ink/10'
              }`}
            >
              {r.text}
            </button>
          ))}
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
