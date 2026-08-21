import { Rabbit } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 6 — Golpea el topo: las opciones aparecen como topos en agujeros; hay que "golpear"
// (tocar) el correcto — encaja con reconocer rápido si algo ES o NO ES una indeterminación.
export default function WhackMoleGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  return (
    <div>
      <GameHeader index={index} total={total} label="RONDA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-3">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => checkChoice(i)}
              disabled={!!feedback}
              className={`flex items-center gap-2 rounded-full border-2 px-4 py-3 text-sm font-mono-lab transition-transform ${
                selected === i && (!feedback || i === current.correctIndex) ? 'scale-95' : ''
              } ${selected === i ? 'border-coral bg-coral/5' : 'border-ink/10 bg-ink/[0.02]'} ${
                feedback && i === current.correctIndex ? '!border-teal bg-teal/10' : ''
              } ${feedback && selected === i && i !== current.correctIndex ? '!border-red-400 bg-red-50 opacity-60' : ''}`}
            >
              <Rabbit className={`w-4 h-4 shrink-0 ${selected === i ? 'text-coral' : 'text-ink/30'}`} />
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
