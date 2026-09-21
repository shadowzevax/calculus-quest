import { useState } from 'react'
import { LineChart, SlidersHorizontal, Eye, CheckCircle2 } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Clasifica el texto de una opción en un tipo de gráfica reconocible, para dibujar un
// mini-gráfico representativo en vez de solo texto — así "elegir la respuesta" se vuelve
// "reconocer la forma de la gráfica correcta", que es justo la habilidad que mide esta misión.
function classify(label) {
  const l = String(label).toLowerCase()
  // --- Discontinuidades (se conservan: otras misiones podrian reutilizar este juego) ---
  if (l.includes('evitable')) return 'hole'
  if (l.includes('salto')) return 'jump'
  if (l.includes('infinit') || l.includes('esencial') || l.includes('asint')) return 'asymptote'
  // --- Analisis grafico (Mision 11) ---
  // EL ORDEN DE ESTAS COMPROBACIONES ES CRITICO, ver nota abajo.
  if (l.includes('inflexion')) return 'inflection'
  if (l.includes('concava hacia arriba') || l.includes('concava arriba')) return 'concaveUp'
  if (l.includes('concava hacia abajo') || l.includes('concava abajo')) return 'concaveDown'
  if (l.includes('maximo')) return 'maxLocal'
  if (l.includes('minimo')) return 'minLocal'
  if (l.includes('decreciente')) return 'decreasing'
  if (l.includes('creciente')) return 'increasing'
  return 'continuous'
}

// Mini-gráficas SVG reutilizables (miniatura y grande) para cada tipo de discontinuidad.
function DiscontinuityGraph({ type, accent = '#1B3A5C' }) {
  return (
    <svg viewBox="0 0 120 72" className="w-full h-full">
      <line x1="6" y1="60" x2="114" y2="60" stroke={accent} strokeOpacity="0.2" strokeWidth="1" />
      <line x1="60" y1="6" x2="60" y2="66" stroke={accent} strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 2" />
      {type === 'continuous' && (
        <path d="M12,52 Q60,8 108,52" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      )}
      {type === 'hole' && (
        <>
          <path d="M12,52 Q45,18 57,32" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M63,32 Q75,18 108,52" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="30" r="4" fill="white" stroke={accent} strokeWidth="2.5" />
          <circle cx="60" cy="46" r="3.5" fill={accent} />
        </>
      )}
      {type === 'jump' && (
        <>
          <path d="M12,52 Q40,40 58,36" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M62,18 Q80,14 108,10" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="59" cy="36" r="4" fill="white" stroke={accent} strokeWidth="2.5" />
          <circle cx="62" cy="18" r="3.5" fill={accent} />
        </>
      )}
      {type === 'asymptote' && (
        <>
          <path d="M12,58 Q45,52 57,10" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M63,62 Q75,20 108,14" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {type === 'concaveUp' && (
        <path d="M12,16 Q60,64 108,16" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      )}
      {type === 'concaveDown' && (
        <path d="M12,56 Q60,8 108,56" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      )}
      {type === 'inflection' && (
        <>
          <path d="M12,62 C34,60 46,44 60,36 C74,28 86,12 108,10" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="36" r="3.5" fill="white" stroke={accent} strokeWidth="2.5" />
        </>
      )}
      {type === 'increasing' && (
        <path d="M12,60 Q60,48 108,12" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      )}
      {type === 'decreasing' && (
        <path d="M12,12 Q60,24 108,60" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      )}
      {type === 'maxLocal' && (
        <>
          <path d="M14,58 Q60,4 106,58" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="31" r="3.5" fill={accent} />
        </>
      )}
      {type === 'minLocal' && (
        <>
          <path d="M14,14 Q60,68 106,14" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="41" r="3.5" fill={accent} />
        </>
      )}
    </svg>
  )
}

