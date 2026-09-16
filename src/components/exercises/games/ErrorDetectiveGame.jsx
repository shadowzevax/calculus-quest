import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Search, Fingerprint, Lock } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, MathText } from './GameBits'
import './terminal-detective.css'

// Misión 8 — Detective de errores.
//
// Antes: era el juego más delgado de los 13. Ni un solo useState: opción múltiple con las
// fichas inclinadas, un ícono de huella y un `hover:-translate-y-1` que en celular no
// existe (o sea: en táctil no tenía ninguna animación).
//
// Ahora es una escena de investigación: el expediente (el enunciado) llega CUBIERTO y hay
// que barrerlo con una lupa que sigue al dedo/puntero y amplía el texto debajo. Cada zona
// barrida se despeja para siempre, y solo cuando el expediente está examinado se pueden
// tocar las evidencias y acusar a una. El texto mostrado es siempre el enunciado real
// (la niebla es una capa encima, nunca altera el enunciado ni la matemática).
const COLS = 6
const ROWS = 4
const TILES = COLS * ROWS
const LENS_R = 54 // radio visual de la lupa, en px
const REVEAL_R = 58 // radio que despeja niebla
const TOUCH_LIFT = 46 // en táctil la lupa se dibuja sobre el dedo para no quedar tapada
const ZOOM = 1.45
const UNLOCK = 0.8 // fracción del expediente que hay que examinar
const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2']
const ALL_TILES = Array.from({ length: TILES }, (_, i) => i)

