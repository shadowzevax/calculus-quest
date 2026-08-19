import { useEffect, useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { api } from '@/lib/api'

function fmtTime(seconds) {
  if (!seconds) return '0 min'
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}min`
}

export default function TeacherAnalytics() {
  const [data, setData] = useState(null)

  useEffect(() => { api.analytics.get().then(setData).catch(() => {}) }, [])

  if (!data) return <p className="text-ink/40 font-mono-lab text-sm">Cargando...</p>

  const { students, surveyRows } = data
  const withBoth = students.filter((s) => s.pretest_score != null && s.posttest_score != null)
  const avgPre = withBoth.length ? (withBoth.reduce((a, s) => a + s.pretest_score / s.pretest_total, 0) / withBoth.length) * 100 : null
  const avgPost = withBoth.length ? (withBoth.reduce((a, s) => a + s.posttest_score / s.posttest_total, 0) / withBoth.length) * 100 : null

  // Promedio por pregunta de la encuesta (surveyRows viene como fila por usuario+pregunta).
  const surveyByQuestion = {}
  for (const r of surveyRows) {
    if (r.value == null) continue
    if (!surveyByQuestion[r.order]) surveyByQuestion[r.order] = { text: r.text, sum: 0, count: 0 }
    surveyByQuestion[r.order].sum += r.value
    surveyByQuestion[r.order].count += 1
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">RESULTADOS DE LA INVESTIGACIÓN</div>
          <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blueprint" /> Analítica de estudiantes
          </h1>
          <p className="text-ink/50">Datos reales de uso de la plataforma, actualizados en vivo.</p>
        </div>
        <a
          href={api.analytics.csvUrl}
          className="flex items-center gap-2 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2.5 text-sm font-medium shrink-0"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </a>
      </div>

      {avgPre != null && (
        <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
          <div className="bg-white rounded-xl border border-ink/10 p-5">
            <div className="text-xs font-mono-lab text-ink/40 uppercase">Promedio pre-test</div>
            <div className="text-2xl font-display font-bold text-ink mt-1">{avgPre.toFixed(0)}%</div>
          </div>
          <div className="bg-white rounded-xl border border-ink/10 p-5">
            <div className="text-xs font-mono-lab text-ink/40 uppercase">Promedio post-test</div>
            <div className="text-2xl font-display font-bold text-teal mt-1">{avgPost.toFixed(0)}%</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-ink/10 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-mono-lab text-ink/40 uppercase border-b border-ink/10">
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">XP / Nivel</th>
              <th className="px-4 py-3">Misiones</th>
              <th className="px-4 py-3">Tiempo total</th>
              <th className="px-4 py-3">% aciertos</th>
              <th className="px-4 py-3">Pre-test</th>
              <th className="px-4 py-3">Post-test</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {students.map((s) => {
              const pct = s.exercise_attempts ? Math.round((s.exercise_correct / s.exercise_attempts) * 100) : null
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{s.full_name}</div>
                    <div className="text-xs text-ink/40">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{s.xp} · N{s.level}</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{s.missions_completed}/14</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{fmtTime(s.total_time_seconds)}</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{pct != null ? `${pct}%` : '—'}</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{s.pretest_score != null ? `${s.pretest_score}/${s.pretest_total}` : '—'}</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{s.posttest_score != null ? `${s.posttest_score}/${s.posttest_total}` : '—'}</td>
                </tr>
              )
            })}
            {students.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-ink/35">Aún no hay estudiantes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-display font-semibold text-ink mb-3">Encuesta de percepción — promedio por pregunta (escala 1-5)</h2>
      <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
        {Object.entries(surveyByQuestion).sort(([a], [b]) => a - b).map(([, q], i) => (
          <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-4">
            <p className="text-sm text-ink flex-1">{q.text}</p>
            <span className="text-sm font-mono-lab font-semibold text-coral shrink-0">{(q.sum / q.count).toFixed(1)}/5</span>
          </div>
        ))}
        {Object.keys(surveyByQuestion).length === 0 && (
          <p className="px-5 py-6 text-center text-ink/35 text-sm">Aún no hay respuestas de la encuesta.</p>
        )}
      </div>
    </div>
  )
}
