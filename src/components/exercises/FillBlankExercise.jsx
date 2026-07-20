import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

function normalize(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, '')
}

export default function FillBlankExercise({ exercise, onComplete }) {
  const problems = exercise.metadata?.problems || []
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  if (problems.length === 0) {
    return <p className="text-red-500 text-sm">Este ejercicio no tiene problemas configurados.</p>
  }

  const p = problems[index]

  const check = () => {
    if (!value.trim()) return
    const accepted = Array.isArray(p.accepted_answers) ? p.accepted_answers : [p.answer]
    let isCorrect = accepted.some((a) => normalize(a) === normalize(value))
    if (!isCorrect && p.tolerance !== undefined) {
      const num = parseFloat(value.replace(',', '.'))
      const target = parseFloat(p.answer)
      if (!isNaN(num) && !isNaN(target) && Math.abs(num - target) <= p.tolerance) isCorrect = true
    }
    if (isCorrect) setCorrectCount((c) => c + 1)
    setFeedback({ isCorrect, explanation: p.explanation })
  }

  const next = () => {
    setValue('')
    setFeedback(null)
    if (index < problems.length - 1) {
      setIndex(index + 1)
    } else {
      onComplete({ isCorrect: correctCount / problems.length >= 0.6 })
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-2">Problema {index + 1} de {problems.length}</p>
      <p className="font-medium text-slate-800 mb-4" dangerouslySetInnerHTML={{ __html: p.question }} />
      <input
        className="w-full border rounded-lg px-3 py-2 text-sm"
        placeholder="Escribe tu respuesta"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!!feedback}
      />

      {feedback && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 ${feedback.isCorrect ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{feedback.isCorrect ? '¡Correcto!' : 'Buen intento.'} {feedback.explanation}</span>
        </div>
      )}

      <div className="mt-4">
        {!feedback ? (
          <button onClick={check} disabled={!value.trim()} className="bg-[#457B9D] text-white rounded px-4 py-2 text-sm disabled:opacity-40">
            Verificar
          </button>
        ) : (
          <button onClick={next} className="bg-[#457B9D] text-white rounded px-4 py-2 text-sm">
            {index < problems.length - 1 ? 'Siguiente problema' : 'Finalizar'}
          </button>
        )}
      </div>
    </div>
  )
}
