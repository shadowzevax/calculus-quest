import { PersonStanding, Star } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 13 — Torre/Escalera: cada acierto sube un escalón, cerrando el curso justo antes
// del Escape Room (misión 14) con la sensación de ir escalando hacia la cima.
export default function TowerClimbGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const step = Math.min(index, total - 1)

  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center justify-end shrink-0 w-10">
        <Star className="w-5 h-5 text-gold mb-1" />
        {Array.from({ length: total }).map((_, i) => {
          const rung = total - 1 - i
          const reached = rung <= step
          return (
            <div key={i} className="flex flex-col items-center">
              {rung === step && <PersonStanding className="w-5 h-5 text-coral -mb-1" />}
              <div className={`w-8 h-1.5 rounded-full my-1.5 ${reached ? 'bg-coral' : 'bg-ink/10'}`} />
            </div>
          )
        })}
      </div>

      <div className="flex-1">
        <GameHeader index={index} total={total} label="ESCALÓN" />
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
    </div>
  )
}
