import { Inbox } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const BIN_COLORS = ['#FF6B4A', '#457B9D', '#3FBFAD', '#F0A93C']

// Misión 1 — Clasificar en grupos: cada opción es un "contenedor" (canasta) donde se
// arrastra/toca el enunciado — encaja con reconocer si algo pertenece o no a una categoría.
export default function GroupSortGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <Inbox className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Clasifica cada pareja en su lugar</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="CLASIFICA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className={`grid gap-3 ${current.options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {current.options.map((opt, i) => {
            const color = BIN_COLORS[i % BIN_COLORS.length]
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                className={`relative flex flex-col items-center gap-2 rounded-b-2xl rounded-t-lg pt-6 pb-4 px-3 border-b-[6px] text-sm font-mono-lab text-center transition-transform ${
                  selected === i ? '-translate-y-1' : ''
                } ${isWrongPick ? 'opacity-40' : ''}`}
                style={{
                  backgroundColor: `${color}14`,
                  borderColor: isRight ? '#2A9D8F' : color,
                  boxShadow: isRight ? '0 0 0 2px #2A9D8F inset' : undefined,
                }}
              >
                <Inbox className="w-6 h-6" style={{ color }} />
                <span className="text-ink">{opt}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-xl p-4" style={{ borderColor: BIN_COLORS[0] }}>
          <div className="flex items-center gap-2 mb-2 text-coral text-xs font-mono-lab uppercase">
            <Inbox className="w-4 h-4" /> Escribe la respuesta y guárdala en el canasto
          </div>
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
