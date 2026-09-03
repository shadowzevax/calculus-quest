import { useState } from 'react'
import { Disc3, Dices } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const WEDGE_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A', '#9B5DE5', '#2A9D8F', '#E76F51', '#264653']
const MIN_WEDGES = 6

// Envuelve texto en hasta 3 lineas cortas para que quepa dentro de un gajo de la ruleta.
function wrapLines(text, maxChars = 11, maxLines = 3) {
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

// Misión 10 — Rueda del azar: la ruleta se ve completa desde el inicio con al menos 6 gajos
// (si la pregunta tiene menos opciones se rellena con gajos decorativos "vuelve a girar" para
// que la ruleta siempre luzca completa); cada gajo real es clicable y responde la pregunta.
export default function WheelSpinGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [spun, setSpun] = useState(false)
  const [spinning, setSpinning] = useState(false)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-gold">
          <Disc3 className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Gira y conecta cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const nReal = items.kind === 'choice' ? current.options.length : 0
  const nDecoy = Math.max(MIN_WEDGES - nReal, 0)
  const nWedges = nReal + nDecoy
  const wedgeAngle = 360 / Math.max(nWedges, 1)

  const spin = () => { setSpinning(true); setTimeout(() => { setSpinning(false); setSpun(true) }, 700) }

  if (!spun) {
    return (
      <div className="text-center py-6">
        <GameHeader index={index} total={total} label="TURNO" />
        <Disc3 className={`w-20 h-20 mx-auto text-gold transition-transform ${spinning ? 'duration-700 rotate-[900deg]' : 'duration-300'}`} />
        <button onClick={spin} disabled={spinning} className="mt-6 bg-gold hover:bg-coral transition-colors text-white rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50">
          {spinning ? 'Girando...' : 'Girar la ruleta'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="TURNO" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="flex justify-center mb-4">
          <svg viewBox="0 0 260 260" className="w-72 h-72 max-w-full">
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
              const lx = 130 + 74 * Math.cos(toRad(mid))
              const ly = 130 + 74 * Math.sin(toRad(mid))
              const isRight = feedback && isReal && slot === current.correctIndex
              const isWrongPick = feedback && isReal && selected === slot && slot !== current.correctIndex
              const fill = isReal ? (isRight ? '#2A9D8F' : WEDGE_COLORS[slot % WEDGE_COLORS.length]) : '#CBD5D9'
              const lines = isReal ? wrapLines(current.options[slot]) : ['Vuelve', 'a girar']
              return (
                <g
                  key={slot}
                  onClick={() => isReal && !feedback && checkChoice(slot)}
                  style={{ cursor: isReal && !feedback ? 'pointer' : 'default', opacity: feedback && !isRight && !isWrongPick ? 0.45 : 1 }}
                >
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
      ) : (
        <div className="border-4 border-gold/25 rounded-2xl p-4 bg-gold/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      {items.kind === 'choice' && !feedback && (
        <p className="text-[11px] text-ink/30 font-mono-lab text-center -mt-1 mb-2 flex items-center justify-center gap-1">
          <Dices className="w-3 h-3" /> Toca el gajo con la respuesta correcta
        </p>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setSpun(false) }} />
    </div>
  )
}
