import { useState } from 'react'
import { Cog, ArrowRight, CircleDot } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, Prompt, MathText } from './GameBits'

// Detecta que "maquinas" (nombres de funcion de una letra: f, g, h...) menciona el enunciado,
// para dibujar esa cantidad de engranajes en la cadena — puramente decorativo/tematico, no
// cambia la logica de la respuesta.
function detectStages(prompt) {
  const found = [...new Set((String(prompt).match(/\b([a-z])(?=\s*\()/g) || []).map((s) => s.trim()))]
  return (found.length ? found : ['f']).slice(0, 3)
}

// Misión 3 — Calculadora en cadena: el valor de entrada "viaja" por una serie de máquinas
// (una por cada función mencionada, ej. f(x) → g(f(x))) hasta llegar a la salida, donde hay
// que dar el resultado numérico — encaja con evaluar y componer funciones paso a paso.
export default function ChainCalculatorGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [running, setRunning] = useState(false)
  const [pendingIndex, setPendingIndex] = useState(null)
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

  const stages = detectStages(current.prompt)

  const runChoice = (i) => {
    if (feedback || running) return
    setPendingIndex(i)
    setRunning(true)
    setTimeout(() => { checkChoice(i); setRunning(false) }, 650)
  }

  const runText = (value) => {
    if (feedback || running || !value.trim()) return
    setRunning(true)
    setTimeout(() => { checkText(value); setRunning(false) }, 650)
  }

  const nextItem = () => { next(); setPendingIndex(null) }

  return (
    <div>
      <GameHeader index={index} total={total} label="CADENA" />
      <Prompt text={current.prompt} />

      {/* la cadena de maquinas */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto py-2">
        <div className="w-9 h-9 rounded-full bg-ink/5 border-2 border-ink/15 flex items-center justify-center text-xs font-mono-lab font-bold text-ink/50 shrink-0">
          x
        </div>
        {stages.map((s, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <div className="relative w-14 h-1">
              <div className="absolute inset-0 bg-ink/10 rounded-full" />
              <div
                className={`absolute inset-y-0 left-0 bg-coral rounded-full transition-all ${running ? 'w-full duration-500' : 'w-0'}`}
                style={{ transitionDelay: `${i * 120}ms` }}
              />
            </div>
            <div className="w-11 h-11 rounded-xl bg-blueprint/10 border-2 border-blueprint/30 flex flex-col items-center justify-center shrink-0">
              <Cog className={`w-4 h-4 text-blueprint ${running ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-mono-lab font-bold text-blueprint leading-none mt-0.5">{s}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1 shrink-0">
          <div className="relative w-10 h-1">
            <div className="absolute inset-0 bg-ink/10 rounded-full" />
            <div
              className={`absolute inset-y-0 left-0 bg-coral rounded-full transition-all ${running ? 'w-full duration-500' : 'w-0'}`}
              style={{ transitionDelay: `${stages.length * 120}ms` }}
            />
          </div>
          <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            feedback ? (feedback.isCorrect ? 'border-teal bg-teal/10' : 'border-red-400 bg-red-50') : 'border-gold/40 bg-gold/5'
          }`}>
            <CircleDot className={`w-4 h-4 ${feedback ? (feedback.isCorrect ? 'text-teal' : 'text-red-500') : 'text-gold'}`} />
          </div>
        </div>
      </div>

      {items.kind === 'choice' ? (
        <div className="grid grid-cols-2 gap-3">
          {current.options.map((opt, i) => {
            const isRight = feedback && i === current.correctIndex
            const isWrongPick = feedback && selected === i && i !== current.correctIndex
            return (
              <button
                key={i}
                onClick={() => runChoice(i)}
                disabled={!!feedback || running}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-mono-lab font-semibold transition-all ${
                  pendingIndex === i && running ? 'scale-95 border-coral bg-coral/5' : 'border-ink/10'
                } ${isRight ? '!border-teal bg-teal/10 text-teal' : ''} ${isWrongPick ? '!border-red-400 bg-red-50 text-red-500' : ''}`}
              >
                <MathText text={opt} />
              </button>
            )
          })}
        </div>
      ) : (
        <ChainTextInput feedback={feedback} running={running} onCheck={runText} />
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}

function ChainTextInput({ feedback, running, onCheck }) {
  const [value, setValue] = useState('')
  return (
    <div className="flex gap-2">
      <input
        className="flex-1 border border-ink/15 rounded-lg px-3 py-2.5 text-sm font-mono-lab focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
        placeholder="Resultado final"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!!feedback || running}
      />
      {!feedback && (
        <button
          onClick={() => onCheck(value)}
          disabled={!value.trim() || running}
          className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30 shrink-0 flex items-center gap-1.5"
        >
          {running ? 'Procesando...' : 'Enviar'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
