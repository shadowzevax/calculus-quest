import { PartyPopper } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const BALLOON_COLORS = ['#FF6B4A', '#457B9D', '#F4A261', '#9B5DE5']
const OFFSETS = ['mt-0', 'mt-4', 'mt-1', 'mt-5']

// Misión 9 — Globos: cada opción es un globo flotando a distinta altura; el correcto
// "explota" al tocarlo — dinámica corta y llamativa, buena para una interpretación conceptual.
export default function BalloonPopGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <PartyPopper className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Une cada globo con su pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

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
                className={`relative flex flex-col items-center gap-2 py-4 transition-all ${OFFSETS[i % OFFSETS.length]} ${popped && !isRight ? 'opacity-0 scale-50' : ''}`}
              >
                <div
                  className={`w-20 h-24 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] flex items-center justify-center text-white text-[11px] leading-snug font-mono-lab px-3 py-2 text-center shadow-lg transition-transform ${
                    isRight ? 'ring-4 ring-teal/40 scale-110' : ''
                  }`}
                  style={{ backgroundColor: BALLOON_COLORS[i % BALLOON_COLORS.length] }}
                >
                  {opt}
                </div>
                <div className="w-px h-4 bg-ink/20" />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-2 border-coral/25 rounded-[2rem] p-4 bg-coral/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
