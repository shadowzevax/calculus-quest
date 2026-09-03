import { useState } from 'react'
import { Flag } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const FLAG_COLORS = ['#457B9D', '#FF6B4A', '#F0A93C', '#3FBFAD']

// Misión 11 — Simulador gráfico: se mueve un punto sobre el eje x con un control deslizante;
// la bandera más cercana al punto se resalta, y solo las banderas (clavadas sobre la propia
// gráfica) son clicables para responder — no hay lista de botones aparte.
export default function GraphSimulatorGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [x, setX] = useState(50)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Flag className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Ubica cada pareja en la escena</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const nOptions = items.kind === 'choice' ? current.options.length : 0
  const flagX = (i) => 20 + i * (180 / Math.max(nOptions - 1, 1))
  let nearest = -1
  if (nOptions > 0) {
    let best = Infinity
    for (let i = 0; i < nOptions; i++) {
      const d = Math.abs(flagX(i) - (10 + (x / 100) * 200))
      if (d < best) { best = d; nearest = i }
    }
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="ESCENA" />

      <div className="relative bg-white border border-ink/10 rounded-xl p-4 mb-4">
        <svg width="100%" height="90" viewBox="0 0 220 90">
          <line x1="0" y1="45" x2="220" y2="45" stroke="#1B3A5C" strokeOpacity="0.3" strokeWidth="1" />
          <path d="M 10 65 L 100 28 M 120 28 L 210 58" fill="none" stroke="#1B3A5C" strokeOpacity="0.35" strokeWidth="2" />
          <circle cx={10 + (x / 100) * 200} cy="45" r="4" fill="#F0A93C" />

          {items.kind === 'choice' && current.options.map((_, i) => {
            const fx = flagX(i)
            const isRight = feedback && i === current.correctIndex
            const isNear = !feedback && i === nearest
            const color = isRight ? '#2A9D8F' : FLAG_COLORS[i % FLAG_COLORS.length]
            return (
              <g
                key={i}
                onClick={() => !feedback && checkChoice(i)}
                style={{ cursor: feedback ? 'default' : 'pointer' }}
              >
                {/* zona invisible mas grande para que sea facil de tocar */}
                <rect x={fx - 9} y="5" width="18" height="75" fill="transparent" />
                <line x1={fx} y1="12" x2={fx} y2="78" stroke={color} strokeWidth={isNear ? 3 : 2} />
                <polygon points={`${fx},12 ${fx + 16},18 ${fx},24`} fill={color} className={isNear ? 'animate-pulse' : ''} />
                {isNear && <circle cx={fx} cy="78" r="3.5" fill={color} />}
              </g>
            )
          })}
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          className="w-full accent-gold mt-1"
        />
        <p className="text-[11px] font-mono-lab text-ink/40 text-center">
          Mueve el punto para acercarte a una bandera y tócala para responder
        </p>
      </div>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="flex flex-wrap gap-2">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            return (
              <span
                key={i}
                className="flex items-center gap-1.5 border-l-4 rounded px-2.5 py-1.5 text-xs font-mono-lab bg-ink/[0.02] text-ink/50"
                style={{ borderColor: isRight ? '#2A9D8F' : FLAG_COLORS[i % FLAG_COLORS.length] }}
              >
                <Flag className="w-3 h-3 shrink-0" style={{ color: isRight ? '#2A9D8F' : FLAG_COLORS[i % FLAG_COLORS.length] }} />
                {opt}
              </span>
            )
          })}
        </div>
      ) : (
        <div className="border border-blueprint/20 rounded-xl p-4 bg-blueprint/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
