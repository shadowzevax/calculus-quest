import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { api } from '@/lib/api'

export default function TeacherPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    api.stats.get().then(setStats).catch(() => {})
    api.users.list().then(setUsers).catch(() => {})
  }, [])

  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">ADMINISTRACIÓN</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blueprint" /> Panel Docente
      </h1>
      <p className="text-ink/50 mb-6">Seguimiento del progreso de tus estudiantes.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <div className="text-xs font-mono-lab text-ink/40 uppercase">Total Estudiantes</div>
          <div className="text-2xl font-display font-bold text-ink">{stats?.totalStudents ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <div className="text-xs font-mono-lab text-ink/40 uppercase">Estudiantes Activos</div>
          <div className="text-2xl font-display font-bold text-ink">{stats?.activeStudents ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl border border-ink/10 p-4">
          <div className="text-xs font-mono-lab text-ink/40 uppercase">Total Misiones</div>
          <div className="text-2xl font-display font-bold text-ink">{stats?.totalMissions ?? '—'}</div>
        </div>
      </div>

      <h2 className="font-display font-semibold text-ink mb-3">Estudiantes</h2>
      <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
        {users.filter((u) => u.role === 'user').map((u) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="font-medium text-ink">{u.full_name}</div>
              <div className="text-xs text-ink/40">{u.email}</div>
            </div>
            <div className="text-sm font-mono-lab text-ink/50">{u.xp} XP · Nivel {u.level}</div>
          </div>
        ))}
        {users.filter((u) => u.role === 'user').length === 0 && (
          <p className="p-5 text-ink/35 text-sm">Aún no hay estudiantes registrados.</p>
        )}
      </div>
    </div>
  )
}
