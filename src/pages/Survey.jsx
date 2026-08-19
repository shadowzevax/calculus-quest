import { useEffect, useState } from 'react'
import { MessagesSquare, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'

const LIKERT = [
  { value: 1, label: 'Muy en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Muy de acuerdo' },
]

export default function Survey() {
  const [questions, setQuestions] = useState([])
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api.survey.get().then(({ questions, response }) => {
      setQuestions(questions)
      setExisting(response)
      if (response) { setAnswers(response.answers); setComment(response.comment || '') }
    }).finally(() => setLoading(false))
  }, [])

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  const submit = async () => {
    setSubmitting(true)
    try {
      await api.survey.submit(answers, comment)
      setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-ink/40 font-mono-lab text-sm">Cargando...</p>

  return (
    <div className="max-w-3xl">
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">TU OPINIÓN</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <MessagesSquare className="w-6 h-6 text-blueprint" /> Encuesta de experiencia
      </h1>
      <p className="text-ink/50 mb-6">Cuéntanos qué te pareció aprender funciones con FuncionLab. Tus respuestas son anónimas para el análisis de la investigación.</p>

      {(done || existing) && (
        <div className="bg-white rounded-xl border border-ink/10 p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
          <p className="text-sm text-ink">Ya respondiste esta encuesta. Puedes actualizar tus respuestas y volver a enviarlas si quieres cambiar algo.</p>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl border border-ink/10 p-5">
            <p className="font-medium text-ink mb-3">{i + 1}. {q.text}</p>
            <div className="grid grid-cols-5 gap-2">
              {LIKERT.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.value }))}
                  className={`py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    answers[q.id] === opt.value
                      ? 'border-coral bg-coral/10 text-ink'
                      : 'border-ink/10 text-ink/50 hover:border-ink/25'
                  }`}
                >
                  {opt.value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-ink/35 mt-1.5 font-mono-lab">
              <span>Muy en desacuerdo</span>
              <span>Muy de acuerdo</span>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-xl border border-ink/10 p-5">
          <label className="text-sm font-medium text-ink">¿Algo más que quieras contarnos? (opcional)</label>
          <textarea
            className="w-full border border-ink/15 rounded-lg px-3 py-2 mt-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={!allAnswered || submitting}
          className="w-full bg-coral hover:bg-coral/90 transition-colors text-white rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-40"
        >
          {submitting ? 'Enviando...' : existing ? 'Actualizar respuestas' : 'Enviar respuestas'}
        </button>
      </div>
    </div>
  )
}
