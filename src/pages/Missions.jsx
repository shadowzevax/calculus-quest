import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'

const difficultyColor = {
  facil: 'bg-green-100 text-green-700',
  intermedio: 'bg-amber-100 text-amber-700',
  dificil: 'bg-red-100 text-red-700',
  experto: 'bg-purple-100 text-purple-700',
}

export default function Missions() {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.missions.list('misiones'),
      user ? api.progress.list().catch(() => []) : Promise.resolve([]),
    ])
      .then(([m, p]) => { setMissions(m); setProgress(p) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <p className="text-slate-500">Cargando misiones...</p>
  if (error) return <p className="text-red-500">Error: {error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Misiones</h1>
      <p className="text-slate-500 mb-6">
        {isAdmin ? 'Tienes acceso completo a todas las misiones.' : 'Completa las misiones en orden para avanzar.'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {missions.map((m) => {
          const Icon = Icons[m.icon] || Icons.BookOpen
          const p = progress.find((pr) => pr.mission_id === m.id)
          const pct = isAdmin ? 100 : Math.min(100, Number(p?.progress_percentage || 0))
          const locked = !isAdmin && m.order > 1 && !progress.some(
            (pr) => pr.mission_id !== m.id && pr.progress_percentage >= 100
          )

          return (
            <div key={m.id} className="bg-white rounded-xl p-5 shadow-sm border flex flex-col">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-3 text-white"
                style={{ backgroundColor: m.color || '#457B9D' }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${difficultyColor[m.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                  {m.difficulty}
                </span>
                <span className="text-xs text-slate-400">{m.estimated_time} min</span>
              </div>
              <h2 className="font-semibold text-slate-800">{m.title}</h2>
              <p className="text-sm text-slate-500 mt-1 flex-1">{m.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>+{m.xp_reward} XP</span>
                {!isAdmin && pct > 0 && <span>{pct.toFixed(0)}%</span>}
              </div>
              {!isAdmin && pct > 0 && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-[#457B9D]" style={{ width: `${pct}%` }} />
                </div>
              )}
              <button
                disabled={locked}
                onClick={() => navigate(`/missions/${m.id}`)}
                className="mt-4 w-full rounded-lg py-2 text-sm font-medium disabled:bg-slate-100 disabled:text-slate-400 bg-[#457B9D] text-white"
              >
                {locked ? 'Bloqueada' : pct >= 100 ? 'Revisar' : pct > 0 ? 'Continuar' : 'Comenzar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
