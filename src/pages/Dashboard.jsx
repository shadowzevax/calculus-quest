import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import MiniCurve from '@/components/MiniCurve'
import { SkeletonBlock, MissionCardSkeleton } from '@/components/Skeleton'
import { AvatarCircle } from '@/components/ui/avatar-circle'

const XP_PER_LEVEL = 500

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-5 relative overflow-hidden">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3`} style={{ backgroundColor: `${accent}1A` }}>
        <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
      </div>
      <div className="text-xs font-mono-lab text-ink/40 tracking-wide uppercase">{label}</div>
      <div className="text-2xl font-display font-semibold text-ink mt-0.5">{value}</div>
    </div>
  )
}

function MissionPreviewCard({ mission }) {
  const Icon = Icons[mission.icon] || Icons.BookOpen
  return (
    <Link to={`/missions/${mission.id}`} className="block bg-white rounded-xl p-5 border border-ink/10 hover:border-coral/40 hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: mission.color || '#1B3A5C' }}>
          <Icon className="w-5 h-5" />
        </div>
        <MiniCurve seed={mission.id} width={64} height={28} stroke={mission.color || '#FF6B4A'} animate={false} />
      </div>
      <div className="font-display font-semibold text-ink">{mission.title}</div>
      <span className="inline-block mt-2 text-[11px] font-mono-lab px-2 py-0.5 rounded bg-ink/5 text-ink/50 uppercase">
        {mission.difficulty}
      </span>
    </Link>
  )
}

