import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 5 — Diagrama interactivo: la pregunta se muestra sobre un plano cartesiano; las
// opciones son etiquetas que se "sueltan" (con un clic) en el diagrama — encaja con
// transformaciones de gráficas (desplazar, reflejar).
export default function DiagramDragGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  return (
    <div>
      <GameHeader index={index} total={total} label="DIAGRAMA" />

      <div className="relative bg-blueprint/5 border border-blueprint/15 rounded-xl p-6 mb-4 overflow-hidden">
        <svg width="100%" height="90" viewBox="0 0 200 90" className="opacity-60">
          <line x1="0" y1="45" x2="200" y2="45" stroke="#1B3A5C" strokeWidth="1" />
          <line x1="100" y1="0" x2="100" y2="90" stroke="#1B3A5C" strokeWidth="1" />
          <path d="M 20 70 Q 100 -10 180 20" fill="none" stroke="#FF6B4A" strokeWidth="2" />
        </svg>
        {selected !== null && items.kind === 'choice' && (
          <div className="absolute top-2 right-3 bg-white border border-coral/40 rounded-md px-2 py-1 text-xs font-mono-lab text-coral shadow-sm">
            {current.options[selected]}
          </div>
        )}
      </div>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="flex flex-wrap gap-2">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => checkChoice(i)}
              disabled={!!feedback}
              className={`border rounded-full px-4 py-2 text-sm font-mono-lab transition-colors ${
                selected === i ? 'border-coral bg-coral/10' : 'border-ink/15 hover:bg-ink/5'
              } ${feedback && i === current.correctIndex ? '!border-teal bg-teal/10' : ''} ${
                feedback && selected === i && i !== current.correctIndex ? '!border-red-400 bg-red-50' : ''
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
