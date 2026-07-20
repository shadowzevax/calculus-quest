import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
    </div>
  )
}

function MissionPreviewCard({ mission }) {
  const Icon = Icons[mission.icon] || Icons.BookOpen
  return (
    <Link to="/missions" className="block bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-white"
        style={{ backgroundColor: mission.color || '#457B9D' }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-semibold text-slate-800">{mission.title}</div>
      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
        {mission.difficulty}
      </span>
      <p className="text-sm text-slate-500 mt-2">{mission.description}</p>
    </Link>
  )
}

export default function Dashboard() {
  const { user, isLoadingAuth } = useAuth()
  const [missions, setMissions] = useState([])
  const [stats, setStats] = useState(null)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    api.missions.list('misiones').then(setMissions).catch(() => {})
  }, [])

  useEffect(() => {
    if (isAdmin) api.stats.get().then(setStats).catch(() => {})
  }, [isAdmin])

  if (isLoadingAuth) return <p className="text-slate-500">Cargando...</p>

  if (isAdmin) {
    return (
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#457B9D] to-[#F4A261] bg-clip-text text-transparent">
          ¡Bienvenido, Docente!
        </h1>
        <p className="text-slate-500 mt-1">Panel de control y seguimiento del Laboratorio de Cálculo</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard label="Total Estudiantes" value={stats?.totalStudents ?? '—'} color="bg-blue-50" icon={Icons.Users} />
          <StatCard label="Estudiantes Activos" value={stats?.activeStudents ?? '—'} color="bg-green-50" icon={Icons.TrendingUp} />
          <StatCard label="Total Misiones" value={stats?.totalMissions ?? '—'} color="bg-purple-50" icon={Icons.BookOpen} />
          <StatCard label="Acceso Completo" value="100%" color="bg-amber-50" icon={Icons.Shield} />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Icons.Rocket className="w-4 h-4" /> Misiones del Sistema
            </h2>
            <Link to="/missions" className="text-sm text-[#457B9D]">Ver todas</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {missions.slice(0, 3).map((m) => <MissionPreviewCard key={m.id} mission={m} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Bienvenido a Calculus Quest</h1>
      {user ? (
        <p className="text-slate-500 mt-2">
          Hola {user.full_name}, tienes {user.xp} XP y estás en nivel {user.level}.
        </p>
      ) : (
        <p className="text-slate-500 mt-2">Inicia sesión para empezar tu progreso.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {missions.slice(0, 3).map((m) => <MissionPreviewCard key={m.id} mission={m} />)}
      </div>
    </div>
  )
}
