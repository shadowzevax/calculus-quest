import { useState } from 'react'
import { Dices, ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react'
import { getExerciseItems } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, TextAnswer, Prompt, MathText } from './GameBits'

const WEDGE_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A', '#9B5DE5', '#2A9D8F', '#E76F51', '#264653']

function normalizeText(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, '')
}

// Misión 10 — Rueda del azar: cada gajo es uno de los ejercicios de la misión ("Ejercicio N"),
// no una opción de respuesta — así la ruleta siempre muestra lo mismo (los ejercicios que
// faltan) y tiene un objetivo claro: girar hasta VACIARLA. Al girar cae en un ejercicio al
// azar y hay que resolverlo de verdad debajo; si se acierta, ese gajo desaparece para
// siempre; si se falla, se queda en la ruleta para volver a intentarlo más tarde.
export default function WheelSpinGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-gold">
          <Dices className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Gira y conecta cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return <WheelBoard items={items} onComplete={onComplete} onFeedback={onFeedback} />
}

function WheelBoard({ items, onComplete, onFeedback }) {
  const total = items.list.length
  const [pool, setPool] = useState(() => items.list.map((_, i) => i))
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landedIdx, setLandedIdx] = useState(null)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const wedgeAngle = 360 / Math.max(pool.length, 1)
  const current = landedIdx !== null ? items.list[landedIdx] : null
  const isTrueFalse = items.kind === 'choice' && current?.options.length === 2 && current.options[0] === 'Verdadero' && current.options[1] === 'Falso'

  const spin = () => {
    if (spinning || landedIdx !== null || pool.length === 0) return
    // Con un solo ejercicio restante no hace falta el suspenso del giro largo: un pequeño
    // efecto y directo a responderlo.
    const quick = pool.length === 1
    setSpinning(true)
    const landingSlot = Math.floor(Math.random() * pool.length)
    const fullSpins = quick ? 1 : 5 + Math.floor(Math.random() * 3)
    const targetWithinWheel = 360 - (landingSlot * wedgeAngle + wedgeAngle / 2)
    setRotation((r) => r - (r % 360) + fullSpins * 360 + targetWithinWheel)
    setTimeout(() => { setSpinning(false); setLandedIdx(pool[landingSlot]) }, quick ? 500 : 3200)
  }

  const checkChoice = (optionIndex) => {
    if (feedback) return
    setSelected(optionIndex)
    const isCorrect = optionIndex === current.correctIndex
    setFeedback({ isCorrect, explanation: current.explanation })
    onFeedback?.(true)
  }

  const checkText = (value) => {
    if (feedback || !value.trim()) return
    const accepted = current.accepted || [current.answer]
    let isCorrect = accepted.some((a) => normalizeText(a) === normalizeText(value))
    if (!isCorrect && current.tolerance !== undefined) {
      const num = parseFloat(String(value).replace(',', '.'))
      const target = parseFloat(current.answer)
      if (!isNaN(num) && !isNaN(target) && Math.abs(num - target) <= current.tolerance) isCorrect = true
    }
    setFeedback({ isCorrect, explanation: current.explanation })
    onFeedback?.(true)
  }

  const nextItem = () => {
    onFeedback?.(false)
    const solvedIdx = landedIdx
    const wasCorrect = feedback?.isCorrect
    const newPool = wasCorrect ? pool.filter((i) => i !== solvedIdx) : pool
    setPool(newPool)
    setSelected(null)
    setFeedback(null)
    setLandedIdx(null)
    setRotation(0)
    if (newPool.length === 0) onComplete({ isCorrect: true })
  }

  return (
    <div>
      <GameHeader index={total - pool.length} total={total} label="EJERCICIOS RESUELTOS" />

      <div className="relative w-64 h-64 mx-auto mb-5">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[18px] border-t-ink drop-shadow" />
        <svg
          viewBox="0 0 260 260"
          className="w-full h-full"
          style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${pool.length === 1 ? 0.5 : 3.1}s cubic-bezier(0.15,0.85,0.2,1)` : 'none' }}
        >
          <circle cx="130" cy="130" r="128" fill="white" stroke="#1B3A5C" strokeOpacity="0.15" strokeWidth="2" />
          {pool.length === 1 ? (
            // Un solo gajo = la rueda completa. Un arco de 360° con el mismo punto de
            // inicio y fin no se dibuja en SVG, así que en ese caso se pinta un círculo entero.
            <g>
              <circle cx="130" cy="130" r="122" fill={WEDGE_COLORS[0]} stroke="white" strokeWidth="1.5" />
              <text x="130" y="134" fill="white" fontSize="13" fontFamily="'IBM Plex Mono', monospace" fontWeight="700" textAnchor="middle">
                Ej. {pool[0] + 1}
              </text>
            </g>
          ) : (
            pool.map((itemIdx, slot) => {
              const start = slot * wedgeAngle
              const end = start + wedgeAngle
              const toRad = (deg) => ((deg - 90) * Math.PI) / 180
              const R = 122
              const x1 = 130 + R * Math.cos(toRad(start))
              const y1 = 130 + R * Math.sin(toRad(start))
              const x2 = 130 + R * Math.cos(toRad(end))
              const y2 = 130 + R * Math.sin(toRad(end))
              const largeArc = wedgeAngle > 180 ? 1 : 0
              const mid = start + wedgeAngle / 2
              const lx = 130 + 76 * Math.cos(toRad(mid))
              const ly = 130 + 76 * Math.sin(toRad(mid))
              return (
                <g key={itemIdx}>
                  <path d={`M130,130 L${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} Z`} fill={WEDGE_COLORS[slot % WEDGE_COLORS.length]} stroke="white" strokeWidth="1.5" />
                  <text
                    x={lx} y={ly}
                    fill="white" fontSize="11" fontFamily="'IBM Plex Mono', monospace" fontWeight="700" textAnchor="middle"
                    transform={`rotate(${mid + (mid > 90 && mid < 270 ? 180 : 0)}, ${lx}, ${ly})`}
                  >
                    Ej. {itemIdx + 1}
                  </text>
                </g>
              )
            })
          )}
          <circle cx="130" cy="130" r="16" fill="white" stroke="#1B3A5C" strokeWidth="2" />
        </svg>
      </div>

      {landedIdx === null ? (
        <div className="text-center">
          <button
            onClick={spin}
            disabled={spinning || pool.length === 0}
            className={`bg-gold hover:bg-coral transition-colors text-white rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50 ${
              !spinning && pool.length === 1 ? 'animate-pulse' : ''
            }`}
          >
            {spinning ? 'Girando...' : pool.length === 1 ? '¡Último ejercicio! Toca para jugarlo' : 'Girar la ruleta'}
          </button>
          <p className="text-[11px] text-ink/30 font-mono-lab mt-3">
            {pool.length} de {total} ejercicio{total === 1 ? '' : 's'} por resolver en la ruleta
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-mono-lab text-coral uppercase tracking-wide mb-2">Ejercicio {landedIdx + 1}</p>
          <Prompt text={current.prompt} />

          {items.kind === 'choice' ? (
            isTrueFalse ? (
              <div className="grid grid-cols-2 gap-3">
                {current.options.map((opt, i) => {
                  const isRight = feedback && i === current.correctIndex
                  const isWrongPick = feedback && selected === i && i !== current.correctIndex
                  const isTrue = opt === 'Verdadero'
                  return (
                    <button
                      key={i}
                      onClick={() => checkChoice(i)}
                      disabled={!!feedback}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-5 text-sm font-mono-lab font-semibold transition-all ${
                        selected === i ? 'scale-95' : 'hover:-translate-y-0.5'
                      } ${isRight ? 'border-teal bg-teal/10 text-teal' : isWrongPick ? 'border-red-400 bg-red-50 text-red-500' : isTrue ? 'border-teal/30 text-teal/80' : 'border-coral/30 text-coral/80'}`}
                    >
                      {isTrue ? <ThumbsUp className="w-6 h-6" /> : <ThumbsDown className="w-6 h-6" />}
                      {opt}
                      {feedback && (isRight ? <CheckCircle2 className="w-4 h-4" /> : isWrongPick ? <XCircle className="w-4 h-4" /> : null)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {current.options.map((opt, i) => {
                  const isRight = feedback && i === current.correctIndex
                  const isWrongPick = feedback && selected === i && i !== current.correctIndex
                  return (
                    <button
                      key={i}
                      onClick={() => checkChoice(i)}
                      disabled={!!feedback}
                      className={`w-full text-left border-2 rounded-lg px-4 py-2.5 text-sm font-mono-lab transition-colors ${
                        selected === i ? 'border-gold bg-gold/10' : 'border-ink/10'
                      } ${isRight ? '!border-teal !bg-teal/10' : ''} ${isWrongPick ? 'opacity-40' : ''}`}
                    >
                      <MathText text={opt} />
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            <div className="border-4 border-gold/25 rounded-2xl p-4 bg-gold/5">
              <TextAnswer feedback={feedback} onCheck={checkText} />
            </div>
          )}

          <FeedbackBanner feedback={feedback} />
          {feedback && (
            <button onClick={nextItem} className="mt-4 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
              {!feedback.isCorrect ? 'Volver a la ruleta' : pool.length === 1 ? 'Finalizar' : 'Volver a la ruleta'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
