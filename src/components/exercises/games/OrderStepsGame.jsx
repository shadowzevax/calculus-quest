import { Footprints, MapPin } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Puntos de un sendero en zigzag donde se ubican las paradas (hasta 4).
const STOPS = [
  { x: 20, y: 78 },
  { x: 70, y: 45 },
  { x: 30, y: 30 },
  { x: 80, y: 8 },
]

// Misión 3 — Sendero de pasos: la respuesta correcta es la parada correcta de un camino que
// avanza paso a paso; cada opción es una parada del sendero (no una lista vertical de texto),
// y no se revela la respuesta al armarla como ocurría con el orden de fichas.
export default function OrderStepsGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>
  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <Footprints className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Recorre el sendero emparejando cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const stops = STOPS.slice(0, items.kind === 'choice' ? current.options.length : 0)
  const pathD = stops.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ')

  return (
    <div>
      <GameHeader index={index} total={total} label="PASO" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="relative w-full mb-2" style={{ paddingBottom: '55%' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 90" preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke="#FF6B4A" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {stops.map((s, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 transition-transform ${
                  selected === i ? 'scale-110' : 'hover:-translate-y-[110%]'
                } ${isWrongPick ? 'opacity-30' : ''}`}
              >
                <span className="w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center text-[10px] font-mono-lab font-bold shrink-0"
                  style={{ borderColor: isRight ? '#2A9D8F' : '#FF6B4A', color: isRight ? '#2A9D8F' : '#FF6B4A' }}>
                  {i + 1}
                </span>
                <MapPin className="w-5 h-5 -mt-1" style={{ color: isRight ? '#2A9D8F' : '#FF6B4A' }} fill={selected === i ? 'currentColor' : 'none'} />
                <span className={`text-[11px] font-mono-lab text-center leading-tight max-w-[6rem] ${isRight ? 'text-teal font-semibold' : 'text-ink/70'}`}>
                  {current.options[i]}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-coral/30 rounded-xl p-4">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
