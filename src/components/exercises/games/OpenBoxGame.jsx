import { useState } from 'react'
import confetti from 'canvas-confetti'
import { Gift, CheckCircle2, XCircle, Eye, Hand, HelpCircle, Sparkles } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt, MathText } from './GameBits'
import './missionGames234.css'

const BOX_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A']
const MAX_INSPECCIONES = 2

// Ráfaga corta cuando se acierta apostando a una caja que nunca se abrió: es el único
// premio visual del juego y solo se gana arriesgando (canvas-confetti ya está instalada y
// se usa igual en BalloonPopGame/MissionDetail).
function premioCiego() {
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 34,
    ticks: 120,
    scalar: 0.9,
    colors: ['#F0A93C', '#3FBFAD', '#FF6B4A', '#FFFFFF'],
    origin: { y: 0.6 },
  })
}

// Misión 2 — Abre la caja (rediseñada).
// ANTES: una sola caja cerrada que, al pulsarla, mostraba exactamente la misma pregunta que
// se habría visto igual sin la caja. Un clic vacío, sin animación de apertura pese al nombre
// del juego.
// AHORA: las 4 cajas están sobre la mesa desde el principio, una por opción, pero el
// estudiante solo tiene 2 inspecciones. Abrir una caja revela su opción (tapa que gira,
// contenido que sale) y gasta una inspección; con las otras dos se puede apostar a ciegas.
// Así abrir tiene costo y elegir implica riesgo real: hay que decidir cuáles dos opciones
// vale la pena leer — que en dominio/rango es justamente el criterio a entrenar (descartar
// por la forma de la función antes de leer todas las alternativas).
export default function OpenBoxGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [abiertas, setAbiertas] = useState([]) // índices de opción inspeccionados en este ítem
  const [recienAbierta, setRecienAbierta] = useState(null)
  const [aciertoCiego, setAciertoCiego] = useState(false)

  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-gold">
          <Gift className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Abre cada regalo y encuentra su pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  // Con solo 2 opciones (los ítems de verdadero/falso) esconderlas no crearía ninguna
  // decisión: el estudiante ya sabe que dicen "Verdadero" y "Falso". En ese caso las cajas
  // están abiertas desde el principio y el juego es simplemente elegir; el presupuesto de
  // inspecciones aparece solo cuando hay 3 o más opciones que realmente esconder.
  const modoOculto = items.kind === 'choice' && current.options.length >= 3
  const inspeccionesUsadas = abiertas.length
  const inspeccionesLibres = MAX_INSPECCIONES - inspeccionesUsadas

  const abrir = (i) => {
    if (feedback || abiertas.includes(i) || inspeccionesLibres <= 0) return
    setAbiertas((a) => [...a, i])
    setRecienAbierta(i)
  }

  const elegir = (i) => {
    if (feedback) return
    const aCiegas = modoOculto && !abiertas.includes(i)
    if (aCiegas && i === current.correctIndex) {
      setAciertoCiego(true)
      premioCiego()
    }
    checkChoice(i)
  }

  const siguiente = () => {
    next()
    setAbiertas([])
    setRecienAbierta(null)
    setAciertoCiego(false)
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="CAJA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
            {modoOculto ? (
              <>
                <span className="flex items-center gap-1.5 text-xs font-mono-lab uppercase tracking-wide text-gold">
                  <Eye className="w-4 h-4" />
                  Inspecciones: {inspeccionesLibres} de {MAX_INSPECCIONES}
                </span>
                <span className="text-xs font-mono-lab text-ink/70">
                  {inspeccionesLibres > 0
                    ? 'Abre solo las cajas que necesites leer; después tendrás que elegir.'
                    : 'Se acabaron las inspecciones: elige entre lo que viste o apuesta a una caja cerrada.'}
                </span>
              </>
            ) : (
              <span className="text-xs font-mono-lab text-ink/70">Toca la caja con la respuesta que consideres correcta.</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {current.options.map((opt, i) => {
              const color = BOX_COLORS[i % BOX_COLORS.length]
              const abierta = !modoOculto || abiertas.includes(i) || !!feedback
              const inspeccionada = abiertas.includes(i)
              const isRight = feedback && i === current.correctIndex
              const isPicked = selected === i
              const isWrongPick = feedback && isPicked && i !== current.correctIndex
              const borde = isRight ? '#2A9D8F' : isWrongPick ? '#E76F51' : color
              return (
                <div
                  key={i}
                  className={`relative rounded-xl border-2 p-3 flex flex-col gap-3 transition-all ${
                    feedback && !isRight && !isPicked ? 'opacity-50' : ''
                  } ${recienAbierta === i ? 'caja-rebote' : ''}`}
                  style={{ borderColor: borde, backgroundColor: `${borde}12` }}
                >
                  {feedback && (isPicked || isRight) && (
                    <span className="absolute -top-2.5 -right-2.5 rounded-full bg-white shadow z-10">
                      {isRight ? <CheckCircle2 className="w-5 h-5 text-teal" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    </span>
                  )}

                  {/* la caja dibujada: tapa que gira + cuerpo */}
                  <div className="relative h-20 flex items-end justify-center">
                    <div
                      className={`absolute bottom-10 w-24 h-5 rounded-md border-2 caja-tapa ${abierta ? 'caja-tapa--abierta' : ''} ${
                        !abierta && !feedback ? 'caja-late' : ''
                      }`}
                      style={{ borderColor: borde, backgroundColor: `${borde}44` }}
                    />
                    <div
                      className="w-20 h-12 rounded-b-lg rounded-t-sm border-2 flex items-center justify-center overflow-hidden"
                      style={{ borderColor: borde, backgroundColor: `${borde}22` }}
                    >
                      {abierta ? (
                        <Sparkles className="w-5 h-5 caja-contenido" style={{ color: borde }} />
                      ) : (
                        <HelpCircle className="w-6 h-6" style={{ color: borde }} />
                      )}
                    </div>
                  </div>

                  {/* contenido revelado o incógnita */}
                  <div className="min-h-[3rem] flex items-center justify-center text-center text-sm font-mono-lab px-1">
                    {abierta ? (
                      <span className="text-ink leading-snug caja-contenido">
                        <MathText text={opt} />
                      </span>
                    ) : (
                      <span className="text-ink/70 leading-snug">Caja {i + 1} — sin abrir</span>
                    )}
                  </div>

                  {!feedback && (
                    <div className="flex gap-2">
                      {modoOculto && !inspeccionada && (
                        <button
                          onClick={() => abrir(i)}
                          disabled={inspeccionesLibres <= 0}
                          className="flex-1 min-h-[44px] rounded-lg border-2 border-ink/15 bg-white text-xs font-mono-lab font-semibold text-ink/80 flex items-center justify-center gap-1.5 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-40"
                        >
                          <Eye className="w-4 h-4" /> Abrir
                        </button>
                      )}
                      <button
                        onClick={() => elegir(i)}
                        className="flex-1 min-h-[44px] rounded-lg text-xs font-mono-lab font-semibold text-white flex items-center justify-center gap-1.5 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                        style={{ backgroundColor: borde }}
                      >
                        <Hand className="w-4 h-4" /> {!modoOculto || inspeccionada ? 'Elegir esta' : 'Apostar a ciegas'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {aciertoCiego && feedback?.isCorrect && (
            <p className="mt-4 text-sm font-mono-lab text-[#0F766E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0" /> ¡Acertaste sin abrir la caja! Descartaste las otras por la función, no por leerlas.
            </p>
          )}
        </div>
      ) : (
        <div className="border-2 border-gold/30 rounded-xl p-4 bg-gold/5">
          <div className="flex items-center gap-2 mb-3 text-gold">
            <Gift className="w-5 h-5 caja-contenido" />
            <span className="text-xs font-mono-lab uppercase">Caja abierta — escribe lo que va adentro</span>
          </div>
          <TextAnswer key={index} feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={siguiente} />
    </div>
  )
}
