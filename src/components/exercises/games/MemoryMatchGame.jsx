import { useEffect, useRef, useState } from 'react'
import { Brain, Eye, EyeOff } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const MEMORIZE_SECONDS = 8

// Misión 12 — Memoria: todas las opciones se muestran boca arriba unos segundos para que se
// memoricen, luego se tapan y solo queda UN intento para señalar la correcta de memoria.
export default function MemoryMatchGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [secondsLeft, setSecondsLeft] = useState(MEMORIZE_SECONDS)
  const timerRef = useRef(null)

  useEffect(() => {
    if (items.kind !== 'choice') return
    setSecondsLeft(MEMORIZE_SECONDS)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Brain className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Encuentra cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const memorizing = items.kind === 'choice' && secondsLeft > 0

  return (
    <div>
      <GameHeader index={index} total={total} label="RONDA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div>
          <div className={`flex items-center gap-1.5 mb-2 text-xs font-mono-lab ${memorizing ? 'text-coral' : 'text-blueprint'}`}>
            {memorizing ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {memorizing ? `Memoriza la respuesta correcta... ${secondsLeft}s` : 'Elige de memoria — solo tienes un intento'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              return (
                <button
                  key={i}
                  onClick={() => !memorizing && checkChoice(i)}
                  disabled={!!feedback || memorizing}
                  className={`h-16 rounded-lg border-2 flex items-center justify-center text-center text-xs font-mono-lab px-2 transition-all ${
                    memorizing
                      ? 'bg-white border-blueprint/20'
                      : `bg-blueprint text-white hover:bg-blueprint/90 border-blueprint ${isWrongPick ? 'opacity-30' : ''}`
                  } ${isRight ? '!bg-teal/10 !border-teal !text-teal' : ''}`}
                >
                  {memorizing ? opt : (feedback ? opt : <Brain className="w-5 h-5 opacity-70" />)}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <TextAnswer feedback={feedback} onCheck={checkText} />
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
