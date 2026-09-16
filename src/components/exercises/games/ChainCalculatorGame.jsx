import { useState } from 'react'
import { Cog, CircleDot, Lock, Zap, AlertTriangle } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt, MathText } from './GameBits'
import './missionGames234.css'

// Nombres de función que aceptamos como "máquina" de la cadena. La lista es corta a
// propósito: evita que un "(V o F)" de un enunciado de verdadero/falso se interprete como
// una composición de funciones.
const NOMBRES_VALIDOS = ['f', 'g', 'h', 'p', 'q', 'u', 'v']

// Busca el patrón LITERAL de composición en el enunciado: "(f o g)", "(f ∘ g)" o
// "(f \circ g)". No interpreta ni evalúa ninguna expresión algebraica — solo lee dos
// nombres de función separados por el símbolo de composición dentro de un paréntesis.
// Devuelve null (modo simple, sin cadena que armar) si no hay patrón, si hay más de una
// composición distinta en el mismo enunciado (por ejemplo "¿(f o g)(x) = (g o f)(x)?",
// donde no existe UN orden correcto) o si los nombres no son de función.
// En "(f o g)" se aplica PRIMERO g (la de adentro) y DESPUÉS f.
function detectarComposicion(prompt) {
  const re = /\(\s*([a-z])\s*(?:o|∘|\\circ)\s*([a-z])\s*\)/g
  const encontradas = new Set()
  let m
  while ((m = re.exec(String(prompt))) !== null) {
    const externa = m[1]
    const interna = m[2]
    if (!NOMBRES_VALIDOS.includes(externa) || !NOMBRES_VALIDOS.includes(interna)) continue
    if (externa === interna) continue
    encontradas.add(`${externa}|${interna}`)
  }
  if (encontradas.size !== 1) return null
  const [externa, interna] = [...encontradas][0].split('|')
  return { externa, interna }
}

