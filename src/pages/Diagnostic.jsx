import { useEffect, useState } from 'react'
import { ClipboardCheck, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function Diagnostic() {
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const load = () => api.diagnostic.get().then(({ questions, attempts }) => {
    setQuestions(questions)
    setAttempts(attempts)
  }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const pre = attempts.find((a) => a.phase === 'pre')
  const post = attempts.find((a) => a.phase === 'post')
  // Primero se responde el diagnóstico inicial; el final solo se habilita una vez
  // ya se hizo el inicial (para comparar el mismo instrumento antes/después).
  const phase = !pre ? 'pre' : !post ? 'post' : null

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  const submit = async () => {
    setSubmitting(true)
    try {
      const r = await api.diagnostic.submit(phase, answers)
      setResult(r)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-ink/40 font-mono-lab text-sm">Cargando...</p>

  return (
    <div className="max-w-3xl">
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">EVALUACIÓN DIAGNÓSTICA</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <ClipboardCheck className="w-6 h-6 text-blueprint" /> Diagnóstico de funciones
      </h1>
      <p className="text-ink/50 mb-6">
        Este cuestionario se responde dos veces: una vez antes de empezar las misiones y otra vez al terminarlas, para medir qué tanto avanzaste.
      </p>

      {pre && (
        <div className="bg-white rounded-xl border border-ink/10 p-4 mb-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
          <p className="text-sm text-ink">Diagnóstico inicial completado: <b>{pre.score}/{pre.total}</b> aciertos.</p>
        </div>
      )}
      {post && (
        <div className="bg-white rounded-xl border border-ink/10 p-4 mb-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
          <p className="text-sm text-ink">Diagnóstico final completado: <b>{post.score}/{post.total}</b> aciertos.</p>
        </div>
      )}

      {result && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-ink">¡Listo! Obtuviste <b>{result.score}/{result.total}</b> respuestas correctas.</p>
        </div>
      )}

      {!phase && (
        <div className="bg-white rounded-xl border border-ink/10 p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-teal mx-auto mb-2" />
          <p className="text-ink/60 text-sm">Ya respondiste el diagnóstico inicial y el final. ¡Gracias por participar!</p>
        </div>
      )}

      {phase && !result && (
        <div className="space-y-5">
          <div className="bg-blueprint/5 border border-blueprint/20 rounded-xl p-4">
            <p className="text-sm text-ink">
              {phase === 'pre'
                ? 'Este es el diagnóstico inicial — respóndelo con lo que ya sabes, antes de ver las misiones.'
                : 'Este es el diagnóstico final — ya completaste (o avanzaste en) las misiones, responde con lo que aprendiste.'}
            </p>
          </div>
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border border-ink/10 p-5">
              <p className="font-medium text-ink mb-3">{i + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                      answers[q.id] === idx
                        ? 'border-coral bg-coral/10 text-ink'
                        : 'border-ink/10 text-ink/70 hover:border-ink/25'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="w-full bg-coral hover:bg-coral/90 transition-colors text-white rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-40"
          >
            {submitting ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        </div>
      )}
    </div>
  )
}
