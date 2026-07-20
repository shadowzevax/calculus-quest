import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import MiniCurve from '@/components/MiniCurve'
import { MissionsGridSkeleton } from '@/components/Skeleton'

const difficultyStyle = {
  facil: 'bg-teal/10 text-teal',
  intermedio: 'bg-gold/15 text-gold',
  dificil: 'bg-coral/10 text-coral',
  experto: 'bg-blueprint/10 text-blueprint',
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

  if (error) return <p className="text-red-500 text-sm">Error: {error}</p>

  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">CATÁLOGO DE MISIONES</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1">Misiones</h1>
      <p className="text-ink/50 mb-8">
        {isAdmin ? 'Tienes acceso completo a todas las misiones.' : 'Completa las misiones en orden para avanzar.'}
      </p>
      {loading ? <MissionsGridSkeleton /> : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {missions.map((m) => {
          const Icon = Icons[m.icon] || Icons.BookOpen
          const p = progress.find((pr) => pr.mission_id === m.id)
          const pct = isAdmin ? 100 : Math.min(100, Number(p?.progress_percentage || 0))
          const locked = !isAdmin && m.order > 1 && !progress.some(
            (pr) => pr.mission_id !== m.id && pr.progress_percentage >= 100
          )

          return (
            <div
              key={m.id}
              className={`relative bg-white rounded-xl border border-ink/10 flex flex-col overflow-hidden transition-all ${
                locked ? 'opacity-60' : 'hover:border-coral/40 hover:-translate-y-0.5'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-2 flex justify-around px-4">
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-paper border border-ink/10 -translate-y-1/2" />
                ))}
              </div>

              <div className="p-5 pt-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: m.color || '#1B3A5C' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <MiniCurve seed={m.id} width={72} height={30} stroke={m.color || '#FF6B4A'} animate={false} />
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[11px] font-mono-lab px-2 py-0.5 rounded uppercase ${difficultyStyle[m.difficulty] || 'bg-ink/5 text-ink/50'}`}>
                    {m.difficulty}
                  </span>
                  <span className="text-[11px] font-mono-lab text-ink/35">{m.estimated_time} min</span>
                </div>
                <h2 className="font-display font-semibold text-ink">{m.title}</h2>
                <p className="text-sm text-ink/50 mt-1 flex-1">{m.description}</p>

                <div className="mt-3 flex items-center justify-between text-xs font-mono-lab">
                  <span className="text-coral">+{m.xp_reward} XP</span>
                  {!isAdmin && pct > 0 && <span className="text-ink/40">{pct.toFixed(0)}%</span>}
                </div>
                {!isAdmin && pct > 0 && (
                  <div className="w-full h-1.5 bg-ink/5 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-coral to-gold" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <button
                  disabled={locked}
                  onClick={() => navigate(`/missions/${m.id}`)}
                  className="mt-4 w-full rounded-lg py-2.5 text-sm font-medium transition-colors disabled:bg-ink/5 disabled:text-ink/30 bg-blueprint hover:bg-coral text-white"
                >
                  {locked ? 'Bloqueada' : pct >= 100 ? 'Revisar' : pct > 0 ? 'Continuar' : 'Comenzar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
