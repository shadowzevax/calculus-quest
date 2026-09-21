import { useEffect, useRef, useState } from 'react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'
import martilloIcon from '@/assets/games/martillo.svg'
import topoIcon from '@/assets/games/topo.png'

// Los grados los da el usuario en convención de transportador (0° = derecha, 90° = arriba,
// 180° = izquierda). El SVG del mazo, sin rotar, apunta hacia arriba (90°), así que para
// llevarlo a un ángulo de transportador θ hay que rotarlo en CSS (que gira en sentido horario
// desde ese "arriba") por (90 - θ).
const toCssRotation = (protractorDeg) => 90 - protractorDeg
const MALLET_ANGLE = { idle: toCssRotation(40), strike: toCssRotation(180) }
const MALLET_SCALE = { idle: 1, strike: 1.15 }

// Misión 6 — Golpea el topo: las opciones son agujeros de tierra con un topo asomado; hay
// que "golpearlo" (tocarlo) si es la respuesta correcta. El mazo sigue al mouse con un buen
// retroceso antes del golpe, y el golpe deja chispas sobre el agujero elegido.
export default function WhackMoleGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [malletPos, setMalletPos] = useState({ x: 0, y: 0 })
  const [phase, setPhase] = useState('idle')
  // Antes los topos eran estáticos (siempre asomados) — un "whack-a-mole" real los esconde y
  // saca en momentos aleatorios. `visible[i]` controla si el topo del agujero i está afuera.
  const [visible, setVisible] = useState([])
  const areaRef = useRef(null)
  const optionCount = items.kind === 'choice' ? current.options.length : 0

  // Reinicia todos los topos visibles al entrar a una pregunta nueva.
  useEffect(() => {
    setVisible(Array.from({ length: optionCount }, () => true))
  }, [index, optionCount])

  // Ciclo de aparición/ocultamiento: cada topo decide de nuevo, al azar, si se asoma o se
  // esconde. Se detiene mientras se muestra retroalimentación (para no ocultar el topo que
  // acaba de indicar si la respuesta fue correcta) y se limpia siempre al desmontar.
  useEffect(() => {
    if (!optionCount || feedback) return
    const id = setInterval(() => {
      setVisible((v) => v.map(() => Math.random() > 0.35))
    }, 900)
    return () => clearInterval(id)
  }, [optionCount, feedback, index])

  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const trackMallet = (e) => {
    const point = e.touches ? e.touches[0] : e
    const rect = areaRef.current.getBoundingClientRect()
    setMalletPos({ x: point.clientX - rect.left, y: point.clientY - rect.top })
  }
  const swing = () => {
    setPhase('strike')
    setTimeout(() => setPhase('idle'), 180)
  }

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-[#6B4226]">
          <img src={topoIcon} alt="" className="w-5 h-5 object-contain" />
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
          onTouchStart={trackMallet}
          onTouchMove={trackMallet}
          className="relative grid grid-cols-2 gap-4 [&_*]:cursor-none cursor-none"
        >
          {/* mazo: siempre en su propia capa, sigue el mouse sin depender del elemento bajo el cursor */}
          <img
            src={martilloIcon}
            alt=""
            className="pointer-events-none absolute z-30 select-none w-28 h-28"
            style={{
              left: malletPos.x,
              top: malletPos.y,
              transform: `translate(-30%, -80%) rotate(${MALLET_ANGLE[phase]}deg) scale(${MALLET_SCALE[phase]})`,
              transition: phase === 'idle' ? 'transform 160ms ease-out' : 'transform 130ms cubic-bezier(.3,0,.6,1)',
              filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.3))',
            }}
          />

          {current.options.map((opt, i) => {
            const hit = feedback && selected === i
            const isRight = feedback && i === current.correctIndex
            const missed = hit && !isRight
            const showSpark = phase === 'strike' && selected === i
            const peeking = !!feedback || visible[i] !== false
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
                    borderColor: isRight ? '#2A9D8F' : hit ? '#E76F51' : '#4a2f20',
                  }}
                >
                  <img
                    src={topoIcon}
                    alt=""
                    className={`w-14 h-14 object-contain mb-1 transition-transform duration-300 ${missed ? 'translate-y-6 opacity-0' : hit ? '-translate-y-1' : !peeking ? 'translate-y-7 opacity-0' : ''}`}
                    style={{ filter: isRight ? 'drop-shadow(0 0 6px #2A9D8F)' : hit ? 'drop-shadow(0 0 6px #E76F51)' : 'none' }}
                  />
                  {showSpark && (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl animate-ping [animation-iteration-count:1] [animation-duration:280ms]">
                      💥
                    </span>
                  )}
                </div>
                <span className={`mt-1.5 text-xs font-mono-lab text-center leading-tight ${isRight ? 'text-teal font-semibold' : missed ? 'text-red-500 font-semibold' : 'text-ink/70'}`}>
                  {opt}
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-2 rounded-2xl p-4" style={{ borderColor: '#7a5236', backgroundColor: '#7a523612' }}>
          <TextAnswer key={index} feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
