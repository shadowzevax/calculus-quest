import { useState } from 'react'
import { Disc3 } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 10 — Rueda del azar: gira la ruleta y "cae" en el siguiente límite a resolver —
// refuerza la variedad de técnicas (factorizar, racionalizar) para las indeterminaciones.
export default function WheelSpinGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [spun, setSpun] = useState(false)
  const [spinning, setSpinning] = useState(false)

  const spin = () => {
    setSpinning(true)
    setTimeout(() => { setSpinning(false); setSpun(true) }, 700)
  }

  if (!spun) {
    return (
      <div className="text-center py-6">
        <GameHeader index={index} total={total} label="TURNO" />
        <Disc3
          className={`w-20 h-20 mx-auto text-gold transition-transform ${spinning ? 'duration-700 rotate-[900deg]' : 'duration-300'}`}
        />
        <button
          onClick={spin}
          disabled={spinning}
          className="mt-6 bg-gold hover:bg-coral transition-colors text-white rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {spinning ? 'Girando...' : 'Girar la ruleta'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="TURNO" />
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
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setSpun(false) }} />
    </div>
  )
}
