import { useState } from 'react'
import { Disc3 } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt, MathText } from './GameBits'

const WEDGE_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A', '#9B5DE5', '#2A9D8F', '#E76F51', '#264653']

function short(text, n = 34) {
  const s = String(text || '')
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// Misión 10 — Rueda del azar: la ruleta se ve completa desde el inicio, con una pregunta por
// gajo. Al girar cae en una pregunta al azar, la ruleta desaparece y se responde esa pregunta
// con sus propias opciones; si se acierta esa pregunta se quita de la ruleta para siempre y la
// ruleta reaparece con las que faltan, hasta vaciarla.
export default function WheelSpinGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

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

  if (items.kind === 'text') {
    return <TextWheelFallback items={items} onComplete={onComplete} onFeedback={onFeedback} />
  }

  return <ChoiceWheel items={items} onComplete={onComplete} onFeedback={onFeedback} />
}

// El ejercicio es de tipo texto: no hay gajos que remover por pregunta, se juega secuencial
// pero conservando el mismo giro-de-ruleta como transición entre preguntas.
function TextWheelFallback({ items, onComplete, onFeedback }) {
  const { index, total, current, feedback, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [spun, setSpun] = useState(false)
  const [spinning, setSpinning] = useState(false)

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
      <div className="border-4 border-gold/25 rounded-2xl p-4 bg-gold/5">
        <TextAnswer feedback={feedback} onCheck={checkText} />
      </div>
      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setSpun(false) }} />
    </div>
  )
}

function ChoiceWheel({ items, onComplete, onFeedback }) {
  const total = items.list.length
  const [pool, setPool] = useState(() => items.list.map((_, i) => i))
  const [solvedCount, setSolvedCount] = useState(0)
  const [phase, setPhase] = useState('wheel') // wheel | spinning | question
  const [rotation, setRotation] = useState(0)
  const [landed, setLanded] = useState(null)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const wedgeAngle = 360 / Math.max(pool.length, 1)

  const spin = () => {
    if (phase !== 'wheel' || pool.length === 0) return
    setPhase('spinning')
    const landedSlot = Math.floor(Math.random() * pool.length)
    const targetAngle = 360 * 5 + (360 - (landedSlot * wedgeAngle + wedgeAngle / 2))
    setRotation((r) => r + targetAngle)
    setTimeout(() => {
      setLanded(pool[landedSlot])
      setPhase('question')
    }, 1400)
  }

  const current = landed !== null ? items.list[landed] : null

  const answer = (optIndex) => {
    if (feedback || current === null) return
    setSelected(optIndex)
    const isCorrect = optIndex === current.correctIndex
    setFeedback({ isCorrect, explanation: current.explanation })
    onFeedback?.(true)
  }

  const goNext = () => {
    onFeedback?.(false)
    const wasCorrect = feedback?.isCorrect
    const newSolved = wasCorrect ? solvedCount + 1 : solvedCount
    const newPool = wasCorrect ? pool.filter((i) => i !== landed) : pool
    setSolvedCount(newSolved)
    setPool(newPool)
    setSelected(null)
    setFeedback(null)
    setLanded(null)
    if (newPool.length === 0) {
      onComplete({ isCorrect: newSolved / total >= items.threshold })
    } else {
      setPhase('wheel')
    }
  }

  if (phase === 'question' && current) {
    return (
      <div>
        <GameHeader index={total - pool.length} total={total} label="PREGUNTA" />
        <Prompt text={current.prompt} />
        <div className="grid grid-cols-1 gap-2">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={!!feedback}
                className={`text-left border-2 rounded-lg px-4 py-2.5 text-sm font-mono-lab transition-colors ${
                  selected === i ? 'border-gold bg-gold/10' : 'border-ink/10'
                } ${isRight ? '!border-teal !bg-teal/10' : ''} ${isWrongPick ? 'opacity-40' : ''}`}
              >
                <MathText text={opt} />
              </button>
            )
          })}
        </div>
        <FeedbackBanner feedback={feedback} />
        {feedback && (
          <button onClick={goNext} className="mt-4 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
            {pool.length - (feedback.isCorrect ? 1 : 0) === 0 ? 'Finalizar' : 'Volver a la ruleta'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="text-center py-2">
      <GameHeader index={total - pool.length} total={total} label="PREGUNTAS RESTANTES" />
      <div className="relative w-64 h-64 mx-auto mb-5">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-ink" />
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ transform: `rotate(${rotation}deg)`, transition: phase === 'spinning' ? 'transform 1.4s cubic-bezier(0.15,0.9,0.25,1)' : 'none' }}
        >
          {pool.map((itemIdx, slot) => {
            const start = slot * wedgeAngle
            const end = start + wedgeAngle
            const toRad = (deg) => ((deg - 90) * Math.PI) / 180
            const x1 = 100 + 100 * Math.cos(toRad(start))
            const y1 = 100 + 100 * Math.sin(toRad(start))
            const x2 = 100 + 100 * Math.cos(toRad(end))
            const y2 = 100 + 100 * Math.sin(toRad(end))
            const largeArc = wedgeAngle > 180 ? 1 : 0
            const midAngle = toRad(start + wedgeAngle / 2)
            const lx = 100 + 62 * Math.cos(midAngle)
            const ly = 100 + 62 * Math.sin(midAngle)
            return (
              <g key={itemIdx}>
                <path d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc} 1 ${x2},${y2} Z`} fill={WEDGE_COLORS[slot % WEDGE_COLORS.length]} stroke="white" strokeWidth="1" />
                <text
                  x={lx} y={ly}
                  fill="white" fontSize="7" fontFamily="monospace" textAnchor="middle"
                  transform={`rotate(${(start + wedgeAngle / 2)}, ${lx}, ${ly})`}
                >
                  {short(items.list[itemIdx].prompt, 22)}
                </text>
              </g>
            )
          })}
          <circle cx="100" cy="100" r="14" fill="white" stroke="#1B3A5C" strokeWidth="2" />
        </svg>
      </div>
      <button
        onClick={spin}
        disabled={phase === 'spinning' || pool.length === 0}
        className="bg-gold hover:bg-coral transition-colors text-white rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {phase === 'spinning' ? 'Girando...' : 'Girar'}
      </button>
    </div>
  )
}
