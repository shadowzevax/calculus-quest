import { useState } from 'react'
import { SlidersHorizontal, Tag } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Interpreta el texto REAL de cada opción del banco de ejercicios (revisado contra los datos
// reales en producción: mezclan traslaciones con magnitud, reflexiones y compresiones, ej.
// "Traslacion 3 a la izquierda y 2 abajo", "Reflexion sobre el eje x", "Compresion horizontal")
// y lo convierte en una transformación CSS real — así lo que se ve en el SVG es la
// transformación que el texto describe de verdad, no un desplazamiento arbitrario por índice.
function parseTransform(text) {
  const t = String(text || '').toLowerCase()
  const nums = (t.match(/\d+(\.\d+)?/g) || []).map(Number)

  if (t.includes('reflex')) {
    if (t.includes('eje x')) return { css: 'scaleY(-1)' }
    if (t.includes('eje y')) return { css: 'scaleX(-1)' }
    return { css: 'none' }
  }
  if (t.includes('compres') || t.includes('estiramiento') || t.includes('estirar')) {
    const isCompress = t.includes('compres')
    const factor = isCompress ? 0.55 : 1.8
    if (t.includes('horizontal')) return { css: `scaleX(${factor})` }
    if (t.includes('vertical')) return { css: `scaleY(${factor})` }
    return { css: 'none' }
  }
  if (t.includes('traslac') || t.includes('desplaz')) {
    let dx = 0
    let dy = 0
    if (t.includes('izquierda')) dx = -(nums[0] ?? 3) * 6
    else if (t.includes('derecha')) dx = (nums[0] ?? 3) * 6
    else if (t.includes('horizontal')) dx = 20 // genérico: sin magnitud/dirección en el texto

    if (t.includes('abajo')) dy = (nums[nums.length - 1] ?? 2) * 8
    else if (t.includes('arriba')) dy = -(nums[nums.length - 1] ?? 2) * 8
    else if (t.includes('vertical') && dx === 0) dy = -16 // genérico

    return { css: `translate(${dx}px, ${dy}px)` }
  }
  return { css: 'none' }
}

// Misión 5 — Simulador gráfico: el deslizante recorre las opciones de la pregunta actual; para
// cada una, la curva naranja se transforma en el plano según lo que esa opción describe de
// verdad (reflexión, traslación con su magnitud real, o compresión/estiramiento), comparándose
// contra la curva base f(x) (punteada) — así el estudiante puede VER cada transformación antes
// de elegir, en vez de solo leer el texto de la opción. Las 3 preguntas reales de esta misión
// son justamente comparaciones f/g o f/h ("g(x) = (x-3)^2 + 2", "h(x) = -f(x)", "h(x) = f(-x)"),
// así que la curva de referencia no es decorativa: es la mitad de lo que hay que comparar.
// Sebastian preguntó por ella el 2026-09-20 porque a simple vista, sin etiqueta, parecía un
// resto gráfico — se le agregó la leyenda y el trazo punteado para que se lea como intencional.
export default function DiagramDragGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [sliderPos, setSliderPos] = useState(0)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Tag className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Ubica cada pareja en el plano</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const isChoice = items.kind === 'choice'
  const nOptions = isChoice ? current.options.length : 1
  const maxPos = Math.max(nOptions - 1, 1)
  const snapped = Math.round(sliderPos)
  const activeTransform = isChoice ? parseTransform(current.options[snapped]) : { css: 'none' }

  const confirm = () => checkChoice(snapped)

  return (
    <div>
      <GameHeader index={index} total={total} label="ESCENA" />

      {isChoice && (
        <div className="relative bg-blueprint/5 border border-blueprint/15 rounded-xl p-4 mb-3 overflow-hidden">
          <svg width="100%" height="110" viewBox="0 0 200 110">
            <line x1="0" y1="55" x2="200" y2="55" stroke="#1B3A5C" strokeWidth="1" opacity="0.4" />
            <line x1="100" y1="0" x2="100" y2="110" stroke="#1B3A5C" strokeWidth="1" opacity="0.4" />
            <path
              d="M 20 90 Q 100 10 180 40"
              fill="none"
              stroke="#1B3A5C"
              strokeOpacity="0.4"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <path
              d="M 20 90 Q 100 10 180 40"
              fill="none"
              stroke={feedback ? (feedback.isCorrect ? '#2A9D8F' : '#E76F51') : '#FF6B4A'}
              strokeWidth="2.5"
              style={{ transformOrigin: '100px 55px', transform: activeTransform.css, transition: 'transform 150ms ease' }}
            />
          </svg>
          <div className="flex items-center gap-2 mt-1">
            <SlidersHorizontal className="w-4 h-4 text-blueprint/50 shrink-0" />
            <input
              type="range"
              min="0"
              max={maxPos}
              step="1"
              value={sliderPos}
              disabled={!!feedback}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="w-full accent-coral"
            />
          </div>
          <div className="flex items-center justify-center gap-4 mt-1 text-[10px] font-mono-lab text-ink/60">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 border-t-2 border-dashed border-blueprint/50" />
              f(x) original
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 border-t-2 border-coral" />
              tras la transformación
            </span>
          </div>
          <p className="text-[11px] font-mono-lab text-ink/70 text-center mt-1">Desliza para ver cómo se transforma la curva con cada opción</p>
        </div>
      )}

      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              return (
                <span
                  key={i}
                  className={`text-xs font-mono-lab px-2.5 py-1 rounded-full border ${
                    snapped === i && !feedback ? 'border-coral bg-coral/10 text-coral' : 'border-ink/15 text-ink/50'
                  } ${isRight ? '!border-teal !bg-teal/10 !text-teal' : ''} ${isWrongPick ? 'opacity-30' : ''}`}
                >
                  {opt}
                </span>
              )
            })}
          </div>
          {!feedback && (
            <button onClick={confirm} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
              Confirmar posición
            </button>
          )}
        </div>
      ) : (
        <div className="border border-blueprint/20 rounded-xl p-4 bg-blueprint/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setSliderPos(0) }} />
    </div>
  )
}
