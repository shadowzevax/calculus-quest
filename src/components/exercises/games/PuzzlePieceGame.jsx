import { PuzzleIcon } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Silueta real de pieza de rompecabezas (con tab curvo en la derecha y hueco curvo abajo,
// hecha con curvas bezier via SVG clipPath — mucho mas fiel que un clip-path de polígono).
function PuzzleDefs() {
  return (
    <svg width="0" height="0" className="absolute">
      <defs>
        <clipPath id="puzzleTab" clipPathUnits="objectBoundingBox">
          <path d="M0,0 L1,0 L1,0.36 C1.14,0.36 1.14,0.64 1,0.64 L1,1 L0.64,1 C0.64,0.86 0.36,0.86 0.36,1 L0,1 Z" />
        </clipPath>
      </defs>
    </svg>
  )
}

// Misión 7 — Encajar piezas: cada opción es una pieza de rompecabezas real que se "encaja" en
// el espacio vacío — encaja con hallar el resultado correcto de una operación entre funciones.
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
      <PuzzleDefs />
      <GameHeader index={index} total={total} label="PIEZA" />

      <div className="flex items-center justify-center mb-6 mr-3">
        <div
          className="w-16 h-16 border-2 border-dashed border-ink/25 flex items-center justify-center bg-ink/[0.02]"
          style={{ clipPath: selected !== null ? 'url(#puzzleTab)' : undefined }}
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
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 mr-3 mb-3">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                style={{ clipPath: 'url(#puzzleTab)', filter: 'drop-shadow(0 2px 3px rgba(27,58,92,0.15))' }}
                className={`px-5 py-6 pr-8 pb-8 text-sm font-mono-lab border-2 transition-colors ${
                  selected === i ? 'border-coral bg-coral/5' : 'border-ink/15 bg-white hover:bg-ink/[0.02]'
                } ${isRight ? '!border-teal bg-teal/10' : ''} ${isWrongPick ? '!border-red-400 bg-red-50' : ''}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-coral/30 p-4 pr-6 pb-6 mr-2"
          style={{ clipPath: 'url(#puzzleTab)' }}
        >
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}
