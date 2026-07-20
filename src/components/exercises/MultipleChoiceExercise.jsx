import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function MultipleChoiceExercise({ exercise, onComplete }) {
  const questions = exercise.metadata?.questions || []
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  if (questions.length === 0) {
    return <p className="text-red-500 text-sm">Este ejercicio no tiene preguntas configuradas.</p>
  }

  const q = questions[index]

  const check = () => {
    if (selected === null) return
    const isCorrect = selected === q.correct_index
    if (isCorrect) setCorrectCount((c) => c + 1)
    setFeedback({ isCorrect, explanation: q.explanation })
  }

  const next = () => {
    setSelected(null)
    setFeedback(null)
    if (index < questions.length - 1) {
      setIndex(index + 1)
    } else {
      onComplete({ isCorrect: correctCount / questions.length >= 0.6 })
    }
  }

  return (
    <div>
      <p className="text-xs font-mono-lab text-ink/35 mb-2">PREGUNTA {index + 1} / {questions.length}</p>
      <p className="font-display font-medium text-ink mb-4" dangerouslySetInnerHTML={{ __html: q.question }} />
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !feedback && setSelected(i)}
            disabled={!!feedback}
            className={`w-full text-left border rounded-lg px-4 py-2.5 text-sm font-mono-lab transition-colors ${
              selected === i ? 'border-coral bg-coral/5' : 'border-ink/10'
            } ${feedback && i === q.correct_index ? 'border-teal bg-teal/10' : ''} ${
              feedback && selected === i && i !== q.correct_index ? 'border-red-400 bg-red-50' : ''
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 ${feedback.isCorrect ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'}`}>
          {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{feedback.isCorrect ? '¡Correcto!' : 'Buen intento.'} {feedback.explanation}</span>
        </div>
      )}

      <div className="mt-4">
        {!feedback ? (
          <button onClick={check} disabled={selected === null} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30">
            Verificar
          </button>
        ) : (
          <button onClick={next} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
            {index < questions.length - 1 ? 'Siguiente pregunta' : 'Finalizar'}
          </button>
        )}
      </div>
    </div>
  )
}
