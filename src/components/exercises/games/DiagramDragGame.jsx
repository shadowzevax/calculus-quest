import { Tag } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 5 — Diagrama interactivo: la pregunta se muestra sobre un plano cartesiano; las
// opciones son etiquetas adhesivas que se "pegan" (con un clic) sobre el diagrama — encaja
// con transformaciones de gráficas (desplazar, reflejar).
export default function DiagramDragGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Tag className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Pega cada etiqueta en su punto correspondiente</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="DIAGRAMA" />

      <div className="relative bg-blueprint/5 border border-blueprint/15 rounded-xl p-6 mb-4 overflow-visible min-h-[110px]">
        <svg width="100%" height="90" viewBox="0 0 200 90" className="opacity-60">
          <line x1="0" y1="45" x2="200" y2="45" stroke="#1B3A5C" strokeWidth="1" />
          <line x1="100" y1="0" x2="100" y2="90" stroke="#1B3A5C" strokeWidth="1" />
          <path d="M 20 70 Q 100 -10 180 20" fill="none" stroke="#FF6B4A" strokeWidth="2" />
        </svg>
        {selected !== null && items.kind === 'choice' && (
          <div className="absolute top-2 right-3 bg-white border-2 border-coral rounded-lg px-2.5 py-1 text-xs font-mono-lab text-coral shadow-md rotate-2 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {current.options[selected]}
          </div>
        )}
      </div>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="flex flex-wrap gap-3">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            const tilt = i % 2 === 0 ? '-rotate-1' : 'rotate-1'
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                className={`relative flex items-center gap-1.5 border-2 rounded-lg px-3.5 py-2 text-sm font-mono-lab shadow-sm transition-transform hover:-translate-y-0.5 ${tilt} ${
                  selected === i ? 'border-coral bg-coral/10' : 'border-ink/15 bg-white'
                } ${isRight ? '!border-teal !bg-teal/10' : ''} ${isWrongPick ? 'opacity-40' : ''}`}
              >
                <Tag className="w-3.5 h-3.5 text-ink/30" /> {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border border-blueprint/20 rounded-xl p-4 bg-blueprint/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
