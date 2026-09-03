import { useState } from 'react'
import { MapPin } from 'lucide-react'
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
const START = { x: 4, y: 94 }

// Misión 3 — Sendero de pasos: un corredor animado avanza por el camino hasta la parada que
// se toque; cada opción es una parada del sendero — el corredor le da al juego una sensación
// de mini-carrera en vez de una lista de opciones con una línea de fondo.
export default function OrderStepsGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>
  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <MapPin className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Recorre el sendero emparejando cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const stops = STOPS.slice(0, items.kind === 'choice' ? current.options.length : 0)
  const pathD = [START, ...stops].map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ')
  const [runnerPos, setRunnerPos] = useState(START)
  const [running, setRunning] = useState(false)

  const pick = (i) => {
    if (feedback || running) return
    setRunning(true)
    setRunnerPos(stops[i])
    setTimeout(() => { checkChoice(i); setRunning(false) }, 550)
  }

  const nextItem = () => { next(); setRunnerPos(START) }

  return (
    <div>
      <GameHeader index={index} total={total} label="PASO" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="relative w-full mb-2 rounded-xl overflow-hidden border border-ink/10" style={{ paddingBottom: '58%', background: 'repeating-linear-gradient(135deg, #FFF7EC, #FFF7EC 14px, #FFF1DE 14px, #FFF1DE 28px)' }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke="#FF6B4A" strokeWidth="1.4" strokeDasharray="3 2.5" strokeLinecap="round" opacity="0.55" vectorEffect="non-scaling-stroke" />
          </svg>

          {/* corredor animado */}
          <div
            className={`absolute z-10 text-2xl select-none transition-all ease-out ${running ? 'duration-500' : 'duration-300'}`}
            style={{ left: `${runnerPos.x}%`, top: `${runnerPos.y}%`, transform: 'translate(-50%, -85%)' }}
          >
            <span className={running ? 'inline-block animate-bounce' : 'inline-block'}>🏃</span>
          </div>

          {stops.map((s, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={!!feedback || running}
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
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}