export default function ErrorDetectiveGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  const [cleared, setCleared] = useState(() => new Set())
  const [examined, setExamined] = useState(false)
  const [fogGone, setFogGone] = useState(false) // la capa se desmonta al terminar de disolverse
  const [lens, setLens] = useState({ x: 0, y: 0, w: 0, active: false })
  const [shake, setShake] = useState(false)
  const areaRef = useRef(null)

  const kind = items.kind
  const prompt = current?.prompt
  const coverage = examined ? 1 : cleared.size / TILES

  // Expediente nuevo en cada ítem: vuelve a taparse por completo.
  useEffect(() => {
    setCleared(new Set())
    setExamined(false)
    setFogGone(false)
    setLens({ x: 0, y: 0, w: 0, active: false })
    setShake(false)
  }, [index])

  // Se espera a que termine la disolución antes de quitar la capa de niebla del DOM.
  useEffect(() => {
    if (!examined) return
    const t = setTimeout(() => setFogGone(true), 520)
    return () => clearTimeout(t)
  }, [examined])

  // Con el 80% barrido se da por examinado y el resto de la niebla se disuelve sola
  // (los bordes son incómodos de alcanzar y no aportan nada al juego).
  useEffect(() => {
    if (examined || cleared.size / TILES < UNLOCK) return
    setExamined(true)
    setCleared(new Set(ALL_TILES))
  }, [cleared, examined])

  // Sacudida del tablero cuando la acusación fue equivocada.
  useEffect(() => {
    if (!feedback || feedback.isCorrect) return
    setShake(true)
    const t = setTimeout(() => setShake(false), 340)
    return () => clearTimeout(t)
  }, [feedback])

  const reveal = useCallback((x, y, w, h) => {
    const cw = w / COLS
    const ch = h / ROWS
    setCleared((prev) => {
      let next = null
      for (let i = 0; i < TILES; i++) {
        if (prev.has(i)) continue
        const dx = ((i % COLS) + 0.5) * cw - x
        const dy = (Math.floor(i / COLS) + 0.5) * ch - y
        if (Math.hypot(dx, dy) <= REVEAL_R) {
          if (!next) next = new Set(prev)
          next.add(i)
        }
      }
      return next || prev
    })
  }, [])

  // Un solo manejador para mouse y dedo: `e.touches` distingue el caso táctil, igual que
  // en WhackMoleGame. El centro de la lupa es SIEMPRE el punto que despeja, así que lo que
  // se ve y lo que se revela coinciden en los dos casos.
  const track = useCallback(
    (e) => {
      if (examined) return
      const area = areaRef.current
      if (!area) return
      const rect = area.getBoundingClientRect()
      const touch = e.touches ? e.touches[0] : null
      const point = touch || e
      const x = point.clientX - rect.left
      const y = point.clientY - rect.top - (touch ? TOUCH_LIFT : 0)
      setLens({ x, y, w: rect.width, active: true })
      reveal(x, y, rect.width, rect.height)
    },
    [examined, reveal]
  )

  const revealAll = useCallback(() => {
    setCleared(new Set(ALL_TILES))
    setExamined(true)
    setLens((l) => ({ ...l, active: false }))
  }, [])

  const accuse = useCallback(
    (i, event) => {
      if (feedback || !examined) return
      if (i === current.correctIndex && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        const rect = event.currentTarget.getBoundingClientRect()
        confetti({
          particleCount: 26,
          startVelocity: 26,
          spread: 70,
          ticks: 60,
          scalar: 0.7,
          colors: ['#3FBFAD', '#F0A93C', '#FDF6E3'],
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
        })
      }
      checkChoice(i)
    },
    [feedback, examined, current, checkChoice]
  )

  const caseBody = useMemo(
    () => (
      <div className="px-4 py-5 sm:px-6">
        <p className="text-[10px] font-mono-lab uppercase tracking-[0.2em] text-ink/70 mb-2">Expediente · caso {index + 1}</p>
        <p className="font-display font-medium text-ink text-[15px] leading-relaxed">
          <MathText text={prompt || ''} />
        </p>
      </div>
    ),
    [prompt, index]
  )

  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Fingerprint className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Relaciona cada pista con su caso</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="CASO" />

      {/* ------- El expediente cubierto + la lupa ------- */}
      <div className={`relative rounded-xl border border-ink/15 bg-blueprint/[0.06] p-3 ${shake ? 'case-shake' : ''}`}>
        <div
          ref={areaRef}
          onMouseMove={track}
          onMouseEnter={track}
          onMouseLeave={() => setLens((l) => ({ ...l, active: false }))}
          onTouchStart={track}
          onTouchMove={track}
          onTouchEnd={() => setLens((l) => ({ ...l, active: false }))}
          style={{ touchAction: examined ? 'auto' : 'none' }}
          className={`relative overflow-hidden rounded-lg bg-[#fdf6e3] shadow-inner border border-ink/10 select-none ${
            !examined && lens.active ? 'cursor-none' : ''
          }`}
        >
          {caseBody}

          {/* Niebla: capa POR ENCIMA del enunciado (nunca lo modifica). Cada baldosa que
              barre la lupa se disuelve y no vuelve. */}
          {!fogGone ? (
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {ALL_TILES.map((i) => (
                <span
                  key={i}
                  className={`absolute bg-[#efe6d2]/80 backdrop-blur-[4px] ${cleared.has(i) ? 'fog-tile-clear' : ''}`}
                  style={{
                    left: `${((i % COLS) / COLS) * 100}%`,
                    top: `${(Math.floor(i / COLS) / ROWS) * 100}%`,
                    width: `calc(${100 / COLS}% + 1px)`,
                    height: `calc(${100 / ROWS}% + 1px)`,
                    boxShadow: 'inset 0 0 0 1px rgba(20,32,46,0.05)',
                  }}
                />
              ))}
            </div>
          ) : null}

          {/* La lupa: círculo de vidrio con el mismo texto ampliado debajo. */}
          {!examined && lens.active && (
            <div
              className="absolute pointer-events-none rounded-full overflow-hidden"
              style={{
                left: lens.x,
                top: lens.y,
                width: LENS_R * 2,
                height: LENS_R * 2,
                transform: 'translate(-50%, -50%)',
                border: '5px solid #8B5E34',
                boxShadow: '0 6px 14px rgba(20,32,46,0.35), inset 0 0 18px rgba(255,255,255,0.55)',
                background: '#fdf6e3',
              }}
              aria-hidden="true"
            >
              <div
                style={{
                  position: 'absolute',
                  width: lens.w || 320,
                  left: LENS_R - lens.x * ZOOM,
                  top: LENS_R - lens.y * ZOOM,
                  transform: `scale(${ZOOM})`,
                  transformOrigin: '0 0',
                }}
              >
                {caseBody}
              </div>
              <span
                className="lens-glint absolute rounded-full"
                style={{
                  left: '14%',
                  top: '12%',
                  width: '38%',
                  height: '26%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0))',
                  transform: 'rotate(-18deg)',
                }}
              />
            </div>
          )}
        </div>

        {/* Avance del examen + salida para quien no pueda barrer con puntero. */}
        <div className="flex items-center gap-3 mt-2.5">
          <Search className="w-4 h-4 text-blueprint shrink-0" />
          {examined ? (
            <span className="text-xs font-mono-lab text-blueprint">
              Expediente examinado — {kind === 'choice' ? 'señala la evidencia culpable' : 'redacta tu informe'}
            </span>
          ) : (
            <>
              <div className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden">
                <div className="exam-bar h-full bg-blueprint rounded-full" style={{ width: `${Math.round(coverage * 100)}%` }} />
              </div>
              <span className="text-xs font-mono-lab text-ink/70 tabular-nums shrink-0">{Math.round(coverage * 100)}%</span>
              <button
                onClick={revealAll}
                className="text-xs font-mono-lab text-blueprint underline underline-offset-2 hover:text-coral transition-colors shrink-0"
              >
                revelar
              </button>
            </>
          )}
        </div>
        {!examined && (
          <p className="text-xs text-ink/70 mt-1.5">
            Pasa la lupa (dedo o mouse) sobre el expediente para leerlo ampliado y descubrirlo.
          </p>
        )}
      </div>

      {/* ------- Las evidencias ------- */}
      {!examined ? (
        <div className="flex items-center justify-center gap-2 mt-5 py-6 rounded-xl border border-dashed border-ink/20 text-ink/70">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-mono-lab">
            {kind === 'choice' ? 'Evidencias bloqueadas' : 'Informe bloqueado'} hasta examinar el caso
          </span>
        </div>
      ) : kind === 'choice' ? (
        <div className="flex flex-wrap justify-center items-stretch gap-4 mt-5 py-2">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={(e) => accuse(i, e)}
                disabled={!!feedback}
                style={{ animationDelay: `${i * 70}ms` }}
                className={`evidence-in relative flex-1 basis-[8.5rem] min-w-[8.5rem] max-w-[13rem] flex flex-col items-center justify-center bg-[#fdf6e3] border shadow-md px-3 py-4 text-xs font-mono-lab text-center transition-transform hover:-translate-y-1 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-blueprint ${
                  TILTS[i % TILTS.length]
                } ${
                  isRight
                    ? 'border-teal ring-2 ring-teal'
                    : isWrongPick
                      ? 'border-coral ring-2 ring-coral'
                      : feedback
                        ? 'border-ink/15 opacity-70'
                        : 'border-ink/15'
                }`}
              >
                {/* alfiler de chincheta: la ficha está clavada al tablero */}
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-coral shadow" />
                {/* El sello se estampa sobre la huella (decorativa), nunca sobre el texto de
                    la opción: en una tesis de matemáticas la respuesta tiene que quedar legible. */}
                <Fingerprint
                  className={`w-4 h-4 mx-auto mb-1.5 ${isRight ? 'text-teal' : 'text-ink/70'} ${isRight || isWrongPick ? 'opacity-0' : ''}`}
                />
                <MathText text={opt} />
                {(isRight || isWrongPick) && (
                  <span
                    className={`stamp-in absolute left-1/2 px-1.5 py-0.5 border-[3px] rounded font-display font-bold tracking-widest text-[10px] whitespace-nowrap ${
                      isRight ? 'text-[#0F766E] border-[#0F766E]' : 'text-[#B91C1C] border-[#B91C1C]'
                    }`}
                    style={{ top: 24 }}
                  >
                    {isRight ? 'CULPABLE' : 'DESCARTADA'}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="bg-[#fdf6e3] border border-ink/15 shadow-sm rounded-lg p-4 mt-5">
          <p className="text-[10px] font-mono-lab uppercase tracking-[0.2em] text-ink/70 mb-2">Informe del detective</p>
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