// Columna lateral del estudiante: avatar grande arriba, ranking en su propia caja,
// insignias equipadas abajo — pensada para llenar el espacio vertical libre junto a
// las misiones, no solo una tarjetita chica de una línea.
function ProfileSidebar({ user, badges, ranking }) {
  const equippedBadges = badges
    .filter((b) => b.equipped)
    .sort((a, b) => new Date(a.equipped_at) - new Date(b.equipped_at))
  const position = ranking.findIndex((r) => r.id === user.id)
  const total = ranking.length

  return (
    <div className="bg-white rounded-xl border border-ink/10 p-6 flex flex-col h-full">
      <Link to="/profile" className="flex flex-col items-center text-center group">
        <AvatarCircle
          name={user.full_name}
          image={user.avatar}
          avatarConfig={user.avatar_config}
          glow={user.avatar_glow}
          className="w-24 h-24 bg-coral/15 border-2 border-coral/30 group-hover:border-coral/60 transition-colors"
          textClassName="text-4xl font-display font-semibold text-coral"
        />
        <div className={`font-display font-semibold text-lg mt-3 ${user.name_rainbow ? 'name-rainbow' : 'text-ink'}`}>
          {user.full_name}
        </div>
        <div className="text-xs font-mono-lab text-ink/40">{user.xp} XP · Nivel {user.level}</div>
      </Link>

      <div className="mt-5 bg-gold/10 border border-gold/25 rounded-lg p-3.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
          <Icons.Trophy className="w-4.5 h-4.5 text-gold" />
        </div>
        <div>
          <div className="text-[11px] font-mono-lab text-ink/40 uppercase tracking-wide">Ranking</div>
          <div className="text-sm font-semibold text-ink">
            {position >= 0 ? `#${position + 1}${total ? ` de ${total}` : ''}` : 'Aún sin puntaje'}
          </div>
        </div>
        <Link to="/ranking" className="ml-auto text-[11px] font-mono-lab text-gold hover:underline shrink-0">Ver →</Link>
      </div>

      <div className="mt-5 flex-1 flex flex-col min-h-0">
        <div className="text-[11px] font-mono-lab text-ink/40 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Icons.Medal className="w-3.5 h-3.5 text-coral" /> Insignias equipadas
        </div>
        {equippedBadges.length > 0 ? (
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(3.25rem, 1fr))' }}>
            {equippedBadges.map((b) => (
              <div key={b.id} className="aspect-square rounded-full overflow-hidden bg-ink/5 ring-2 ring-coral/40" title={b.name}>
                <img src={b.image} alt={b.name} className="w-full h-full object-cover scale-110" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink/35">Aún no equipas ninguna insignia — gánalas completando misiones.</p>
        )}
      </div>
    </div>
  )
}

// Accesos rápidos del docente: llena el mismo espacio lateral que en el estudiante
// ocupa el perfil, pero con lo que a un docente le sirve ver de un vistazo.
function TeacherShortcuts() {
  const items = [
    { to: '/teacher-analytics', label: 'Analítica de estudiantes', desc: 'XP, tiempo, pre/post-test y encuesta', icon: Icons.BarChart3, accent: '#FF6B4A' },
    { to: '/teacher-panel', label: 'Panel Docente', desc: 'Vista general del laboratorio', icon: Icons.LayoutDashboard, accent: '#1B3A5C' },
    { to: '/user-management', label: 'Gestión de Usuarios', desc: 'Roles y código de registro', icon: Icons.Users, accent: '#3FBFAD' },
    { to: '/mission-management', label: 'Gestión de Misiones', desc: 'Editar misiones y ejercicios', icon: Icons.Map, accent: '#F0A93C' },
  ]
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-6 h-full">
      <div className="text-[11px] font-mono-lab text-ink/40 uppercase tracking-wide mb-3">Accesos rápidos</div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 p-3 rounded-lg border border-ink/10 hover:border-coral/40 hover:-translate-y-0.5 transition-all"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.accent}1A` }}>
              <item.icon className="w-4.5 h-4.5" style={{ color: item.accent }} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">{item.label}</div>
              <div className="text-[11px] text-ink/40 truncate">{item.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, isLoadingAuth } = useAuth()
  const [missions, setMissions] = useState([])
  const [progress, setProgress] = useState([])
  const [missionsLoading, setMissionsLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [badges, setBadges] = useState([])
  const [ranking, setRanking] = useState([])
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    Promise.all([
      api.missions.list('misiones'),
      user && !isAdmin ? api.progress.list().catch(() => []) : Promise.resolve([]),
    ])
      .then(([m, p]) => { setMissions(m); setProgress(p) })
      .catch(() => {})
      .finally(() => setMissionsLoading(false))
  }, [user, isAdmin])
  // Version reducida de "dificultad adaptativa": sugiere repasar una mision anterior si el
  // estudiante viene fallando mucho en la que tiene pendiente — no cambia que ejercicios ve.
  useEffect(() => {
    if (user && !isAdmin) api.progress.recommendation().then(setRecommendation).catch(() => {})
  }, [user, isAdmin])
  useEffect(() => { if (isAdmin) api.stats.get().then(setStats).catch(() => {}) }, [isAdmin])
  useEffect(() => {
    if (!user || isAdmin) return
    api.badges.list().then(setBadges).catch(() => {})
    api.ranking.list().then(setRanking).catch(() => {})
  }, [user, isAdmin])

  // La misión "actual" es la primera, en orden, que todavía no está al 100% — el mismo
  // criterio de desbloqueo secuencial que usa el catálogo de Misiones.
  const sortedMissions = [...missions].sort((a, b) => a.order - b.order)
  const currentMission = sortedMissions.find((m) => {
    const p = progress.find((pr) => pr.mission_id === m.id)
    return Number(p?.progress_percentage || 0) < 100
  })
  const allCompleted = sortedMissions.length > 0 && !currentMission

  if (isLoadingAuth) return <p className="text-ink/40 font-mono-lab text-sm">Cargando...</p>

  if (isAdmin) {
    return (
      <div>
        <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">PANEL · LABORATORIO DE CÁLCULO</div>
        <h1 className="text-3xl font-display font-bold text-ink">Bienvenido, Docente</h1>
        <p className="text-ink/50 mt-1">Seguimiento del laboratorio y sus estudiantes.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard label="Estudiantes" value={stats?.totalStudents ?? '—'} icon={Icons.Users} accent="#1B3A5C" />
          <StatCard label="Activos" value={stats?.activeStudents ?? '—'} icon={Icons.TrendingUp} accent="#3FBFAD" />
          <StatCard label="Misiones" value={stats?.totalMissions ?? '—'} icon={Icons.BookOpen} accent="#FF6B4A" />
          <StatCard label="Acceso" value="100%" icon={Icons.Shield} accent="#F0A93C" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10 items-start">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-ink flex items-center gap-2">
                <Icons.Rocket className="w-4 h-4 text-coral" /> Misiones del Sistema
              </h2>
              <Link to="/missions" className="text-sm text-coral font-medium">Ver todas →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missionsLoading
                ? Array.from({ length: 4 }).map((_, i) => <MissionCardSkeleton key={i} />)
                : missions.slice(0, 4).map((m) => <MissionPreviewCard key={m.id} mission={m} />)}
            </div>
          </div>
          <TeacherShortcuts />
        </div>
      </div>
    )
  }

  const xpIntoLevel = (user?.xp || 0) % XP_PER_LEVEL
  const pct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100)

  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">LABORATORIO DE CÁLCULO DEL FUTURO</div>
      <h1 className="text-3xl font-display font-bold text-ink">
        {user ? `Hola, ${user.full_name?.split(' ')[0]}` : 'Bienvenido'}
      </h1>
      <p className="text-ink/50 mt-1">Cada misión es una función distinta por explorar.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
        <div className="lg:col-span-2">
          {user && (
            <div className="bg-white rounded-xl border border-ink/10 p-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-mono-lab text-ink/50">NIVEL {user.level}</span>
                <span className="font-mono-lab text-coral">{user.xp} XP</span>
              </div>
              <div className="h-2 rounded-full bg-ink/5 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-coral to-gold" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] text-ink/40 mt-1.5 font-mono-lab">{XP_PER_LEVEL - xpIntoLevel} XP para el siguiente nivel</div>
            </div>
          )}

          {recommendation && (
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mt-6 flex items-start gap-3">
              <Icons.Lightbulb className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-ink">{recommendation.reason}</p>
                <Link to={`/missions/${recommendation.mission_id}`} className="text-sm font-medium text-gold hover:underline mt-1 inline-block">
                  Repasar "{recommendation.mission_title}" →
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-display font-semibold text-ink mb-3">Continúa donde quedaste</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missionsLoading ? (
                <MissionCardSkeleton />
              ) : currentMission ? (
                <MissionPreviewCard mission={currentMission} />
              ) : allCompleted ? (
                <p className="text-ink/40 text-sm col-span-full">¡Completaste todas las misiones!</p>
              ) : (
                <p className="text-ink/40 text-sm col-span-full">Aún no hay misiones disponibles.</p>
              )}
            </div>
          </div>
        </div>

        {user && <ProfileSidebar user={user} badges={badges} ranking={ranking} />}
      </div>
    </div>
  )
}
