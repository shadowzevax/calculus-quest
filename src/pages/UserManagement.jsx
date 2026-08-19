import { useEffect, useState } from 'react'
import { Users, KeyRound, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

function RegistrationCodeCard() {
  const [state, setState] = useState(null) // { code, expires_at }
  const [now, setNow] = useState(Date.now())
  const [regenerating, setRegenerating] = useState(false)

  const load = () => api.settings.getRegCode().then(setState).catch(() => {})
  useEffect(() => { load() }, [])

  // Refresca el reloj cada segundo (para la cuenta regresiva) y vuelve a pedir
  // el código cada 20s: si ya venció en el servidor, la respuesta trae el nuevo.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    const poll = setInterval(load, 20_000)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [])

  const regenerate = async () => {
    setRegenerating(true)
    try {
      setState(await api.settings.regenerateRegCode())
    } finally {
      setRegenerating(false)
    }
  }

  const secondsLeft = state ? Math.max(0, Math.floor((state.expires_at - now) / 1000)) : 0
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="bg-white rounded-xl border border-ink/10 p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-coral/10 border border-coral/30 flex items-center justify-center shrink-0">
        <KeyRound className="w-4.5 h-4.5 text-coral" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-mono-lab text-ink/40 uppercase tracking-wide">Código de registro</div>
        <div className="text-2xl font-display font-bold text-ink tracking-[0.2em] tabular-nums">
          {state ? state.code : '····'}
        </div>
        <div className="text-[11px] text-ink/40">Se renueva solo en {mm}:{ss}</div>
      </div>
      <button
        onClick={regenerate}
        disabled={regenerating}
        title="Generar un código nuevo ahora"
        className="ml-auto w-8 h-8 rounded-lg border border-ink/15 text-ink/50 hover:bg-ink/5 hover:text-ink flex items-center justify-center shrink-0 disabled:opacity-40"
      >
        <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState([])

  const load = () => api.users.list().then(setUsers).catch(() => {})
  useEffect(() => { load() }, [])

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    await api.users.setRole(u.id, newRole)
    load()
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">ADMINISTRACIÓN</div>
          <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-blueprint" /> Gestión de Usuarios
          </h1>
          <p className="text-ink/50 mb-6">Administra los roles de docentes y estudiantes.</p>
        </div>
        <RegistrationCodeCard />
      </div>

      <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="font-medium text-ink">{u.full_name}</div>
              <div className="text-xs text-ink/40">{u.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-mono-lab px-2 py-0.5 rounded uppercase ${u.role === 'admin' ? 'bg-gold/15 text-gold' : 'bg-ink/5 text-ink/50'}`}>
                {u.role === 'admin' ? 'Docente' : 'Estudiante'}
              </span>
              <button
                onClick={() => toggleRole(u)}
                className="text-xs border border-ink/15 rounded px-2 py-1 text-ink/60 hover:bg-ink/5"
              >
                Cambiar Rol
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
