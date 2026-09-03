import { PuzzleIcon } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Silueta de pieza de rompecabezas con "orejas" redondeadas (tab) en dos lados, generada con
// clip-path de arcos (calc de porcentajes no soporta curvas, asi que se aproxima con muchos
// puntos formando semicirculos salientes) — se ve como una pieza real, no un rectangulo con
// esquinas cortadas.
const PIECE_CLIP =
  'polygon(0% 0%, 38% 0%, 38% 8%, 40% 4%, 44% 1%, 50% 0%, 56% 1%, 60% 4%, 62% 8%, 62% 0%, 100% 0%, 100% 38%, 92% 38%, 96% 40%, 99% 44%, 100% 50%, 99% 56%, 96% 60%, 92% 62%, 100% 62%, 100% 100%, 62% 100%, 62% 92%, 60% 96%, 56% 99%, 50% 100%, 44% 99%, 40% 96%, 38% 92%, 38% 100%, 0% 100%, 0% 62%, 8% 62%, 4% 60%, 1% 56%, 0% 50%, 1% 44%, 4% 40%, 8% 38%, 0% 38%)'

// Misión 7 — Encajar piezas: cada opción es una pieza de rompecabezas que se "encaja" en el
// espacio vacío — encaja con hallar el resultado correcto de una operación entre funciones.
export default function PuzzlePieceGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <PuzzleIcon className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Encaja cada pieza con su pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="PIEZA" />

      <div className="flex items-center justify-center gap-2 mb-4">
        <div
          className="w-16 h-16 border-2 border-dashed border-ink/25 flex items-center justify-center bg-ink/[0.02]"
          style={{ clipPath: selected !== null ? PIECE_CLIP : undefined }}
        >
          {selected !== null && items.kind === 'choice' ? (
            <PuzzleIcon className="w-7 h-7 text-coral" />
          ) : (
            <span className="text-ink/20 text-xs">?</span>
          )}
        </div>
      </div>

      <Prompt text={current.prompt} className="text-center" />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-4">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => checkChoice(i)}
              disabled={!!feedback}
              style={{ clipPath: PIECE_CLIP }}
              className={`px-4 py-5 text-sm font-mono-lab border-2 transition-colors ${
                selected === i ? 'border-coral bg-coral/5' : 'border-ink/15 bg-white hover:bg-ink/[0.02]'
              } ${feedback && i === current.correctIndex ? '!border-teal bg-teal/10' : ''} ${
                feedback && selected === i && i !== current.correctIndex ? '!border-red-400 bg-red-50' : ''
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-coral/30 rounded-none p-4" style={{ clipPath: 'polygon(0% 10%, 5% 10%, 5% 0%, 95% 0%, 95% 10%, 100% 10%, 100% 90%, 95% 90%, 95% 100%, 5% 100%, 5% 90%, 0% 90%)' }}>
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
