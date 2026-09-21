import { useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { PartyPopper, Target } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'
import agujaIcon from '@/assets/games/aguja.svg'

const BALLOON_COLORS = ['#FF6B4A', '#457B9D', '#F4A261', '#9B5DE5']
const OFFSETS = ['mt-0', 'mt-6', 'mt-2', 'mt-8']

// Estallido realista con canvas-confetti (en vez de "chispas" caseras en CSS) justo en el
// punto de la pantalla donde revienta el globo.
function popBurst(x, y, color) {
  confetti({
    particleCount: 22,
    startVelocity: 28,
    spread: 360,
    ticks: 45,
    gravity: 1.1,
    scalar: 0.7,
    colors: [color, '#FFFFFF'],
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
  })
}

// Misión 9 — Globos: hay que "pinchar" 3 globos hasta dejar solo el que tiene la respuesta
// correcta. El cursor se convierte en una aguja; cada clic revienta un globo (si es
// incorrecto desaparece, si es el correcto queda flotando solo).
export default function BalloonPopGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [popped, setPopped] = useState([])
  const [needle, setNeedle] = useState({ x: 0, y: 0 })
  const areaRef = useRef(null)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

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
    // Igual que WhackMoleGame: en táctil el evento no trae clientX/clientY directamente, sino
    // en e.touches[0]. Antes solo se manejaba onMouseMove/onMouseEnter, así que en celular
    // `needle` nunca se actualizaba y la aguja quedaba clavada en (0,0).
    const point = e.touches ? e.touches[0] : e
    const rect = areaRef.current.getBoundingClientRect()
    setNeedle({ x: point.clientX - rect.left, y: point.clientY - rect.top })
  }

  // Se pinchan globos sin importar si son la respuesta correcta o no; la respuesta que
  // realmente cuenta es la del ÚNICO globo que quede sin reventar al final.
  const pop = (i, e) => {
    if (feedback || popped.includes(i)) return
    const rect = e.currentTarget.getBoundingClientRect()
    popBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, BALLOON_COLORS[i % BALLOON_COLORS.length])
    const newPopped = [...popped, i]
    if (newPopped.length >= current.options.length - 1) {
      const remaining = current.options.findIndex((_, idx) => !newPopped.includes(idx))
      setPopped(newPopped)
      setTimeout(() => checkChoice(remaining), 350)
      return
    }
    setPopped(newPopped)
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="GLOBO" />
      <Prompt text={current.prompt} />

      {/* La mecánica de esta misión es al revés de las otras 12 (aquí NO se pincha la
          respuesta correcta, se pincha todo lo demás) — Sebastian reportó que la instrucción
          quedaba enterrada al final, en gris y diminuta, así que a primera vista parecía un
          ejercicio de opción múltiple normal. Ahora va arriba, antes de los globos, con color
          y peso suficiente para leerse antes de hacer el primer clic. */}
      {!feedback && items.kind === 'choice' && (
        <div className="flex items-start gap-2 mb-4 rounded-xl border-2 border-coral/30 bg-coral/5 px-4 py-3">
          <Target className="w-5 h-5 text-coral shrink-0 mt-0.5" />
          <p className="text-sm font-mono-lab font-semibold text-[#B91C1C]">
            {`Pincha ${current.options.length - 1} globo${current.options.length - 1 === 1 ? '' : 's'}: el que quede sin pinchar es tu respuesta.`}
          </p>
        </div>
      )}

      {items.kind === 'choice' ? (
        <div
          ref={areaRef}
          onMouseMove={trackNeedle}
          onMouseEnter={trackNeedle}
          onTouchStart={trackNeedle}
          onTouchMove={trackNeedle}
          className="relative grid grid-cols-2 gap-x-4 gap-y-6 cursor-none [&_*]:cursor-none py-4"
        >
          <img
            src={agujaIcon}
            alt=""
            className="pointer-events-none absolute z-20 select-none w-16 h-16"
            style={{
              left: needle.x,
              top: needle.y,
              transform: 'translate(-70%, -15%) rotate(-35deg)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
            }}
          />
          {current.options.map((opt, i) => {
            const isGone = popped.includes(i)
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={(e) => pop(i, e)}
                disabled={!!feedback || isGone}
                className={`relative flex flex-col items-center gap-1.5 transition-all duration-200 ${OFFSETS[i % OFFSETS.length]} ${
                  isGone ? 'opacity-0 scale-[0.3] pointer-events-none' : ''
                }`}
              >
                <div
                  className={`relative w-24 h-28 max-w-full rounded-[48%_48%_48%_48%/58%_58%_42%_42%] flex items-center justify-center text-white text-xs leading-snug font-mono-lab px-3 py-3 text-center shadow-lg transition-transform ${
                    isRight ? 'ring-4 ring-teal/40 scale-110' : ''
                  } ${isWrongPick ? 'ring-4 ring-red-400/50' : ''}`}
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
          <TextAnswer key={index} feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setPopped([]) }} />
    </div>
  )
}
