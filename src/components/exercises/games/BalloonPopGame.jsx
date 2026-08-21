import { Circle } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const BALLOON_COLORS = ['#FF6B4A', '#457B9D', '#F4A261', '#9B5DE5']

// Misión 9 — Globos: cada opción es un globo; el correcto "explota" al tocarlo — dinámica
// corta y llamativa, buena para una interpretación conceptual (la derivada como pendiente).
export default function BalloonPopGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  return (
    <div>
      <GameHeader index={index} total={total} label="GLOBO" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-4">
          {current.options.map((opt, i) => {
            const popped = feedback && selected === i
            const isRight = feedback && i === current.correctIndex
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                className={`relative flex flex-col items-center gap-2 py-4 transition-all ${popped && !isRight ? 'opacity-30 scale-90' : ''}`}
              >
                <div
                  className={`w-full min-h-[6rem] rounded-[45%] flex items-center justify-center text-white text-[11px] leading-snug font-mono-lab px-3 py-3 text-center shadow-md transition-transform ${
                    isRight ? 'ring-4 ring-teal/40 scale-110' : ''
                  }`}
                  style={{ backgroundColor: BALLOON_COLORS[i % BALLOON_COLORS.length] }}
                >
                  {opt}
                </div>
                <Circle className="w-1.5 h-1.5 fill-ink/30 text-ink/30" />
              </button>
            )
          })}
        </div>
      ) : (
        <TextAnswer feedback={feedback} onCheck={checkText} />
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
