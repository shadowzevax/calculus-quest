import { useState } from 'react'
import { Dices, ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt, MathText } from './GameBits'

const WEDGE_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A', '#9B5DE5', '#2A9D8F', '#E76F51', '#264653']
const MIN_WEDGES = 6

// Envuelve texto en hasta 2 lineas cortas para que quepa dentro de un gajo de la ruleta.
function wrapLines(text, maxChars = 10, maxLines = 2) {
  const words = String(text).split(/\s+/)
  const lines = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) {
      lines.push(cur.trim())
      cur = w
    } else {
      cur = (cur + ' ' + w).trim()
    }
    if (lines.length === maxLines - 1) break
  }
  if (cur) lines.push(cur.trim())
  const consumed = lines.join(' ').length
  if (consumed < String(text).length && lines.length === maxLines) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + '…'
  }
  return lines.slice(0, maxLines)
}

// Misión 10 — Rueda del azar: una ruleta real (con flecha fija arriba) gira de verdad y cae
// al azar en un gajo — es solo el "sorteo del turno", como en la plantilla de Wordwall. Una
// vez cae, debajo aparece la pregunta de verdad para responderla (verdadero/falso u opción
// múltiple, según el tipo de ejercicio).
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

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landed, setLanded] = useState(false)

  const isTrueFalse = items.kind === 'choice' && current.options.length === 2 && current.options[0] === 'Verdadero' && current.options[1] === 'Falso'
  const nReal = items.kind === 'choice' ? current.options.length : 0
  const nDecoy = Math.max(MIN_WEDGES - nReal, 0)
  const nWedges = Math.max(nReal + nDecoy, 1)
  const wedgeAngle = 360 / nWedges

  const spin = () => {
    if (spinning || landed) return
    setSpinning(true)
    // Aterriza en un gajo al azar: 5-7 vueltas completas + un desfase aleatorio dentro de la
    // rueda, restado porque la flecha esta fija arriba y es la rueda la que gira debajo.
    const landingSlot = Math.floor(Math.random() * nWedges)
    const fullSpins = 5 + Math.floor(Math.random() * 3)
    const targetWithinWheel = 360 - (landingSlot * wedgeAngle + wedgeAngle / 2)
    setRotation((r) => r - (r % 360) + fullSpins * 360 + targetWithinWheel)
    setTimeout(() => { setSpinning(false); setLanded(true) }, 3200)
  }

  const nextItem = () => {
    next()
    setLanded(false)
    setRotation(0)
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="TURNO" />

      <div className="relative w-64 h-64 mx-auto mb-5">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[18px] border-t-ink drop-shadow" />
        <svg
          viewBox="0 0 260 260"
          className="w-full h-full"
          style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 3.1s cubic-bezier(0.15,0.85,0.2,1)' : 'none' }}
        >
          <circle cx="130" cy="130" r="128" fill="white" stroke="#1B3A5C" strokeOpacity="0.15" strokeWidth="2" />
          {Array.from({ length: nWedges }).map((_, slot) => {
            const isReal = slot < nReal
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
            const fill = isReal ? WEDGE_COLORS[slot % WEDGE_COLORS.length] : '#CBD5D9'
            const lines = isReal ? wrapLines(current.options[slot]) : ['Suerte']
            return (
              <g key={slot}>
                <path d={`M130,130 L${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} Z`} fill={fill} stroke="white" strokeWidth="1.5" />
                <text
                  x={lx} y={ly}
                  fill="white" fontSize="8.5" fontFamily="'IBM Plex Mono', monospace" fontWeight="600" textAnchor="middle"
                  transform={`rotate(${mid + (mid > 90 && mid < 270 ? 180 : 0)}, ${lx}, ${ly})`}
                >
                  {lines.map((ln, li) => (
                    <tspan key={li} x={lx} dy={li === 0 ? -(lines.length - 1) * 5 : 10}>{ln}</tspan>
                  ))}
                </text>
              </g>
            )
          })}
          <circle cx="130" cy="130" r="16" fill="white" stroke="#1B3A5C" strokeWidth="2" />
        </svg>
      </div>

      {!landed ? (
        <div className="text-center">
          <button
            onClick={spin}
            disabled={spinning}
            className="bg-gold hover:bg-coral transition-colors text-white rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {spinning ? 'Girando...' : 'Girar la ruleta'}
          </button>
        </div>
      ) : (
        <div>
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
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}
