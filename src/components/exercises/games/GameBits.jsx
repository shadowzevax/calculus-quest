import { useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import MathText from '@/lib/mathText'
import SymbolToolbar from '@/components/SymbolToolbar'

// Cabecera comun: numero de item actual + XP del ejercicio, igual en los 13 juegos.
export function GameHeader({ index, total, label }) {
  return <p className="text-xs font-mono-lab text-ink/35 mb-3">{label} {index + 1} / {total}</p>
}

export function FeedbackBanner({ feedback }) {
  if (!feedback) return null
  return (
    <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 ${feedback.isCorrect ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'}`}>
      {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
      <span>{feedback.isCorrect ? '¡Correcto!' : 'Buen intento.'} {feedback.explanation}</span>
    </div>
  )
}

export function NextButton({ feedback, index, total, onNext }) {
  if (!feedback) return null
  return (
    <button onClick={onNext} className="mt-4 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
      {index < total - 1 ? 'Siguiente' : 'Finalizar'}
    </button>
  )
}

// Entrada de texto compartida por los juegos que envuelven ejercicios de tipo fill_blank.
export function TextAnswer({ feedback, onCheck }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  return (
    <div>
      <SymbolToolbar inputRef={inputRef} value={value} onChange={setValue} />
      <div className="flex gap-2 mt-1">
        <input
          ref={inputRef}
          className="flex-1 border border-ink/15 rounded-lg px-3 py-2.5 text-sm font-mono-lab focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
          placeholder="Escribe tu respuesta"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!!feedback}
        />
        {!feedback && (
          <button
            onClick={() => onCheck(value)}
            disabled={!value.trim()}
            className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30 shrink-0"
          >
            Verificar
          </button>
        )}
      </div>
    </div>
  )
}

export function Prompt({ text, className = '' }) {
  return <p className={`font-display font-medium text-ink mb-4 ${className}`}><MathText text={text} /></p>
}

export { MathText }
