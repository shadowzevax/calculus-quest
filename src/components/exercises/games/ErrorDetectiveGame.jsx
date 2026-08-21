import { Search } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 8 — Detective de errores: se investiga un caso (la pregunta) con lupa y se marca la
// opción correcta — encaja con "detectar" en qué puntos falla la continuidad.
export default function ErrorDetectiveGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  return (
    <div>
      <GameHeader index={index} total={total} label="CASO" />

      <div className="flex items-start gap-3 bg-ink/[0.03] border border-ink/10 rounded-xl p-4 mb-4">
        <Search className="w-5 h-5 text-blueprint shrink-0 mt-0.5" />
        <Prompt text={current.prompt} className="mb-0" />
      </div>

      {items.kind === 'choice' ? (
        <div className="space-y-2">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => checkChoice(i)}
              disabled={!!feedback}
              className={`w-full text-left border rounded-lg px-4 py-2.5 text-sm font-mono-lab transition-colors flex items-center gap-2 ${
                selected === i ? 'border-coral bg-coral/5' : 'border-ink/10'
              } ${feedback && i === current.correctIndex ? 'border-teal bg-teal/10' : ''} ${
                feedback && selected === i && i !== current.correctIndex ? 'border-red-400 bg-red-50' : ''
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-ink/20 flex items-center justify-center text-[10px] text-ink/40 shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
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
