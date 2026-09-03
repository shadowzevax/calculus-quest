import { useRef, useState } from 'react'
import { Rabbit } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const MALLET_ANGLE = { idle: -55, windup: -115, strike: 15 }
const MALLET_SCALE = { idle: 1, windup: 1.08, strike: 1.3 }

// Misión 6 — Golpea el topo: las opciones son agujeros de tierra con un topo asomado; hay
// que "golpearlo" (tocarlo) si es la respuesta correcta. El mazo sigue al mouse con un buen
// retroceso antes del golpe, y el golpe deja chispas sobre el agujero elegido.
export default function WhackMoleGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [malletPos, setMalletPos] = useState({ x: 0, y: 0 })
  const [phase, setPhase] = useState('idle')
  const areaRef = useRef(null)

  const trackMallet = (e) => {
    const rect = areaRef.current.getBoundingClientRect()
    setMalletPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }
  const swing = () => {
    setPhase('windup')
    setTimeout(() => setPhase('strike'), 140)
    setTimeout(() => setPhase('idle'), 340)
  }

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-[#6B4226]">
          <Rabbit className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Empareja cada topo con su agujero</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="RONDA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div
          ref={areaRef}
          onMouseMove={trackMallet}
          onMouseEnter={trackMallet}
          className="relative grid grid-cols-2 gap-4 [&_*]:cursor-none cursor-none"
        >
          {/* mazo: siempre en su propia capa, sigue el mouse sin depender del elemento bajo el cursor */}
          <div
            className="pointer-events-none absolute z-30 select-none"
            style={{
              left: malletPos.x,
              top: malletPos.y,
              transform: `translate(-25%, -75%) rotate(${MALLET_ANGLE[phase]}deg) scale(${MALLET_SCALE[phase]})`,
              transition: phase === 'idle' ? 'transform 160ms ease-out' : 'transform 130ms cubic-bezier(.3,0,.6,1)',
              fontSize: '2.75rem',
              filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.25))',
            }}
          >
            🔨
          </div>

          {current.options.map((opt, i) => {
            const hit = feedback && selected === i
            const isRight = feedback && i === current.correctIndex
            const missed = hit && !isRight
            const showSpark = phase === 'strike' && selected === i
            return (
              <button
                key={i}
                onClick={() => { swing(); checkChoice(i) }}
                disabled={!!feedback}
                className="relative flex flex-col items-center transition-transform"
              >
                {/* aguero de tierra */}
                <div
                  className="relative w-24 h-24 max-w-full mx-auto rounded-full flex items-end justify-center overflow-hidden border-4"
                  style={{
                    background: 'radial-gradient(circle at center, #5b3a29 0%, #7a5236 55%, #a9764f 100%)',
                    borderColor: isRight ? '#2A9D8F' : '#4a2f20',
                  }}
                >
                  <Rabbit
                    className={`w-9 h-9 mb-2 transition-transform ${missed ? 'translate-y-6 opacity-0' : hit ? '-translate-y-1' : ''}`}
                    style={{ color: isRight ? '#2A9D8F' : '#D9B48F' }}
                  />
                  {showSpark && (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl animate-ping [animation-iteration-count:1] [animation-duration:280ms]">
                      💥
                    </span>
                  )}
                </div>
                <span className={`mt-1.5 text-xs font-mono-lab text-center leading-tight ${isRight ? 'text-teal font-semibold' : 'text-ink/70'}`}>
                  {opt}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-2 rounded-2xl p-4" style={{ borderColor: '#7a5236', backgroundColor: '#7a523612' }}>
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
