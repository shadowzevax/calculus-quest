import { Flag, PersonStanding, MapPin } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 4 — Carrera hacia el límite: un corredor avanza por una pista con cada acierto; las
// opciones son postes/marcadores repartidos a lo largo del camino, no una lista vertical.
export default function RaceLimitGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const progressPct = Math.round((index / total) * 100)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <Flag className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Une cada corredor con su meta</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="TRAMO" />

      <div className="relative h-10 bg-ink/5 rounded-full mb-6 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-coral/30 to-coral/10 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        <div className="absolute inset-y-0 flex items-center transition-all duration-500" style={{ left: `calc(${progressPct}% - 10px)` }}>
          <PersonStanding className="w-7 h-7 text-coral drop-shadow" />
        </div>
        <div className="absolute inset-y-0 right-2 flex items-center">
          <Flag className="w-5 h-5 text-gold" />
        </div>
      </div>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="relative py-4">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-ink/10 rounded-full" />
          <div className="relative flex justify-between">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              return (
                <button
                  key={i}
                  onClick={() => checkChoice(i)}
                  disabled={!!feedback}
                  className={`flex flex-col items-center gap-1 w-1/4 px-1 transition-transform ${selected === i ? '-translate-y-1' : ''} ${isWrongPick ? 'opacity-30' : ''}`}
                >
                  <MapPin className={`w-6 h-6 ${isRight ? 'text-teal' : 'text-coral'}`} fill={selected === i ? 'currentColor' : 'none'} />
                  <span className={`text-[11px] font-mono-lab text-center leading-tight ${isRight ? 'text-teal font-semibold' : 'text-ink/70'}`}>{opt}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="border-t-4 border-dashed border-coral/30 pt-4">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
