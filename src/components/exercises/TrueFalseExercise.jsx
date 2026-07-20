import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function TrueFalseExercise({ exercise, onComplete }) {
  const statements = exercise.metadata?.statements || []
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  if (statements.length === 0) {
    return <p className="text-red-500 text-sm">Este ejercicio no tiene enunciados configurados.</p>
  }

  const s = statements[index]

  const check = (value) => {
    if (feedback) return
    setSelected(value)
    const isCorrect = value === s.answer
    if (isCorrect) setCorrectCount((c) => c + 1)
    setFeedback({ isCorrect, explanation: s.explanation })
  }

  const next = () => {
    setSelected(null)
    setFeedback(null)
    if (index < statements.length - 1) {
      setIndex(index + 1)
    } else {
      onComplete({ isCorrect: correctCount / statements.length >= 0.6 })
    }
  }

  return (
    <div>
      <p className="text-xs font-mono-lab text-ink/35 mb-2">ENUNCIADO {index + 1} / {statements.length}</p>
      <p className="font-display font-medium text-ink mb-4" dangerouslySetInnerHTML={{ __html: s.statement }} />

      <div className="flex gap-3">
        <button
          onClick={() => check(true)}
          disabled={!!feedback}
          className={`flex-1 border rounded-lg py-3 text-sm font-medium transition-colors ${
            selected === true ? 'border-coral bg-coral/5' : 'border-ink/10'
          } ${feedback && s.answer === true ? 'border-teal bg-teal/10' : ''}`}
        >
          Verdadero
        </button>
        <button
          onClick={() => check(false)}
          disabled={!!feedback}
          className={`flex-1 border rounded-lg py-3 text-sm font-medium transition-colors ${
            selected === false ? 'border-coral bg-coral/5' : 'border-ink/10'
          } ${feedback && s.answer === false ? 'border-teal bg-teal/10' : ''}`}
        >
          Falso
        </button>
      </div>

      {feedback && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 ${feedback.isCorrect ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'}`}>
          {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{feedback.isCorrect ? '¡Correcto!' : 'Buen intento.'} {feedback.explanation}</span>
        </div>
      )}

      {feedback && (
        <button onClick={next} className="mt-4 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
          {index < statements.length - 1 ? 'Siguiente enunciado' : 'Finalizar'}
        </button>
      )}
    </div>
  )
}
