import { Flag, PersonStanding } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 4 — Carrera hacia el límite: un corredor avanza por una pista con cada acierto,
// acercándose a la meta — refuerza visualmente la idea de "x se acerca a un valor a".
export default function RaceLimitGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const progressPct = Math.round((index / total) * 100)

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
        <div className="space-y-2">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => checkChoice(i)}
              disabled={!!feedback}
              className={`w-full text-left border rounded-lg px-4 py-2.5 text-sm font-mono-lab transition-colors ${
                selected === i ? 'border-coral bg-coral/5' : 'border-ink/10'
              } ${feedback && i === current.correctIndex ? 'border-teal bg-teal/10' : ''} ${
                feedback && selected === i && i !== current.correctIndex ? 'border-red-400 bg-red-50' : ''
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
