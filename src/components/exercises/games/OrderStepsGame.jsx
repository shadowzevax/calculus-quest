import { useMemo, useState } from 'react'
import { ListOrdered } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, Prompt } from './GameBits'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Misión 3 — Ordenar los pasos: la respuesta correcta se parte en piezas (palabras/símbolos)
// desordenadas; el estudiante las toca en el orden correcto para reconstruirla. Encaja con
// "operar funciones", que es justo seguir un procedimiento paso a paso.
export default function OrderStepsGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'matching') return <MatchingExercise exercise={exercise} onComplete={onComplete} />
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  const targetText = items.kind === 'choice' ? current.options[current.correctIndex] : (current.answer || '')
  const tokens = useMemo(() => shuffle(String(targetText).split(/(\s+)/).filter((t) => t.trim())), [current])
  const [placed, setPlaced] = useState([])
  const [usedIdx, setUsedIdx] = useState([])

  const place = (tok, i) => {
    if (feedback || usedIdx.includes(i)) return
    setPlaced((p) => [...p, tok])
    setUsedIdx((u) => [...u, i])
  }
  const reset = () => { setPlaced([]); setUsedIdx([]) }

  const submit = () => {
    const assembled = placed.join(' ')
    if (items.kind === 'choice') {
      const matchIndex = current.options.findIndex((o) => o.replace(/\s+/g, ' ').trim() === assembled)
      checkChoice(matchIndex)
    } else {
      checkText(assembled)
    }
  }

  const nextItem = () => { next(); reset() }

  return (
    <div>
      <GameHeader index={index} total={total} label="PASO" />
      <Prompt text={current.prompt} />

      <div className="min-h-[3rem] flex flex-wrap gap-2 border-2 border-dashed border-ink/15 rounded-xl p-3 mb-3 bg-ink/[0.02]">
        {placed.length === 0 && <span className="text-xs text-ink/30 font-mono-lab">Toca las piezas en orden...</span>}
        {placed.map((t, i) => (
          <span key={i} className="bg-blueprint text-white rounded-md px-2.5 py-1 text-sm font-mono-lab">{t}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tokens.map((t, i) => (
          <button
            key={i}
            onClick={() => place(t, i)}
            disabled={usedIdx.includes(i) || !!feedback}
            className={`flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 text-sm font-mono-lab transition-opacity ${
              usedIdx.includes(i) ? 'opacity-25 border-ink/10' : 'border-coral/40 hover:bg-coral/5'
            }`}
          >
            <ListOrdered className="w-3 h-3 text-coral" /> {t}
          </button>
        ))}
      </div>

      {!feedback ? (
        <div className="flex gap-2">
          <button onClick={submit} disabled={placed.length === 0} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30">
            Verificar orden
          </button>
          <button onClick={reset} className="border border-ink/15 hover:bg-ink/5 transition-colors text-ink/60 rounded-lg px-4 py-2 text-sm font-medium">
            Reiniciar
          </button>
        </div>
      ) : null}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}
