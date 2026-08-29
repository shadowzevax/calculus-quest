import { useState } from 'react'
import { Flag } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const FLAG_COLORS = ['#457B9D', '#FF6B4A', '#F0A93C', '#3FBFAD']

// Misión 11 — Simulador gráfico: se mueve un punto sobre el eje x con un control deslizante,
// y las opciones son banderas clavadas directamente sobre la gráfica — refuerza explorar
// la escena antes de decidir el tipo de discontinuidad.
export default function GraphSimulatorGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
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

  return (
    <div>
      <GameHeader index={index} total={total} label="ESCENA" />

      <div className="relative bg-white border border-ink/10 rounded-xl p-4 mb-4">
        <svg width="100%" height="80" viewBox="0 0 220 80">
          <line x1="0" y1="40" x2="220" y2="40" stroke="#1B3A5C" strokeOpacity="0.3" strokeWidth="1" />
          <path d="M 10 60 L 100 25 M 120 25 L 210 55" fill="none" stroke="#1B3A5C" strokeOpacity="0.35" strokeWidth="2" />
          <circle cx={10 + (x / 100) * 200} cy="40" r="4" fill="#F0A93C" />

          {items.kind === 'choice' && current.options.map((_, i) => {
            const fx = 20 + (i * (180 / Math.max(current.options.length - 1, 1)))
            const isRight = feedback && i === current.correctIndex
            return (
              <g
                key={i}
                onClick={() => !feedback && checkChoice(i)}
                style={{ cursor: feedback ? 'default' : 'pointer' }}
              >
                <line x1={fx} y1="10" x2={fx} y2="70" stroke={isRight ? '#2A9D8F' : FLAG_COLORS[i % FLAG_COLORS.length]} strokeWidth="2" />
                <polygon points={`${fx},10 ${fx + 14},15 ${fx},20`} fill={isRight ? '#2A9D8F' : FLAG_COLORS[i % FLAG_COLORS.length]} />
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
        <p className="text-[11px] font-mono-lab text-ink/40 text-center">Mueve el punto y toca la bandera con la respuesta correcta</p>
      </div>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-2">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                className={`flex items-center gap-1.5 border-l-4 rounded px-3 py-2 text-xs font-mono-lab bg-white transition-opacity ${isWrongPick ? 'opacity-30' : ''}`}
                style={{ borderColor: isRight ? '#2A9D8F' : FLAG_COLORS[i % FLAG_COLORS.length] }}
              >
                <Flag className="w-3.5 h-3.5 shrink-0" style={{ color: isRight ? '#2A9D8F' : FLAG_COLORS[i % FLAG_COLORS.length] }} />
                {opt}
              </button>
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
