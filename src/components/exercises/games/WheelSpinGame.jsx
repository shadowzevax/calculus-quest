import { useState } from 'react'
import { Disc3 } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const WEDGE_COLORS = ['#F0A93C', '#457B9D', '#3FBFAD', '#FF6B4A']

// Misión 10 — Rueda del azar: gira la ruleta antes de cada límite; las opciones se muestran
// como gajos de la propia ruleta, no como una lista — refuerza la variedad de técnicas.
export default function WheelSpinGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [spun, setSpun] = useState(false)
  const [spinning, setSpinning] = useState(false)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-gold">
          <Disc3 className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Gira y conecta cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const spin = () => {
    setSpinning(true)
    setTimeout(() => { setSpinning(false); setSpun(true) }, 700)
  }

  if (!spun) {
    return (
      <div className="text-center py-6">
        <GameHeader index={index} total={total} label="TURNO" />
        <Disc3
          className={`w-20 h-20 mx-auto text-gold transition-transform ${spinning ? 'duration-700 rotate-[900deg]' : 'duration-300'}`}
        />
        <button
          onClick={spin}
          disabled={spinning}
          className="mt-6 bg-gold hover:bg-coral transition-colors text-white rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {spinning ? 'Girando...' : 'Girar la ruleta'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="TURNO" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-0 rounded-full overflow-hidden border-4 border-ink/10 max-w-sm mx-auto">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => checkChoice(i)}
                disabled={!!feedback}
                className={`flex items-center justify-center text-center text-white text-xs font-mono-lab px-3 py-8 transition-opacity ${isWrongPick ? 'opacity-30' : ''}`}
                style={{ backgroundColor: isRight ? '#2A9D8F' : WEDGE_COLORS[i % WEDGE_COLORS.length] }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="border-4 border-gold/25 rounded-2xl p-4 bg-gold/5">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={() => { next(); setSpun(false) }} />
    </div>
  )
}
