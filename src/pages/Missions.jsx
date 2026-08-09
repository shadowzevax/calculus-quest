import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { HelpCircle, Camera, Lock, Check } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import MiniCurve from '@/components/MiniCurve'
import { MissionsGridSkeleton } from '@/components/Skeleton'
import { buildAvatarDataUri } from '@/lib/avatarBuilder'

// Config base neutral para renderizar la miniatura de una sola pieza de avatar (el resto
// del muñeco queda con valores por defecto, solo cambia lo que se quiere mostrar).
const AVATAR_PREVIEW_BASE = {
  top: 'shortFlat', clothing: 'shirtCrewNeck', skinColor: 'edb98a', hairColor: '2c1b18',
  clothesColor: '65c9ff', eyes: 'default', eyebrows: 'default', mouth: 'smile',
}
function avatarPieceThumb(piece) {
  const key = piece.category === 'top' ? 'top' : piece.category
  return buildAvatarDataUri({ ...AVATAR_PREVIEW_BASE, [key]: piece.value, seed: piece.id })
}

const difficultyStyle = {
  facil: 'bg-teal/10 text-teal',
  intermedio: 'bg-gold/15 text-gold',
  dificil: 'bg-coral/10 text-coral',
  experto: 'bg-blueprint/10 text-blueprint',
}

// Recompensas "especiales" que además de la insignia desbloquean una función cosmética
// (además del ícono de la insignia, se muestra una vista previa real del efecto).
const SPECIAL_REWARDS = {
  12: {
    label: 'Aro iluminado',
    desc: 'Un resplandor animado naranja alrededor de tu foto de perfil, visible para todos en el Perfil, el Ranking y el Chat.',
    preview: <span className="w-4 h-4 rounded-full bg-ink/10 avatar-glow inline-block" />,
  },
  13: {
    label: 'Burbuja oscura',
    desc: 'Tus mensajes en el Chat se ven con fondo oscuro en vez del naranja normal — y así los ve todo el mundo, no solo tú.',
    preview: <span className="w-6 h-3.5 rounded bg-ink inline-block" />,
  },
  14: {
    label: 'Nombre arcoíris',
    desc: 'Tu nombre se muestra con un degradado de colores animado en todos lados: Perfil, Ranking y Chat.',
    preview: <span className="name-rainbow font-bold text-xs">Aa</span>,
  },
}

// Recompensas que no tienen una insignia coleccionable asociada (no aparecen en "Insignias y
// logros"), pero igual se otorgan al completar esa misión — se muestran igual en la tarjeta.
const STANDALONE_REWARDS = {
  11: {
    label: 'Foto de perfil personalizada',
    desc: 'Puedes subir tu propia foto en Mi Perfil en vez de usar la inicial de tu nombre (solo imágenes, sin GIF ni video).',
    preview: <Camera className="w-4 h-4 text-blueprint" />,
  },
}

