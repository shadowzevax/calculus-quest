import { useState } from 'react'
import { Package, PackageOpen } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 2 — Abre la caja: una caja numerada por item; al abrirla se revela la pregunta.
// Encaja con "hallar" el dominio/rango de una función.
export default function OpenBoxGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [opened, setOpened] = useState(false)

  const openBox = () => setOpened(true)

  return (
    <div>
      <GameHeader index={index} total={total} label="CAJA" />

      {!opened ? (
        <button
          onClick={openBox}
          className="w-full flex flex-col items-center gap-3 border-2 border-dashed border-gold/40 rounded-2xl py-10 hover:bg-gold/5 transition-colors"
        >
          <Package className="w-12 h-12 text-gold" />
          <span className="text-sm font-mono-lab text-ink/50">Toca para abrir la caja {index + 1}</span>
        </button>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3 text-gold">
            <PackageOpen className="w-5 h-5" />
            <span className="text-xs font-mono-lab uppercase">Caja abierta</span>
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
          <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setOpened(false) }} />
        </div>
      )}
    </div>
  )
}
