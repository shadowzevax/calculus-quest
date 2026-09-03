import { useState } from 'react'
import { Package, PackageOpen, Gift, CheckCircle2, XCircle } from 'lucide-react'
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
            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
              {current.options.map((opt, i) => {
                const color = BOX_COLORS[i % BOX_COLORS.length]
                const isRight = feedback && i === current.correctIndex
                const isPicked = selected === i
                const isWrongPick = feedback && isPicked && i !== current.correctIndex
                return (
                  <button
                    key={i}
                    onClick={() => checkChoice(i)}
                    disabled={!!feedback}
                    className={`relative rounded-xl border-2 flex flex-col items-center justify-center gap-2 px-4 py-6 min-h-[6.5rem] text-center text-sm font-mono-lab transition-all ${
                      isPicked ? 'scale-95' : 'hover:-translate-y-0.5'
                    } ${feedback && !isRight && !isPicked ? 'opacity-40' : ''}`}
                    style={{ borderColor: isRight ? '#2A9D8F' : isWrongPick ? '#E76F51' : color, backgroundColor: `${isRight ? '#2A9D8F' : isWrongPick ? '#E76F51' : color}12` }}
                  >
                    {feedback && (isPicked || isRight) && (
                      <span className="absolute -top-2.5 -right-2.5 rounded-full bg-white shadow">
                        {isRight ? <CheckCircle2 className="w-5 h-5 text-teal" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      </span>
                    )}
                    <Package className="w-6 h-6" style={{ color: isRight ? '#2A9D8F' : isWrongPick ? '#E76F51' : color }} />
                    <span className="text-ink leading-snug">{opt}</span>
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
