import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Flag, PersonStanding, Ghost, MapPin, Brush, Zap, ZapOff } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt, MathText } from './GameBits'
import './missionGames234.css'

// A partir de este porcentaje de pista recorrido por el fantasma, los postes de señalización
// empiezan a descolorarse a su paso. Antes de eso la pista está intacta.
const BORRADO_DESDE_PCT = 60
const BLUR_MAX_ALCANZANDO = 2.2 // px, mientras el fantasma se acerca: molesta, no impide leer
const BLUR_ADELANTADO = 3.6 // px, cuando ya cruzó: obliga a despejar o a leer con esfuerzo

function llegadaConfetti() {
  confetti({
    particleCount: 90,
    spread: 80,
    startVelocity: 40,
    ticks: 150,
    scalar: 0.95,
    colors: ['#FF6B4A', '#F0A93C', '#3FBFAD', '#FFFFFF'],
    origin: { x: 0.85, y: 0.5 },
  })
}

function barajar(n) {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Misión 4 — Carrera hacia el límite.
//
// HISTORIAL DE ESTE ARCHIVO (dos correcciones distintas):
//
// 1º arreglo: el corredor avanzaba con el ÍNDICE de la pregunta, así que avanzaba igual
//    aunque el estudiante fallara todo, y como el índice arranca en 0 nunca llegaba a la
//    bandera. Se cambió para que avance con los ACIERTOS y se le puso un fantasma rival.
//
// 2º arreglo (este): el fantasma corría contra un presupuesto INVENTADO dentro del propio
//    componente (12 s por sub-pregunta), porque el reloj real del bono vivía en
//    MissionDetail.jsx y nunca llegaba hasta aquí. Como el componente no sabía si el bono
//    se había perdido de verdad, no podía permitirse ninguna consecuencia: el fantasma
//    cruzaba la meta y lo único que cambiaba era una frase. Era, con razón, "un juego de
//    opción múltiple disfrazado". Ahora MissionDetail pasa `secondsLeft` y `totalSeconds`,
//    así que el fantasma ES el reloj del bono, y su adelantamiento tiene efecto real:
//
//    a) el bono de velocidad se pierde de verdad (no es una amenaza decorativa);
//    b) al pasar, el fantasma va BORRANDO los postes de señalización: se descoloran cada vez
//       más a medida que se acerca, y quedan casi ilegibles cuando cruza;
//    c) al cruzar, baraja las opciones una vez: quien iba a responder de memoria por la
//       posición pierde esa referencia; quien sabe el límite responde igual.
//
//    El borrado nunca deja una pregunta sin responder: siempre hay un botón para repintar los
//    letreros, y el XP por acertar queda intacto. Lo único que está en juego es el bono.
//
//    (La metáfora es deliberadamente distinta de la niebla + lupa de la Misión 8: allí la
//    niebla es la mecánica central y se despeja barriendo; aquí es el rastro de un rival.)
export default function RaceLimitGame({ exercise, onComplete, onFeedback, secondsLeft, totalSeconds }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [aciertos, setAciertos] = useState(0)
  const [orden, setOrden] = useState(null) // orden de visualización tras el barajado
  const [letrerosRepintados, setLetrerosRepintados] = useState(false)
  const feedbackContadoRef = useRef(null)
  const confettiRef = useRef(false)

  const totalItems = items.list.length || 1

  // El fantasma ES el cronómetro del bono, no una aproximación suya. Si por lo que sea no
  // llega un reloj válido, no se dibuja rival: es preferible una carrera ausente a una
  // carrera que miente sobre lo que está en juego.
  const hayCarrera = Number.isFinite(totalSeconds) && totalSeconds > 0 && Number.isFinite(secondsLeft)
  const pctFantasma = hayCarrera ? Math.min(100, Math.max(0, (1 - secondsLeft / totalSeconds) * 100)) : 0
  const fantasmaCruzo = hayCarrera && secondsLeft <= 0

  // Un acierto = un tramo avanzado. Cada objeto `feedback` es nuevo por ítem, así que este
  // efecto cuenta exactamente una vez por respuesta.
  useEffect(() => {
    if (!feedback || feedbackContadoRef.current === feedback) return
    feedbackContadoRef.current = feedback
    if (feedback.isCorrect) setAciertos((a) => a + 1)
  }, [feedback])

  // Llegada a la bandera: solo ocurre de verdad si se acertaron todos los tramos.
  useEffect(() => {
    if (aciertos > 0 && aciertos === totalItems && !confettiRef.current) {
      confettiRef.current = true
      llegadaConfetti()
    }
  }, [aciertos, totalItems])

  // Barajado: solo cuando el fantasma ya cruzó, solo en preguntas de opción, y solo sobre
  // una pregunta todavía sin responder (barajar después de contestar movería la opción que
  // el estudiante acaba de marcar y haría ilegible la retroalimentación).
  const nOpciones = items.kind === 'choice' ? (current?.options?.length ?? 0) : 0
  useEffect(() => {
    if (items.kind !== 'choice' || !nOpciones) return
    if (fantasmaCruzo && !feedback) setOrden(barajar(nOpciones))
    else if (!fantasmaCruzo) setOrden(null)
    // `index` entra en las dependencias para rebarajar en cada pregunta nueva mientras el
    // fantasma siga delante; `feedback` no, para no rebarajar al responder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, fantasmaCruzo, nOpciones, items.kind])

  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <Flag className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Une cada corredor con su meta</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const pctEstudiante = Math.min(100, (aciertos / totalItems) * 100)
  const vasAdelante = pctEstudiante > pctFantasma
  const enMeta = aciertos === totalItems
  const ultimoRespondido = index === totalItems - 1 && !!feedback
  const bonoVivo = hayCarrera && !fantasmaCruzo

  // Cuánto se han borrado los letreros. Crece de 0 a BLUR_MAX_ALCANZANDO entre
  // BORRADO_DESDE_PCT y la meta, y salta a BLUR_ADELANTADO al ser adelantado. Se desactiva al
  // responder (hay que poder leer la corrección) y con el botón de repintar.
  let blur = 0
  if (!letrerosRepintados && !feedback && hayCarrera) {
    if (fantasmaCruzo) blur = BLUR_ADELANTADO
    else if (pctFantasma > BORRADO_DESDE_PCT) {
      blur = ((pctFantasma - BORRADO_DESDE_PCT) / (100 - BORRADO_DESDE_PCT)) * BLUR_MAX_ALCANZANDO
    }
  }
  const hayBorrado = blur > 0.15
  const ordenVisible = orden && orden.length === nOpciones ? orden : null

  return (
    <div>
      <GameHeader index={index} total={total} label="TRAMO" />

      {/* la pista: dos carriles, tú y el fantasma, misma meta */}
      <div
        className={`relative rounded-2xl border-2 px-6 py-3 mb-3 overflow-hidden transition-colors duration-500 ${
          fantasmaCruzo ? 'border-blueprint/40 bg-blueprint/[0.07]' : 'border-ink/10 bg-ink/[0.03]'
        }`}
      >
        <div className={`absolute inset-0 ${feedback || fantasmaCruzo ? '' : 'pista-rayas'}`} aria-hidden="true" />
        <div className="relative">
          {/* carril del estudiante */}
          <div className="relative h-9">
            <div className="absolute inset-y-0 left-0 right-0 my-auto h-1 bg-ink/10 rounded-full" />
            <div
              className="absolute inset-y-0 left-0 my-auto h-1 bg-coral/50 rounded-full transition-all duration-700"
              style={{ width: `${pctEstudiante}%` }}
            />
            <div
              className="absolute top-0 transition-all duration-700 ease-out"
              style={{ left: `${pctEstudiante}%`, transform: 'translateX(-50%)' }}
            >
              <PersonStanding className={`w-8 h-8 text-coral drop-shadow ${feedback || enMeta ? '' : 'corredor-trote'}`} />
            </div>
          </div>
          {/* carril del fantasma */}
          {hayCarrera && (
            <div className="relative h-8">
              <div className="absolute inset-y-0 left-0 right-0 my-auto h-1 bg-ink/10 rounded-full" />
              <div
                className="absolute top-0 transition-[left] duration-500 ease-linear"
                style={{ left: `${pctFantasma}%`, transform: 'translateX(-50%)' }}
              >
                <Ghost
                  className={`w-7 h-7 text-blueprint ${feedback ? '' : 'fantasma-flota'} ${fantasmaCruzo ? 'fantasma-adelanta' : ''}`}
                />
              </div>
            </div>
          )}
        </div>
        <div className="absolute right-1.5 inset-y-0 flex items-center">
          <Flag className={`w-6 h-6 text-gold ${enMeta ? 'meta-ondea' : ''}`} />
        </div>
      </div>

      {/* Estado del bono: lo que realmente está en juego en la carrera */}
      {hayCarrera && (
        <div
          className={`flex items-center gap-2 text-xs font-mono-lab mb-4 ${
            bonoVivo ? 'text-gold' : 'text-ink/40'
          }`}
        >
          {bonoVivo ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4 rayo-se-apaga" />}
          <span>
            {enMeta
              ? bonoVivo
                ? '¡Cruzaste la meta antes que el fantasma! El bono de velocidad es tuyo.'
                : 'Cruzaste la meta, pero el fantasma llegó primero: esta vez sin bono de velocidad.'
              : fantasmaCruzo
                ? 'El fantasma te adelantó y borró los letreros a su paso: el bono se perdió, el XP por acertar no.'
                : vasAdelante
                  ? 'Vas adelante del fantasma — cada acierto te adelanta un tramo.'
                  : 'El fantasma te viene pisando los talones: el bono de velocidad se va con él.'}
          </span>
        </div>
      )}

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <>
          {hayBorrado && (
            <button
              type="button"
              onClick={() => setLetrerosRepintados(true)}
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-blueprint/30 bg-blueprint/5 px-3 py-1.5 text-xs font-mono-lab text-blueprint transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blueprint"
            >
              <Brush className="w-4 h-4" />
              Repintar los letreros
            </button>
          )}

          {/* Postes de señalización. Tras el adelantamiento se dibujan en el orden barajado, pero cada
              botón conserva su índice original para responder: se mueve la posición, nunca
              la correspondencia entre opción y respuesta. */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-[filter] duration-500 ${
              hayBorrado ? 'letrero-descolora' : ''
            }`}
            style={hayBorrado ? { filter: `blur(${blur.toFixed(2)}px) saturate(0.55)` } : undefined}
          >
            {(ordenVisible ?? current.options.map((_, i) => i)).map((i) => {
              const opt = current.options[i]
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              return (
                <button
                  key={i}
                  onClick={() => checkChoice(i)}
                  disabled={!!feedback}
                  className={`min-h-[52px] flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm font-mono-lab transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                    isRight ? 'border-teal bg-teal/10 text-teal font-semibold' : ''
                  } ${isWrongPick ? 'border-red-400 bg-red-50 text-red-500' : ''} ${
                    !isRight && !isWrongPick ? 'border-ink/15 text-ink' : ''
                  } ${feedback && !isRight && !isWrongPick ? 'opacity-50' : ''}`}
                >
                  <MapPin className={`w-5 h-5 shrink-0 ${isRight ? 'text-teal' : 'text-coral'}`} fill={selected === i ? 'currentColor' : 'none'} />
                  <span className="leading-snug"><MathText text={opt} /></span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        // En las preguntas de escribir no se borra nada: emborronar un campo de texto no crea
        // tensión, solo estorba. Aquí la consecuencia del fantasma es la pérdida del bono.
        <div className="border-t-4 border-dashed border-coral/30 pt-4">
          <TextAnswer key={index} feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />

      {ultimoRespondido && !enMeta && (
        <p className="mt-3 text-xs font-mono-lab text-ink/70">
          Tu corredor avanzó {aciertos} de {totalItems} tramos: solo los aciertos empujan hacia la bandera.
        </p>
      )}

      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
