import { useRef, useState } from 'react'
import { PartyPopper } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const BALLOON_COLORS = ['#FF6B4A', '#457B9D', '#F4A261', '#9B5DE5']
const OFFSETS = ['mt-0', 'mt-6', 'mt-2', 'mt-8']

// Misión 9 — Globos: hay que "pinchar" 3 globos hasta dejar solo el que tiene la respuesta
// correcta. El cursor se convierte en una aguja; cada clic revienta un globo (si es
// incorrecto desaparece, si es el correcto queda flotando solo).
export default function BalloonPopGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [popped, setPopped] = useState([])
  const [needle, setNeedle] = useState({ x: 0, y: 0 })
  const areaRef = useRef(null)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <PartyPopper className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Une cada globo con su pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const trackNeedle = (e) => {
    const rect = areaRef.current.getBoundingClientRect()
    setNeedle({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const pop = (i) => {
    if (feedback || popped.includes(i)) return
    if (i === current.correctIndex) {
      checkChoice(i)
      return
    }
    setPopped((p) => [...p, i])
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="GLOBO" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div
          ref={areaRef}
          onMouseMove={trackNeedle}
          onMouseEnter={trackNeedle}
          className="relative grid grid-cols-2 gap-x-4 gap-y-6 cursor-none py-4"
        >
          <div
            className="pointer-events-none absolute z-20 text-3xl select-none"
            style={{ left: needle.x, top: needle.y, transform: 'translate(-15%, -85%) rotate(35deg)' }}
          >
            📌
          </div>
          {current.options.map((opt, i) => {
            const isGone = popped.includes(i)
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => pop(i)}
                disabled={!!feedback || isGone}
                className={`relative flex flex-col items-center gap-1.5 transition-all duration-200 ${OFFSETS[i % OFFSETS.length]} ${
                  isGone ? 'opacity-0 scale-[0.3] pointer-events-none' : ''
                } ${isWrongPick ? 'opacity-0 scale-[0.3]' : ''}`}
              >
                <div
                  className={`w-24 h-28 max-w-full rounded-[48%_48%_48%_48%/58%_58%_42%_42%] flex items-center justify-center text-white text-xs leading-snug font-mono-lab px-3 py-3 text-center shadow-lg transition-transform ${
                    isRight ? 'ring-4 ring-teal/40 scale-110' : ''
                  }`}
                  style={{ backgroundColor: BALLOON_COLORS[i % BALLOON_COLORS.length] }}
                >
                  <span className="line-clamp-4">{opt}</span>
                </div>
                <div className="w-px h-5 bg-ink/25" />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-2 border-coral/25 rounded-[2rem] p-4 bg-coral/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      {!feedback && items.kind === 'choice' && (
        <p className="text-[11px] text-ink/30 font-mono-lab -mt-2 mb-2">Pincha los globos incorrectos hasta dejar solo el correcto.</p>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setPopped([]) }} />
    </div>
  )
}
