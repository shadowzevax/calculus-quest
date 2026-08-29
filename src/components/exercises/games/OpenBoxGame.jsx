import { useState } from 'react'
import { Package, PackageOpen, Gift } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const BOX_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A']

// Misión 2 — Abre la caja: una caja numerada por item; al abrirla se revela la pregunta y las
// opciones aparecen como mini-cajas para escoger (no como una lista de texto plano).
export default function OpenBoxGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [opened, setOpened] = useState(false)

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

  return (
    <div>
      <GameHeader index={index} total={total} label="CAJA" />

      {!opened ? (
        <button
          onClick={() => setOpened(true)}
          className="w-full flex flex-col items-center gap-3 border-2 border-dashed border-gold/40 rounded-2xl py-10 hover:bg-gold/5 transition-colors"
        >
          <Package className="w-12 h-12 text-gold" />
          <span className="text-sm font-mono-lab text-ink/50">Toca para abrir la caja {index + 1}</span>
        </button>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3 text-gold">
            <PackageOpen className="w-5 h-5" />
            <span className="text-xs font-mono-lab uppercase">Caja abierta</span>
          </div>
          <Prompt text={current.prompt} />

          {items.kind === 'choice' ? (
            <div className="grid grid-cols-2 gap-3">
              {current.options.map((opt, i) => {
                const color = BOX_COLORS[i % BOX_COLORS.length]
                const isRight = feedback && i === current.correctIndex
                const isWrongPick = feedback && selected === i && i !== current.correctIndex
                return (
                  <button
                    key={i}
                    onClick={() => checkChoice(i)}
                    disabled={!!feedback}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 p-2 text-center text-xs font-mono-lab transition-transform ${
                      selected === i ? 'scale-95' : 'hover:-translate-y-0.5'
                    } ${isWrongPick ? 'opacity-30' : ''}`}
                    style={{ borderColor: isRight ? '#2A9D8F' : color, backgroundColor: `${color}12` }}
                  >
                    <Package className="w-5 h-5" style={{ color: isRight ? '#2A9D8F' : color }} />
                    <span className="text-ink leading-tight">{opt}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="border-2 border-gold/30 rounded-xl p-4 bg-gold/5">
              <TextAnswer feedback={feedback} onCheck={checkText} />
            </div>
          )}

          <FeedbackBanner feedback={feedback} />
          <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setOpened(false) }} />
        </div>
      )}
    </div>
  )
}
