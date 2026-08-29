import { Rabbit } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 6 — Golpea el topo: las opciones son agujeros de tierra con un topo asomado; hay
// que "golpearlo" (tocarlo) si es la respuesta correcta — encaja con reconocer rápido si
// algo ES o NO ES una indeterminación.
export default function WhackMoleGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-[#6B4226]">
          <Rabbit className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Empareja cada topo con su agujero</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="RONDA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-4">
          {current.options.map((opt, i) => {
            const hit = feedback && selected === i
            const isRight = feedback && i === current.correctIndex
            const missed = hit && !isRight
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                className="relative flex flex-col items-center transition-transform"
              >
                {/* aguero de tierra */}
                <div
                  className="w-24 h-24 max-w-full mx-auto rounded-full flex items-end justify-center overflow-hidden border-4"
                  style={{
                    background: 'radial-gradient(circle at center, #5b3a29 0%, #7a5236 55%, #a9764f 100%)',
                    borderColor: isRight ? '#2A9D8F' : '#4a2f20',
                  }}
                >
                  <Rabbit
                    className={`w-9 h-9 mb-2 transition-transform ${missed ? 'translate-y-6 opacity-0' : hit ? '-translate-y-1' : ''}`}
                    style={{ color: isRight ? '#2A9D8F' : '#D9B48F' }}
                  />
                </div>
                <span className={`mt-1.5 text-xs font-mono-lab text-center leading-tight ${isRight ? 'text-teal font-semibold' : 'text-ink/70'}`}>
                  {opt}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-2 rounded-2xl p-4" style={{ borderColor: '#7a5236', backgroundColor: '#7a523612' }}>
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
