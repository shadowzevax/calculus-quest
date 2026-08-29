import { Search, Fingerprint } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2']

// Misión 8 — Detective de errores: se investiga un caso (la pregunta) con lupa, y las opciones
// son "fichas de evidencia" clavadas como en un tablero de investigación — encaja con
// "detectar" en qué puntos falla la continuidad.
export default function ErrorDetectiveGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Fingerprint className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Relaciona cada pista con su caso</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="CASO" />

      <div className="flex items-start gap-3 bg-ink/[0.03] border border-ink/10 rounded-xl p-4 mb-5">
        <Search className="w-5 h-5 text-blueprint shrink-0 mt-0.5" />
        <Prompt text={current.prompt} className="mb-0" />
      </div>

      {items.kind === 'choice' ? (
        <div className="flex flex-wrap justify-center gap-4 py-2">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                className={`relative w-32 bg-[#fdf6e3] border border-ink/15 shadow-md px-3 py-4 text-xs font-mono-lab text-center transition-transform hover:-translate-y-1 ${TILTS[i % TILTS.length]} ${
                  selected === i ? 'ring-2 ring-coral' : ''
                } ${isRight ? '!ring-2 ring-teal bg-teal/10' : ''} ${isWrongPick ? 'opacity-30' : ''}`}
              >
                <Fingerprint className="w-4 h-4 text-ink/30 mx-auto mb-1.5" />
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#fdf6e3] border border-ink/15 shadow-sm rounded-sm p-4">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
