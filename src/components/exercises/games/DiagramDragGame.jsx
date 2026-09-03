import { useState } from 'react'
import { SlidersHorizontal, Tag } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 5 — Simulador gráfico: un control deslizante mueve la curva sobre el plano en vivo;
// cada posición del control corresponde a una de las opciones (transformación de la gráfica).
// El estudiante desliza hasta que la curva se vea como la transformación pedida y confirma.
export default function DiagramDragGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [sliderPos, setSliderPos] = useState(0)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Tag className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Ubica cada pareja en el plano</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const nOptions = items.kind === 'choice' ? current.options.length : 1
  const maxPos = Math.max(nOptions - 1, 1)
  // desplazamiento vertical de la curva segun la posicion del deslizador (0..1 normalizado a -30..30)
  const shift = (sliderPos / maxPos) * 60 - 30
  const snapped = Math.round(sliderPos)

  const confirm = () => checkChoice(snapped)

  return (
    <div>
      <GameHeader index={index} total={total} label="ESCENA" />

      <div className="relative bg-blueprint/5 border border-blueprint/15 rounded-xl p-4 mb-3 overflow-hidden">
        <svg width="100%" height="110" viewBox="0 0 200 110">
          <line x1="0" y1="55" x2="200" y2="55" stroke="#1B3A5C" strokeWidth="1" opacity="0.4" />
          <line x1="100" y1="0" x2="100" y2="110" stroke="#1B3A5C" strokeWidth="1" opacity="0.4" />
          <path d="M 20 90 Q 100 10 180 40" fill="none" stroke="#1B3A5C" strokeOpacity="0.25" strokeWidth="2" />
          <path
            d="M 20 90 Q 100 10 180 40"
            fill="none"
            stroke={feedback ? (feedback.isCorrect ? '#2A9D8F' : '#E76F51') : '#FF6B4A'}
            strokeWidth="2.5"
            style={{ transform: `translateY(${-shift}px)`, transition: 'transform 60ms linear' }}
          />
        </svg>
        <div className="flex items-center gap-2 mt-1">
          <SlidersHorizontal className="w-4 h-4 text-blueprint/50 shrink-0" />
          <input
            type="range"
            min="0"
            max={maxPos}
            step="0.02"
            value={sliderPos}
            disabled={!!feedback}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="w-full accent-coral"
          />
        </div>
        <p className="text-[11px] font-mono-lab text-ink/40 text-center mt-1">Desliza hasta que la curva coincida con la transformación pedida</p>
      </div>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              return (
                <span
                  key={i}
                  className={`text-xs font-mono-lab px-2.5 py-1 rounded-full border ${
                    snapped === i && !feedback ? 'border-coral bg-coral/10 text-coral' : 'border-ink/15 text-ink/50'
                  } ${isRight ? '!border-teal !bg-teal/10 !text-teal' : ''} ${isWrongPick ? 'opacity-30' : ''}`}
                >
                  {opt}
                </span>
              )
            })}
          </div>
          {!feedback && (
            <button onClick={confirm} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
              Confirmar posición
            </button>
          )}
        </div>
      ) : (
        <div className="border border-blueprint/20 rounded-xl p-4 bg-blueprint/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setSliderPos(0) }} />
    </div>
  )
}
