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
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Panel Docente</h1>
      <p className="text-slate-500 mb-6">Seguimiento del progreso de tus estudiantes.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-slate-500">Total Estudiantes</div>
          <div className="text-2xl font-bold">{stats?.totalStudents ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-slate-500">Estudiantes Activos</div>
          <div className="text-2xl font-bold">{stats?.activeStudents ?? '—'}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-slate-500">Total Misiones</div>
          <div className="text-2xl font-bold">{stats?.totalMissions ?? '—'}</div>
        </div>
      </div>

      <h2 className="font-semibold text-slate-800 mb-3">Estudiantes</h2>
      <div className="bg-white rounded-xl border divide-y">
        {users.filter((u) => u.role === 'user').map((u) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="font-medium text-slate-800">{u.full_name}</div>
              <div className="text-xs text-slate-400">{u.email}</div>
            </div>
            <div className="text-sm text-slate-500">{u.xp} XP · Nivel {u.level}</div>
          </div>
        ))}
        {users.filter((u) => u.role === 'user').length === 0 && (
          <p className="p-5 text-slate-400 text-sm">Aún no hay estudiantes registrados.</p>
        )}
      </div>
    </div>
  )
}
