import { useState } from 'react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 11 — Simulador gráfico: se mueve un punto sobre el eje x con un control deslizante
// mientras se piensa la respuesta — refuerza explorar la gráfica antes de decidir el tipo
// de discontinuidad, aunque la pregunta en sí se responde igual que siempre debajo.
export default function GraphSimulatorGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [x, setX] = useState(50)

  return (
    <div>
      <GameHeader index={index} total={total} label="ESCENA" />

      <div className="bg-white border border-ink/10 rounded-xl p-4 mb-4">
        <svg width="100%" height="80" viewBox="0 0 220 80">
          <line x1="0" y1="40" x2="220" y2="40" stroke="#1B3A5C" strokeOpacity="0.3" strokeWidth="1" />
          <path d="M 10 60 L 100 25 M 120 25 L 210 55" fill="none" stroke="#FF6B4A" strokeWidth="2" />
          <circle cx={10 + (x / 100) * 200} cy="40" r="4" fill="#F0A93C" />
        </svg>
        <input
          type="range"
          min="0"
          max="100"
          value={x}
          onChange={(e) => setX(Number(e.target.value))}
          className="w-full accent-gold mt-1"
        />
        <p className="text-[11px] font-mono-lab text-ink/40 text-center">Mueve el punto sobre x y observa la gráfica</p>
      </div>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="space-y-2">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => checkChoice(i)}
              disabled={!!feedback}
              className={`w-full text-left border rounded-lg px-4 py-2.5 text-sm font-mono-lab transition-colors ${
                selected === i ? 'border-coral bg-coral/5' : 'border-ink/10'
              } ${feedback && i === current.correctIndex ? 'border-teal bg-teal/10' : ''} ${
                feedback && selected === i && i !== current.correctIndex ? 'border-red-400 bg-red-50' : ''
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <TextAnswer feedback={feedback} onCheck={checkText} />
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
