import { Layers } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 1 — Clasificar en grupos: el enunciado se "arrastra" (con un clic, para mantenerlo
// simple) hacia uno de dos contenedores — encaja con la habilidad que se evalúa: reconocer
// si algo pertenece o no a una categoría (es función / no es función, verdadero / falso, etc).
export default function GroupSortGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  return (
    <div>
      <GameHeader index={index} total={total} label="CLASIFICA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-3">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => checkChoice(i)}
              disabled={!!feedback}
              className={`flex flex-col items-center gap-2 border-2 rounded-2xl p-5 text-sm font-mono-lab transition-all ${
                selected === i ? 'border-coral bg-coral/5 -translate-y-0.5' : 'border-dashed border-ink/20 hover:border-ink/35'
              } ${feedback && i === current.correctIndex ? '!border-teal bg-teal/10' : ''} ${
                feedback && selected === i && i !== current.correctIndex ? '!border-red-400 bg-red-50' : ''
              }`}
            >
              <Layers className="w-5 h-5 text-ink/40" />
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