export default function Missions() {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [progress, setProgress] = useState([])
  const [badges, setBadges] = useState([])
  const [avatarPieces, setAvatarPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openInfo, setOpenInfo] = useState(null)
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      api.missions.list('misiones'),
      user ? api.progress.list().catch(() => []) : Promise.resolve([]),
      user ? api.badges.list().catch(() => []) : Promise.resolve([]),
      user ? api.profile.avatarCatalog().then((r) => r.pieces).catch(() => []) : Promise.resolve([]),
    ])
      .then(([m, p, b, ap]) => { setMissions(m); setProgress(p); setBadges(b); setAvatarPieces(ap) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  // Insignia que otorga esta misión en particular, según su número de orden. Es información
  // de catálogo (qué recompensa da cada misión), así que se muestra siempre — sin importar si
  // ya se ganó, si está bloqueada, o si quien mira es docente — para que sirva de referencia.
  const rewardsFor = (mission) => badges.filter((b) => b.requirement_value === mission.order)
  // Piezas de avatar que se desbloquean en esta misión (ya vienen filtradas por el genero de
  // avatar que eligio el usuario, desde el propio backend).
  const avatarPiecesFor = (mission) => avatarPieces.filter((p) =>
    (p.unlock_type === 'mission' && p.unlock_mission_order === mission.order) ||
    (p.unlock_type === 'finale' && mission.order === 14)
  )

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
          // Bloqueada a menos que la misión JUSTO ANTERIOR (por orden) esté al 100% —
          // antes esto comprobaba "cualquier otra misión completada", lo que desbloqueaba
          // todas de golpe apenas se completaba la primera.
          const locked = !isAdmin && m.order > 1 && !progress.some((pr) => {
            const prevMission = missions.find((mm) => mm.order === m.order - 1)
            return prevMission && pr.mission_id === prevMission.id && pr.progress_percentage >= 100
          })
          const rewards = rewardsFor(m)
          const avatarRewards = avatarPiecesFor(m)

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
                  {m.is_collaborative && (
                    <span className="text-[11px] font-mono-lab px-2 py-0.5 rounded uppercase bg-teal/10 text-teal">Cooperativo</span>
                  )}
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
                {(rewards.length > 0 || STANDALONE_REWARDS[m.order] || avatarRewards.length > 0) && (
                  <div className="mt-2.5 pt-2.5 border-t border-ink/5 space-y-1.5">
                    <p className="text-[10px] font-mono-lab text-ink/35 tracking-wide">RECOMPENSA AL COMPLETAR</p>
                    {STANDALONE_REWARDS[m.order] && (() => {
                      const reward = STANDALONE_REWARDS[m.order]
                      const infoKey = `${m.id}-standalone`
                      const isOpen = openInfo === infoKey
                      return (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs">
                            {reward.preview}
                            <span className="text-ink/70">{reward.label}</span>
                            <button
                              type="button"
                              onClick={() => setOpenInfo(isOpen ? null : infoKey)}
                              className="text-ink/35 hover:text-coral transition-colors"
                              aria-label={`Qué es ${reward.label}`}
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {isOpen && <p className="text-[11px] text-ink/50 mt-1 pl-6 pr-1">{reward.desc}</p>}
                        </div>
                      )
                    })()}
                    {rewards.map((b) => {
                      const special = SPECIAL_REWARDS[b.requirement_value]
                      const infoKey = `${m.id}-${b.id}`
                      const isOpen = openInfo === infoKey
                      return (
                        <div key={b.id}>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 bg-ink/5">
                              <img src={b.image} alt="" className={`w-5 h-5 object-cover ${!b.earned ? 'grayscale opacity-30' : ''}`} />
                              {!b.earned && <Lock className="w-2.5 h-2.5 text-ink/50 absolute inset-0 m-auto" />}
                              {b.earned && (
                                <span className="absolute bottom-0 right-0 bg-teal rounded-full p-[1px]">
                                  <Check className="w-1.5 h-1.5 text-white" strokeWidth={4} />
                                </span>
                              )}
                            </span>
                            <span className="text-ink/70">{b.name}</span>
                            {special && (
                              <>
                                <span className="text-ink/25">+</span>
                                {special.preview}
                                <span className="text-ink/70">{special.label}</span>
                                <button
                                  type="button"
                                  onClick={() => setOpenInfo(isOpen ? null : infoKey)}
                                  className="text-ink/35 hover:text-coral transition-colors"
                                  aria-label={`Qué es ${special.label}`}
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                          {isOpen && special && (
                            <p className="text-[11px] text-ink/50 mt-1 pl-6 pr-1">{special.desc}</p>
                          )}
                        </div>
                      )
                    })}
                    {avatarRewards.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs mb-1">
                          <span className="text-ink/70">
                            {avatarRewards.length === 1 ? '1 pieza para tu avatar' : `${avatarRewards.length} piezas para tu avatar`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {avatarRewards.map((piece) => (
                            <div
                              key={piece.id}
                              title={piece.label}
                              className="relative w-8 h-8 rounded-full overflow-hidden bg-ink/5 ring-1 ring-ink/10 shrink-0"
                            >
                              <img
                                src={avatarPieceThumb(piece)}
                                alt={piece.label}
                                className={`w-full h-full object-cover ${!piece.unlocked ? 'grayscale opacity-30' : ''}`}
                              />
                              {!piece.unlocked && <Lock className="w-3 h-3 text-ink/50 absolute inset-0 m-auto" />}
                              {piece.unlocked && (
                                <span className="absolute bottom-0 right-0 bg-teal rounded-full p-[1px]">
                                  <Check className="w-2 h-2 text-white" strokeWidth={4} />
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
