import { useState } from 'react'
import { LineChart, SlidersHorizontal } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Clasifica el texto de una opción en un tipo de gráfica reconocible, para dibujar un
// mini-gráfico representativo en vez de solo texto — así "elegir la respuesta" se vuelve
// "reconocer la forma de la gráfica correcta", que es justo la habilidad que mide esta misión.
function classify(label) {
  const l = String(label).toLowerCase()
  if (l.includes('evitable')) return 'hole'
  if (l.includes('salto')) return 'jump'
  if (l.includes('infinit') || l.includes('esencial') || l.includes('asint')) return 'asymptote'
  return 'continuous'
}

// Mini-gráficas SVG reutilizables (miniatura y grande) para cada tipo de discontinuidad.
function DiscontinuityGraph({ type, accent = '#1B3A5C' }) {
  return (
    <svg viewBox="0 0 120 72" className="w-full h-full">
      <line x1="6" y1="60" x2="114" y2="60" stroke={accent} strokeOpacity="0.2" strokeWidth="1" />
      <line x1="60" y1="6" x2="60" y2="66" stroke={accent} strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 2" />
      {type === 'continuous' && (
        <path d="M12,52 Q60,8 108,52" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      )}
      {type === 'hole' && (
        <>
          <path d="M12,52 Q45,18 57,32" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M63,32 Q75,18 108,52" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="30" r="4" fill="white" stroke={accent} strokeWidth="2.5" />
          <circle cx="60" cy="46" r="3.5" fill={accent} />
        </>
      )}
      {type === 'jump' && (
        <>
          <path d="M12,52 Q40,40 58,36" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M62,18 Q80,14 108,10" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="59" cy="36" r="4" fill="white" stroke={accent} strokeWidth="2.5" />
          <circle cx="62" cy="18" r="3.5" fill={accent} />
        </>
      )}
      {type === 'asymptote' && (
        <>
          <path d="M12,58 Q45,52 57,10" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M63,62 Q75,20 108,14" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

// Misión 11 — Simulador gráfico: cada opción se reconoce por su FORMA (gráfica en miniatura),
// no por texto suelto. Al tocar una, se agranda como vista previa antes de calificarla — para
// el ejercicio de "completar espacio" (hallar k), un deslizante mueve de verdad la pieza de la
// función en vivo, así se puede EXPLORAR antes de escribir la respuesta.
export default function GraphSimulatorGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [preview, setPreview] = useState(null)
  const [k, setK] = useState(0)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <LineChart className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Ubica cada pareja en el plano</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const choose = (i) => {
    if (feedback) return
    setPreview(i)
    setTimeout(() => checkChoice(i), 450)
  }

  const nextItem = () => { next(); setPreview(null); setK(0) }
  const previewIdx = feedback ? selected : preview
  const previewType = items.kind === 'choice' && previewIdx !== null ? classify(current.options[previewIdx]) : null

  return (
    <div>
      <GameHeader index={index} total={total} label="ESCENA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div>
          <div className="bg-white border border-ink/10 rounded-xl p-4 mb-4 h-32 flex items-center justify-center">
            {previewType ? (
              <div className="w-40 h-24">
                <DiscontinuityGraph type={previewType} accent={feedback ? (feedback.isCorrect ? '#2A9D8F' : '#E76F51') : '#FF6B4A'} />
              </div>
            ) : (
              <p className="text-xs font-mono-lab text-ink/30">Toca una opción para ver su gráfica</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              const type = classify(opt)
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={!!feedback}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                    preview === i && !feedback ? 'scale-105 border-coral' : 'border-ink/10'
                  } ${isRight ? '!border-teal bg-teal/5' : ''} ${isWrongPick ? '!border-red-400 bg-red-50' : ''}`}
                >
                  <div className="w-full h-14">
                    <DiscontinuityGraph type={type} accent={isRight ? '#2A9D8F' : isWrongPick ? '#E76F51' : '#1B3A5C'} />
                  </div>
                  <span className={`text-[11px] font-mono-lab text-center leading-tight ${isRight ? 'text-teal font-semibold' : 'text-ink/60'}`}>{opt}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <ExploreAndAnswer current={current} feedback={feedback} k={k} setK={setK} onCheck={checkText} />
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}

// Para el ejercicio de "hallar k": un deslizante mueve de verdad el segundo tramo de la
// función en vivo, para poder explorar visualmente hasta dónde debe llegar antes de escribir
// la respuesta — no es solo decoración, cambia la gráfica en tiempo real.
function ExploreAndAnswer({ current, feedback, k, setK, onCheck }) {
  const targetY = 52 - k * 4.4 // desplazamiento visual del tramo derecho segun k (rango util -8..8)
  return (
    <div className="border border-blueprint/20 rounded-xl p-4 bg-blueprint/5">
      <div className="bg-white border border-ink/10 rounded-lg p-3 mb-3">
        <svg viewBox="0 0 120 72" className="w-full h-24">
          <line x1="60" y1="6" x2="60" y2="66" stroke="#1B3A5C" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="6" y1="60" x2="114" y2="60" stroke="#1B3A5C" strokeOpacity="0.2" strokeWidth="1" />
          <path d="M12,58 Q40,20 58,14" fill="none" stroke="#457B9D" strokeWidth="3" strokeLinecap="round" />
          <circle cx="58" cy="14" r="3.5" fill="#457B9D" />
          <line x1="62" y1={targetY} x2="108" y2={targetY} stroke="#FF6B4A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="62" cy={targetY} r="4" fill="white" stroke="#FF6B4A" strokeWidth="2.5" />
        </svg>
        <div className="flex items-center gap-2 mt-1">
          <SlidersHorizontal className="w-4 h-4 text-blueprint/50 shrink-0" />
          <input
            type="range"
            min="-8"
            max="8"
            step="0.5"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full accent-coral"
          />
        </div>
        <p className="text-[11px] font-mono-lab text-ink/40 text-center mt-1">
          Mueve el tramo naranja hasta que encaje con la curva azul, luego escribe ese valor de k
        </p>
      </div>
      <TextAnswer feedback={feedback} onCheck={onCheck} />
    </div>
  )
}
