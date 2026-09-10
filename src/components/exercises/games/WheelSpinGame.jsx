import { useState, useRef } from 'react'
import { Dices, ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react'
import { getExerciseItems } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, TextAnswer, Prompt, MathText } from './GameBits'

const WEDGE_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A', '#9B5DE5', '#2A9D8F', '#E76F51', '#264653']

function normalizeText(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, '')
}

// Etiqueta corta del gajo: un adelanto de la pregunta real, para saber que actividad hay ahi
// sin tener que girar a ciegas (en vez del generico "Ejercicio N").
function shortLabel(text, n = 26) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// Aplana TODOS los ejercicios de la mision en un solo mazo de "fichas" para la ruleta —
// cada pregunta/afirmacion de cada ejercicio es su propio gajo, sin importar de que
// ejercicio real venga (opcion multiple, completar espacio, verdadero/falso, emparejar).
function buildPool(exercises) {
  const entries = []
  exercises.forEach((ex) => {
    const items = getExerciseItems(ex)
    if (items.kind === 'empty') return
    if (items.kind === 'matching') {
      entries.push({ id: `${ex.id}-m`, sourceExercise: ex, kind: 'matching', label: 'Emparejar parejas' })
      return
    }
    items.list.forEach((it, i) => {
      entries.push({
        id: `${ex.id}-${i}`,
        itemIndex: i,
        sourceExercise: ex,
        kind: items.kind,
        prompt: it.prompt,
        options: it.options,
        correctIndex: it.correctIndex,
        explanation: it.explanation,
        accepted: it.accepted,
        answer: it.answer,
        tolerance: it.tolerance,
        label: shortLabel(it.prompt),
      })
    })
  })
  return entries
}

// Misión 10 — Rueda del azar: UNA sola ruleta para toda la misión. Cada gajo es una pregunta
// real de cualquiera de los ejercicios de la misión, con un adelanto de su enunciado como
// título — la rueda gira de verdad y cae al azar (flecha fija arriba). Al acertar la pregunta
// que cayó, su gajo desaparece para siempre (y si esa era la última de su ejercicio, se marca
// ese ejercicio como completado); si se falla, el gajo se queda para reintentarlo. La misión
// termina cuando la ruleta queda completamente vacía.
export default function WheelSpinGame({ exercises, onExerciseComplete, onFeedback }) {
  const [pool, setPool] = useState(() => buildPool(exercises))
  const [total] = useState(() => pool.length)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [landedId, setLandedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  // Respuestas dadas por ejercicio de origen (id real de exercises) — el servidor las usa para
  // recalcular is_correct por su cuenta en vez de confiar en lo que mande el cliente.
  const answersByExercise = useRef({})

  const wedgeAngle = 360 / Math.max(pool.length, 1)
  const current = pool.find((e) => e.id === landedId) || null
  const isTrueFalse = current?.kind === 'choice' && current.options.length === 2 && current.options[0] === 'Verdadero' && current.options[1] === 'Falso'

  const spin = () => {
    if (spinning || landedId !== null || pool.length === 0) return
    const quick = pool.length === 1
    setSpinning(true)
    const landingSlot = Math.floor(Math.random() * pool.length)
    const fullSpins = quick ? 1 : 5 + Math.floor(Math.random() * 3)
    const targetWithinWheel = 360 - (landingSlot * wedgeAngle + wedgeAngle / 2)
    setRotation((r) => r - (r % 360) + fullSpins * 360 + targetWithinWheel)
    setTimeout(() => { setSpinning(false); setLandedId(pool[landingSlot].id) }, quick ? 500 : 3200)
  }

  // Al resolver bien una ficha, se quita del mazo para siempre; si esa era la última de su
  // ejercicio de origen, se avisa hacia arriba (XP, progreso) para ese ejercicio real.
  const removeSolved = () => {
    const nextPool = pool.filter((e) => e.id !== current.id)
    const exId = current.sourceExercise.id
    const exerciseStillPending = nextPool.some((e) => e.sourceExercise.id === exId)
    if (!exerciseStillPending) {
      onExerciseComplete?.(current.sourceExercise, answersByExercise.current[exId] || [])
      delete answersByExercise.current[exId]
    }
    setPool(nextPool)
  }

  const checkChoice = (optionIndex) => {
    if (feedback) return
    setSelected(optionIndex)
    const isCorrect = optionIndex === current.correctIndex
    const exId = current.sourceExercise.id
    answersByExercise.current[exId] = [...(answersByExercise.current[exId] || []), { index: current.itemIndex, value: optionIndex }]
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
    const exId = current.sourceExercise.id
    answersByExercise.current[exId] = [...(answersByExercise.current[exId] || []), { index: current.itemIndex, value }]
    setFeedback({ isCorrect, explanation: current.explanation })
    onFeedback?.(true)
  }

  const nextItem = () => {
    onFeedback?.(false)
    if (feedback?.isCorrect) removeSolved()
    setSelected(null)
    setFeedback(null)
    setLandedId(null)
    setRotation(0)
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
              <text x="130" y="126" fill="white" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fontWeight="700" textAnchor="middle">
                {pool[0].label}
              </text>
            </g>
          ) : (
            pool.map((entry, slot) => {
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
              const lines = entry.label.length > 13 ? [entry.label.slice(0, 12) + '…'] : [entry.label]
              return (
                <g key={entry.id}>
                  <path d={`M130,130 L${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} Z`} fill={WEDGE_COLORS[slot % WEDGE_COLORS.length]} stroke="white" strokeWidth="1.5" />
                  <text
                    x={lx} y={ly}
                    fill="white" fontSize="7.5" fontFamily="'IBM Plex Mono', monospace" fontWeight="600" textAnchor="middle"
                    transform={`rotate(${mid + (mid > 90 && mid < 270 ? 180 : 0)}, ${lx}, ${ly})`}
                  >
                    {lines.map((ln, li) => (
                      <tspan key={li} x={lx} dy={li === 0 ? 0 : 10}>{ln}</tspan>
                    ))}
                  </text>
                </g>
              )
            })
          )}
          <circle cx="130" cy="130" r="16" fill="white" stroke="#1B3A5C" strokeWidth="2" />
        </svg>
      </div>

      {landedId === null ? (
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
      ) : current.kind === 'matching' ? (
        <div>
          <div className="flex items-center gap-2 mb-4 text-gold">
            <Dices className="w-5 h-5" />
            <span className="text-xs font-mono-lab uppercase tracking-wide">Encuentra cada pareja</span>
          </div>
          <MatchingExercise exercise={current.sourceExercise} onComplete={() => { removeSolved(); setLandedId(null); setRotation(0) }} />
        </div>
      ) : (
        <div>
          <p className="text-xs font-mono-lab text-coral uppercase tracking-wide mb-2">{current.sourceExercise.type === 'fill_blank' ? 'Completa el espacio' : 'Responde'}</p>
          <Prompt text={current.prompt} />

          {current.kind === 'choice' ? (
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