// Misión 11 — Simulador gráfico (rediseñado).
// ANTES: cada opción ya mostraba su propio mini-gráfico, así que la caja grande de arriba
// ("Toca una opción para ver su gráfica") solo repetía la MISMA gráfica más grande — no
// revelaba nada nuevo. Y como el toque enviaba la respuesta a los 450 ms sin poder
// reconsiderar, "elegir" era en realidad "hacer clic y ya", sin ninguna decisión real de por
// medio. Sebastian lo notó al jugarlo: "no le veo la diversión" y "dice que toque para ver la
// gráfica pero la gráfica ya se muestra" — ambos diagnósticos eran correctos.
// AHORA: las opciones muestran SOLO el texto (con un ícono de ojo invitando a mirar) — la
// gráfica de cada una se mantiene oculta hasta que se toca, y aparece en la caja grande de
// arriba. Se puede cambiar de vista previa las veces que se quiera, y hay que pulsar
// "Confirmar esta forma" para responder de verdad: la frase "toca para ver la gráfica" vuelve
// a ser literalmente cierta, y ya no hay envíos accidentales. Al responder, recién ahí se
// revelan las 4 gráficas juntas (coloreadas correcta/incorrecta) para comparar y aprender.
// Para el ejercicio de "completar espacio" (hallar k), un deslizante mueve de verdad la pieza
// de la función en vivo, así se puede EXPLORAR antes de escribir la respuesta.
export default function GraphSimulatorGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [peek, setPeek] = useState(null) // opción que se está previsualizando, aún sin confirmar
  const [k, setK] = useState(0)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <LineChart className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Ubica cada pareja en el plano</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const confirm = () => { if (peek !== null) checkChoice(peek) }

  const nextItem = () => { next(); setPeek(null); setK(0) }
  const previewIdx = feedback ? selected : peek
  const previewType = items.kind === 'choice' && previewIdx !== null ? classify(current.options[previewIdx]) : null

  return (
    <div>
      <GameHeader index={index} total={total} label="ESCENA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div>
          <div className="bg-white border border-ink/10 rounded-xl p-4 mb-4 h-32 flex items-center justify-center">
            {previewType ? (
              <div className="w-40 h-24">
                <DiscontinuityGraph type={previewType} accent={feedback ? (feedback.isCorrect ? '#2A9D8F' : '#E76F51') : '#FF6B4A'} />
              </div>
            ) : (
              <p className="text-xs font-mono-lab text-ink/40">Toca una opción para ver su gráfica</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((opt, i) => {
              const isRight = feedback && i === current.correctIndex
              const isWrongPick = feedback && selected === i && i !== current.correctIndex
              const type = classify(opt)
              return (
                <button
                  key={i}
                  onClick={() => !feedback && setPeek(i)}
                  disabled={!!feedback}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                    peek === i && !feedback ? 'scale-105 border-coral bg-coral/5' : 'border-ink/10'
                  } ${isRight ? '!border-teal bg-teal/5' : ''} ${isWrongPick ? '!border-red-400 bg-red-50' : ''}`}
                >
                  <div className="w-full h-14">
                    {feedback ? (
                      // Recién al responder se revelan las 4 gráficas juntas, para comparar la
                      // que se eligió contra la real — antes de eso, se ocultan a propósito.
                      <DiscontinuityGraph type={type} accent={isRight ? '#2A9D8F' : isWrongPick ? '#E76F51' : '#1B3A5C'} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Eye className={`w-5 h-5 ${peek === i ? 'text-coral' : 'text-ink/20'}`} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-mono-lab text-center leading-tight ${isRight ? 'text-teal font-semibold' : 'text-ink/60'}`}>{opt}</span>
                </button>
              )
            })}
          </div>

          {!feedback && (
            <button
              onClick={confirm}
              disabled={peek === null}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-blueprint hover:bg-coral disabled:opacity-30 disabled:hover:bg-blueprint transition-colors text-white rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirmar esta forma
            </button>
          )}
        </div>
      ) : (
        <ExploreAndAnswer index={index} current={current} feedback={feedback} k={k} setK={setK} onCheck={checkText} />
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}

// Para el ejercicio de "hallar k": un deslizante mueve de verdad el segundo tramo de la
// función en vivo, para poder explorar visualmente hasta dónde debe llegar antes de escribir
// la respuesta — no es solo decoración, cambia la gráfica en tiempo real.
function ExploreAndAnswer({ index, current, feedback, k, setK, onCheck }) {
  // Antes targetY = 52 - k*4.4 no tenía ninguna relación con el k REAL de este ejercicio
  // (current.answer): con k en [-8,8], targetY caía en [16.8, 87.2] y el extremo de la curva
  // azul está fijo en y=14 (línea de abajo) — era matemáticamente IMPOSIBLE "encajar" con
  // ningún valor de k, y aunque encajara no habría indicado el k correcto (era un desplazamiento
  // en píxeles inventado, igual para cualquier ejercicio). Ahora targetY se calcula a partir de
  // la distancia real entre el k que el estudiante mueve y el k correcto de ESTE ejercicio: por
  // construcción llega exactamente a 14 (coincide con el extremo de la curva azul) si y solo si
  // k === el valor correcto, y se aleja proporcionalmente en cualquier otro valor.
  const correctK = parseFloat(String(current.answer).replace(',', '.'))
  const targetY = Number.isNaN(correctK) ? 52 - k * 4.4 : 14 + (correctK - k) * 4.4
  return (
    <div className="border border-blueprint/20 rounded-xl p-4 bg-blueprint/5">
      <div className="bg-white border border-ink/10 rounded-lg p-3 mb-3">
        <svg viewBox="0 0 120 72" className="w-full h-24">
          <line x1="60" y1="6" x2="60" y2="66" stroke="#1B3A5C" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="6" y1="60" x2="114" y2="60" stroke="#1B3A5C" strokeOpacity="0.2" strokeWidth="1" />
          <path d="M12,58 Q40,20 58,14" fill="none" stroke="#457B9D" strokeWidth="3" strokeLinecap="round" />
          <circle cx="58" cy="14" r="3.5" fill="#457B9D" />
          <line x1="62" y1={targetY} x2="108" y2={targetY} stroke="#FF6B4A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="62" cy={targetY} r="4" fill="white" stroke="#FF6B4A" strokeWidth="2.5" />
        </svg>
        <div className="flex items-center gap-2 mt-1">
          <SlidersHorizontal className="w-4 h-4 text-blueprint/50 shrink-0" />
          <input
            type="range"
            min="-8"
            max="8"
            step="0.5"
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full accent-coral"
          />
        </div>
        <p className="text-[11px] font-mono-lab text-ink/40 text-center mt-1">
          Mueve el tramo naranja hasta que encaje con la curva azul, luego escribe ese valor de k
        </p>
      </div>
      <TextAnswer key={index} feedback={feedback} onCheck={onCheck} />
    </div>
  )
}
