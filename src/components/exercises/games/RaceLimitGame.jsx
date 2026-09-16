import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Flag, PersonStanding, Ghost, MapPin } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt, MathText } from './GameBits'
import './missionGames234.css'

// Presupuesto del fantasma. NO es un número inventado: 12 s por sub-pregunta es exactamente
// el término "subItems * 12" de speedBonusBudget() en MissionDetail.jsx, y los 20 s extra de
// los ítems de escribir caben de sobra dentro del término base de ese mismo cálculo (35 s
// para fill_blank). Como el presupuesto real del bono siempre es MAYOR que el del fantasma
// (le suma la base por tipo de ejercicio y el extra por dificultad de la misión), ganarle al
// fantasma implica con certeza haber respondido dentro de la ventana del bono. Al revés no
// vale, y por eso el juego nunca afirma que perder la carrera signifique perder el bono.
const SEGUNDOS_FANTASMA_POR_ITEM = 12
const COLCHON_ESCRITURA = 20

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

// Misión 4 — Carrera hacia el límite (rediseñada).
// ANTES: el corredor avanzaba con el ÍNDICE de la pregunta, así que avanzaba igual aunque el
// estudiante fallara todo, y como el índice arranca en 0 nunca llegaba a la bandera (con 3
// preguntas se quedaba en 67%). No había rival, ni reloj, ni carrera: era una barra de
// progreso con un ícono de persona.
// AHORA: (a) el corredor avanza con los ACIERTOS y cruza la meta al completar; (b) corre
// contra un FANTASMA que avanza con el tiempo real de respuesta, con el mismo presupuesto
// por sub-pregunta que usa el bono de velocidad de MissionDetail.jsx. El bono, que antes era
// un número abstracto en la cabecera, ahora se ve como alguien pisándote los talones.
export default function RaceLimitGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [aciertos, setAciertos] = useState(0)
  const [msFantasma, setMsFantasma] = useState(0) // tiempo efectivo de respuesta acumulado
  const acumuladoRef = useRef(0)
  const feedbackContadoRef = useRef(null)
  const confettiRef = useRef(false)

  const jugable = items.kind === 'choice' || items.kind === 'text'
  const totalItems = items.list.length || 1
  const presupuestoFantasmaMs =
    (SEGUNDOS_FANTASMA_POR_ITEM * totalItems + (items.kind === 'text' ? COLCHON_ESCRITURA : 0)) * 1000

  // Cronómetro del fantasma: corre solo mientras el estudiante está respondiendo y se
  // congela mientras lee la retroalimentación — igual que el cronómetro del bono real, que
  // MissionDetail.jsx pausa con onFeedback. Se limpia siempre al desmontar.
  useEffect(() => {
    if (!jugable || feedback) return
    const inicio = Date.now()
    const id = setInterval(() => setMsFantasma(acumuladoRef.current + (Date.now() - inicio)), 120)
    return () => {
      clearInterval(id)
      acumuladoRef.current += Date.now() - inicio
    }
  }, [index, feedback, jugable])

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
  const pctFantasma = Math.min(100, (msFantasma / presupuestoFantasmaMs) * 100)
  const vasAdelante = pctEstudiante > pctFantasma
  const enMeta = aciertos === totalItems
  const ultimoRespondido = index === totalItems - 1 && !!feedback
  const ganasteCarrera = enMeta && pctFantasma < 100

  return (
    <div>
      <GameHeader index={index} total={total} label="TRAMO" />

      {/* la pista: dos carriles, tú y el fantasma, misma meta */}
      <div className="relative rounded-2xl border-2 border-ink/10 bg-ink/[0.03] px-6 py-3 mb-5 overflow-hidden">
        <div className={`absolute inset-0 ${feedback ? '' : 'pista-rayas'}`} aria-hidden="true" />
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
          <div className="relative h-8">
            <div className="absolute inset-y-0 left-0 right-0 my-auto h-1 bg-ink/10 rounded-full" />
            <div
              className="absolute top-0 transition-[left] duration-150 ease-linear"
              style={{ left: `${pctFantasma}%`, transform: 'translateX(-50%)' }}
            >
              <Ghost className={`w-7 h-7 text-blueprint ${feedback ? '' : 'fantasma-flota'}`} />
            </div>
          </div>
        </div>
        <div className="absolute right-1.5 inset-y-0 flex items-center">
          <Flag className={`w-6 h-6 text-gold ${enMeta ? 'meta-ondea' : ''}`} />
        </div>
      </div>

      <p className={`text-xs font-mono-lab mb-4 ${vasAdelante ? 'text-[#0F766E]' : 'text-[#B91C1C]'}`}>
        {enMeta
          ? ganasteCarrera
            ? '¡Cruzaste la meta antes que el fantasma! El bono de velocidad es tuyo.'
            : 'Cruzaste la meta, pero el fantasma llegó primero. La próxima, gánale.'
          : vasAdelante
            ? 'Vas adelante del fantasma — cada acierto te adelanta un tramo.'
            : pctFantasma >= 100
              ? 'El fantasma ya cruzó la meta, pero la carrera sigue: responder bien vale más que responder rápido.'
              : 'El fantasma te viene pisando los talones: responde antes de que te alcance.'}
      </p>

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        // Postes de señalización: una rejilla que se adapta al número de opciones (antes eran
        // anchos fijos de 1/4 que se desbordaban con 5 opciones y quedaban ilegibles en un
        // celular de 360 px).
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {current.options.map((opt, i) => {
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
      ) : (
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
