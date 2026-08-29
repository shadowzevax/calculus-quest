import { PersonStanding, Star } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 13 — Torre/Escalera: cada acierto sube un escalón; las opciones se muestran como
// peldaños de la propia escalera — cierra el curso justo antes del Escape Room (misión 14).
export default function TowerClimbGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const step = Math.min(index, total - 1)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-gold">
          <Star className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Escala emparejando cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center justify-end shrink-0 w-10">
        <Star className="w-5 h-5 text-gold mb-1" />
        {Array.from({ length: total }).map((_, i) => {
          const rung = total - 1 - i
          const reached = rung <= step
          return (
            <div key={i} className="flex flex-col items-center">
              {rung === step && <PersonStanding className="w-5 h-5 text-coral -mb-1" />}
              <div className={`w-8 h-1.5 rounded-full my-1.5 ${reached ? 'bg-coral' : 'bg-ink/10'}`} />
            </div>
          )
        })}
      </div>

      <div className="flex-1">
        <GameHeader index={index} total={total} label="ESCALÓN" />
        <Prompt text={current.prompt} />

        {items.kind === 'choice' ? (
          <div className="space-y-2">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              return (
                <button
                  key={i}
                  onClick={() => checkChoice(i)}
                  disabled={!!feedback}
                  className={`w-full flex items-center gap-3 border-b-4 rounded-md px-4 py-2.5 text-sm font-mono-lab bg-ink/[0.02] transition-transform hover:-translate-y-0.5 ${
                    selected === i ? 'border-coral bg-coral/5' : 'border-ink/15'
                  } ${isRight ? '!border-teal bg-teal/10' : ''} ${isWrongPick ? 'opacity-30' : ''}`}
                >
                  <span className="w-5 h-1 bg-current opacity-40 rounded-full shrink-0" />
                  {opt}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="border-b-4 border-gold/40 pb-3">
            <TextAnswer feedback={feedback} onCheck={checkText} />
          </div>
        )}

        <FeedbackBanner feedback={feedback} />
        <NextButton feedback={feedback} index={index} total={total} onNext={next} />
      </div>
    </div>
  )
}