// Misión 3 — Calculadora en cadena (rediseñada).
// ANTES: el estudiante elegía la respuesta y RECIÉN AHÍ los engranajes giraban 650 ms. La
// animación era decoración posterior a la decisión: hacía esperar, no jugar.
// AHORA: antes de poder responder hay que ARMAR LA CADENA, es decir tocar las máquinas en
// el orden en que actúan sobre el número. En "(f o g)(5)" primero actúa g y después f; si
// se toca al revés la cadena se atasca (sacudida + aviso) y hay que reintentar. Recién con
// la cadena bien armada la chispa recorre el circuito y se habilita la respuesta.
// La mecánica ES el concepto que la misión evalúa: que el orden de composición importa.
// Si el enunciado no trae el patrón "(f o g)" — por ejemplo "(f+g)(2)" o la pregunta de si
// (f o g)(x) = (g o f)(x) — el juego cae a modo simple y se responde directamente.
export default function ChainCalculatorGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [encendidas, setEncendidas] = useState([]) // máquinas activadas en orden, ej. ['g']
  const [atasco, setAtasco] = useState(0) // se incrementa para relanzar la animación de atasco
  const [intentosFallidos, setIntentosFallidos] = useState(0)

  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Cog className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Conecta cada máquina con su pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const composicion = detectarComposicion(current.prompt)
  // Orden en que hay que encender: primero la de adentro, después la de afuera.
  const ordenCorrecto = composicion ? [composicion.interna, composicion.externa] : []
  const cadenaLista = !composicion || encendidas.length === ordenCorrecto.length

  const encender = (nombre) => {
    if (feedback || cadenaLista) return
    const esperada = ordenCorrecto[encendidas.length]
    if (nombre === esperada) {
      setEncendidas((e) => [...e, nombre])
    } else {
      setEncendidas([])
      setAtasco((a) => a + 1)
      setIntentosFallidos((n) => n + 1)
    }
  }

  const siguienteItem = () => {
    next()
    setEncendidas([])
    setIntentosFallidos(0)
  }

  // Las dos máquinas se muestran en el orden en que aparecen ESCRITAS en el enunciado
  // (externa primero), que es justo el orden contrario al de aplicación: ahí está la trampa
  // conceptual que el juego quiere hacer visible.
  const botonesMaquinas = composicion ? [composicion.externa, composicion.interna] : []

  return (
    <div>
      <GameHeader index={index} total={total} label="CADENA" />
      <Prompt text={current.prompt} />

      {composicion && !cadenaLista && (
        <div className="mb-4 rounded-xl border-2 border-coral/30 bg-coral/5 p-4">
          <p className="text-sm font-mono-lab text-ink/80 mb-3">
            Arma la cadena: toca las máquinas en el orden en que actúan sobre el número. Hasta que no quede
            armada no puedes responder.
          </p>
          <div key={atasco} className={`flex flex-wrap gap-3 ${atasco ? 'cadena-atasco' : ''}`}>
            {botonesMaquinas.map((nombre) => {
              const yaEncendida = encendidas.includes(nombre)
              return (
                <button
                  key={nombre}
                  onClick={() => encender(nombre)}
                  disabled={yaEncendida}
                  className={`min-h-[56px] min-w-[76px] px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 font-mono-lab font-bold transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral ${
                    yaEncendida
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-blueprint/40 bg-white text-blueprint'
                  }`}
                >
                  <Cog className={`w-5 h-5 ${yaEncendida ? 'engranaje-gira' : ''}`} />
                  <span className="text-sm leading-none">{nombre}</span>
                </button>
              )
            })}
          </div>
          {encendidas.length > 0 && (
            <p className="mt-3 text-xs font-mono-lab text-teal">
              Encendidas: {encendidas.join(' → ')}
            </p>
          )}
          {intentosFallidos > 0 && (
            <p className="mt-3 text-xs font-mono-lab text-[#B91C1C] flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              La cadena se atascó: esa máquina no es la que actúa primero.
              {intentosFallidos >= 2 && (
                <span>
                  {' '}En ({composicion.externa} ∘ {composicion.interna}) actúa primero la de adentro: {composicion.interna}.
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* la cadena de máquinas: se dibuja con las máquinas ya encendidas */}
      <div className="relative flex items-center gap-1 mb-5 overflow-x-auto py-2">
        <div className="w-9 h-9 rounded-full bg-ink/5 border-2 border-ink/15 flex items-center justify-center text-xs font-mono-lab font-bold text-ink/70 shrink-0">
          x
        </div>
        {/* Sin patrón de composición detectado se dibuja UNA máquina genérica ("fn"): antes se
            adivinaban los nombres con una expresión regular que inventaba engranajes a partir
            de cualquier "letra(" del enunciado, y un estudiante que los contara para deducir
            cuántas composiciones había quedaba mal informado. */}
        {(composicion ? ordenCorrecto : [null]).map((nombre, i) => {
          const activa = !composicion || i < encendidas.length
          return (
            <div key={`${nombre}-${i}`} className="flex items-center gap-1 shrink-0">
              <div className={`h-1 w-10 rounded-full ${activa ? 'bg-coral' : 'bg-ink/10'}`} />
              <div
                className={`w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center shrink-0 ${
                  activa ? 'border-teal bg-teal/10 maquina-enciende' : 'border-ink/15 bg-ink/5'
                }`}
              >
                {activa ? (
                  <Cog className={`w-4 h-4 text-teal ${cadenaLista ? 'engranaje-gira' : ''}`} />
                ) : (
                  <Lock className="w-4 h-4 text-ink/40" />
                )}
                <span className={`text-[10px] font-mono-lab font-bold leading-none mt-0.5 ${activa ? 'text-teal' : 'text-ink/70'}`}>
                  {activa ? nombre || 'fn' : '?'}
                </span>
              </div>
            </div>
          )
        })}
        <div className="flex items-center gap-1 shrink-0">
          <div className={`h-1 w-10 rounded-full ${cadenaLista ? 'bg-coral' : 'bg-ink/10'}`} />
          <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            feedback ? (feedback.isCorrect ? 'border-teal bg-teal/10' : 'border-red-400 bg-red-50') : 'border-gold/40 bg-gold/5'
          }`}>
            <CircleDot className={`w-4 h-4 ${feedback ? (feedback.isCorrect ? 'text-teal' : 'text-red-500') : 'text-gold'}`} />
          </div>
        </div>

        {/* la chispa recorre la cadena EN EL MOMENTO en que queda armada, no después de responder */}
        {composicion && cadenaLista && !feedback && (
          <span
            key={`chispa-${index}`}
            className="pointer-events-none absolute top-1/2 chispa-viaja text-gold"
            aria-hidden="true"
          >
            <Zap className="w-5 h-5 fill-current" />
          </span>
        )}
      </div>

      {cadenaLista ? (
        items.kind === 'choice' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              return (
                <button
                  key={i}
                  onClick={() => checkChoice(i)}
                  disabled={!!feedback}
                  className={`min-h-[52px] flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-3 text-sm font-mono-lab font-semibold transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral border-ink/15 ${
                    isRight ? '!border-teal bg-teal/10 text-teal' : ''
                  } ${isWrongPick ? '!border-red-400 bg-red-50 text-red-500' : ''} ${
                    feedback && !isRight && !isWrongPick ? 'opacity-50' : ''
                  }`}
                >
                  <MathText text={opt} />
                </button>
              )
            })}
          </div>
        ) : (
          // Usa el TextAnswer compartido para que la misión de composición tenga la barra de
          // símbolos (antes tenía un input propio sin SymbolToolbar).
          <TextAnswer key={index} feedback={feedback} onCheck={checkText} />
        )
      ) : (
        <p className="text-sm font-mono-lab text-ink/70 flex items-center gap-1.5">
          <Lock className="w-4 h-4 shrink-0" /> Respuesta bloqueada hasta armar la cadena.
        </p>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={siguienteItem} />
    </div>
  )
}
