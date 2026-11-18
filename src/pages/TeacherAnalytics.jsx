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
  // Antes el denominador de "Misiones" era un 14 fijo en el JSX; se trae el total real de
  // misiones activas del módulo 'misiones' (mismo endpoint que ya usa MissionManagement) para
  // que la fracción no quede mal si algún día se activan/desactivan misiones.
  const [totalMissions, setTotalMissions] = useState(null)

  useEffect(() => {
    api.analytics.get().then(setData).catch(() => {})
    api.missions.list('misiones').then((ms) => setTotalMissions(ms.length)).catch(() => {})
  }, [])

  if (!data) return <p className="text-ink/40 font-mono-lab text-sm">Cargando...</p>

  const { students, missionDifficulty = [] } = data

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

      <div className="bg-white rounded-xl border border-ink/10 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-mono-lab text-ink/40 uppercase border-b border-ink/10">
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">XP / Nivel</th>
              <th className="px-4 py-3">Misiones</th>
              <th className="px-4 py-3">Tiempo total</th>
              <th className="px-4 py-3">% aciertos</th>
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
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{s.missions_completed}/{totalMissions ?? '—'}</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{fmtTime(s.total_time_seconds)}</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{pct != null ? `${pct}%` : '—'}</td>
                </tr>
              )
            })}
            {students.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-ink/35">Aún no hay estudiantes registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="font-display font-semibold text-ink mb-3">Dificultad por misión</h2>
      <p className="text-xs text-ink/40 mb-3 max-w-2xl">
        Qué tan seguido se acierta a la primera en cada misión, sobre todos los intentos
        registrados (incluye reintentos). Útil para ver de un vistazo dónde le está costando
        más al curso, sin tener que revisar estudiante por estudiante.
      </p>
      <div className="bg-white rounded-xl border border-ink/10 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-mono-lab text-ink/40 uppercase border-b border-ink/10">
              <th className="px-4 py-3">Misión</th>
              <th className="px-4 py-3">Intentos registrados</th>
              <th className="px-4 py-3">% de acierto</th>
              <th className="px-4 py-3">Tiempo promedio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {missionDifficulty.map((m) => {
              const pct = m.attempts ? Math.round((m.correct / m.attempts) * 100) : null
              return (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-ink">{m.title}</td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{m.attempts}</td>
                  <td className="px-4 py-3 font-mono-lab">
                    <span className={pct != null && pct < 50 ? 'text-[#B91C1C] font-semibold' : 'text-ink/70'}>
                      {pct != null ? `${pct}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono-lab text-ink/70">{m.avg_time_seconds ? fmtTime(m.avg_time_seconds) : '—'}</td>
                </tr>
              )
            })}
            {missionDifficulty.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-ink/35">Aún no hay intentos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
