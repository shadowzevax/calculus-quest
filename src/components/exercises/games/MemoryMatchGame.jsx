import { useState } from 'react'
import { RotateCw, Brain } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 12 — Memoria: cuando el ejercicio ya es de tipo "emparejar" (pares función-derivada)
// se usa tal cual, que es justo el juego de memoria. Los demás ejercicios se presentan primero
// como una carta boca abajo, y las opciones como un pequeño tablero de mini-cartas volteables.
export default function MemoryMatchGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [flipped, setFlipped] = useState(false)
  const [revealedOpts, setRevealedOpts] = useState([])

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Encuentra cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  if (!flipped) {
    return (
      <div className="text-center py-4">
        <GameHeader index={index} total={total} label="CARTA" />
        <button
          onClick={() => setFlipped(true)}
          className="mx-auto w-40 h-24 rounded-xl bg-blueprint text-white flex flex-col items-center justify-center gap-2 hover:bg-coral transition-colors"
        >
          <RotateCw className="w-6 h-6" />
          <span className="text-xs font-mono-lab">Voltear carta</span>
        </button>
      </div>
    )
  }

  const reveal = (i) => setRevealedOpts((r) => (r.includes(i) ? r : [...r, i]))

  return (
    <div>
      <GameHeader index={index} total={total} label="CARTA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-3">
          {current.options.map((opt, i) => {
            const isUp = revealedOpts.includes(i) || !!feedback
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => (isUp ? checkChoice(i) : reveal(i))}
                disabled={!!feedback}
                className={`h-16 rounded-lg border-2 flex items-center justify-center text-center text-xs font-mono-lab px-2 transition-all ${
                  isUp
                    ? `bg-white ${selected === i ? 'border-coral' : 'border-ink/15'} ${isRight ? '!border-teal bg-teal/10' : ''} ${isWrongPick ? 'opacity-30' : ''}`
                    : 'bg-blueprint text-white hover:bg-blueprint/90 border-blueprint'
                }`}
              >
                {isUp ? opt : <Brain className="w-5 h-5 opacity-70" />}
              </button>
            )
          })}
        </div>
      ) : (
        <TextAnswer feedback={feedback} onCheck={checkText} />
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setFlipped(false); setRevealedOpts([]) }} />
    </div>
  )
}
