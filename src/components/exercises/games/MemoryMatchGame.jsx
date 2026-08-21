import { useState } from 'react'
import { RotateCw } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 12 — Memoria: cuando el ejercicio ya es de tipo "emparejar" (pares función-derivada)
// se usa tal cual, que es justo el juego de memoria. Los demás ejercicios de la misión se
// presentan como una carta que se voltea para revelar la pregunta.
export default function MemoryMatchGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [flipped, setFlipped] = useState(false)

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

  return (
    <div>
      <GameHeader index={index} total={total} label="CARTA" />
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
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setFlipped(false) }} />
    </div>
  )
}
