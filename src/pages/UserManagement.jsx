import { useEffect, useMemo, useState } from 'react'
import { Users, KeyRound, RefreshCw, Search, Copy, X, Trash2, ChevronDown, ChevronRight, UserCircle2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

const ROLE_LABEL = { superadmin: 'Administrador', admin: 'Docente', user: 'Estudiante' }
const ROLE_STYLE = {
  superadmin: 'bg-blueprint/15 text-blueprint',
  admin: 'bg-gold/15 text-gold',
  user: 'bg-ink/5 text-ink/50',
}

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
    // Los navegadores frenan los setInterval de una pestaña en segundo plano (a veces a
    // solo 1 vez por minuto), así que si alguien deja la pestaña abierta y vuelve justo
    // cuando el código ya venció, se veía "congelado" en 00:00 con el código viejo hasta
    // que por fin corría el siguiente poll — a veces mucho después de los 20s esperados.
    // Al volver a la pestaña se pide el código de una vez, sin esperar al temporizador.
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(tick); clearInterval(poll); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  const secondsLeft = state ? Math.max(0, Math.floor((state.expires_at - now) / 1000)) : 0

  // En cuanto la cuenta regresiva llega a 0 (mientras la pestaña sigue abierta y visible),
  // se pide el código nuevo de inmediato en vez de esperar al próximo poll de 20s.
  useEffect(() => {
    if (state && secondsLeft === 0) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft === 0])

  const regenerate = async () => {
    setRegenerating(true)
    try {
      setState(await api.settings.regenerateRegCode())
    } finally {
      setRegenerating(false)
    }
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="bg-white rounded-xl border border-ink/10 p-4 flex items-center gap-4 w-72 shrink-0">
      <div className="w-10 h-10 rounded-lg bg-coral/10 border border-coral/30 flex items-center justify-center shrink-0">
        <KeyRound className="w-4.5 h-4.5 text-coral" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-mono-lab text-ink/40 uppercase tracking-wide">Código de registro</div>
        <div className="text-2xl font-display font-bold text-ink tracking-[0.2em] tabular-nums">
          {state ? state.code : '····'}
        </div>
        <div className="text-[11px] text-ink/40 tabular-nums">Se renueva solo en {mm}:{ss}</div>
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

// Banner con el código de acceso recién generado para un estudiante puntual — se muestra
// arriba de la lista hasta que el docente lo cierra o vence (30 min, igual que en el backend).
function ResetCodeBanner({ result, onClose }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])
  const secondsLeft = Math.max(0, Math.floor((new Date(result.expires_at).getTime() - now) / 1000))
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const copy = () => navigator.clipboard?.writeText(result.code).catch(() => {})

  return (
    <div className="bg-teal/5 border border-teal/30 rounded-xl p-4 mb-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/30 flex items-center justify-center shrink-0">
        <KeyRound className="w-4.5 h-4.5 text-teal" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono-lab text-ink/40 uppercase tracking-wide">
          Código para {result.full_name} ({result.email})
        </div>
        <div className="text-2xl font-display font-bold text-ink tracking-[0.2em] tabular-nums">{result.code}</div>
        <div className="text-[11px] text-ink/40 tabular-nums">
          {secondsLeft > 0 ? `Vence en ${mm}:${ss} — dáselo al estudiante para que entre a "¿Olvidaste tu contraseña?" en el login` : 'Este código ya venció, genera uno nuevo'}
        </div>
      </div>
      <button onClick={copy} title="Copiar código" className="w-8 h-8 rounded-lg border border-ink/15 text-ink/50 hover:bg-ink/5 hover:text-ink flex items-center justify-center shrink-0">
        <Copy className="w-4 h-4" />
      </button>
      <button onClick={onClose} title="Cerrar" className="w-8 h-8 rounded-lg border border-ink/15 text-ink/50 hover:bg-ink/5 hover:text-ink flex items-center justify-center shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Una fila de usuario, con los botones habilitados según lo que el rol de quien mira le
// permite hacerle al rol del usuario de la fila (ver reglas espejo en api/users.js).
function UserRow({ u, isSuperAdmin, generatingFor, deletingFor, onGenerateCode, onToggleRole, onDelete }) {
  const canCode = u.role === 'user' || (u.role === 'admin' && isSuperAdmin)
  const canChangeRole = isSuperAdmin && u.role !== 'superadmin'
  const canDelete = u.role === 'user' || (u.role === 'admin' && isSuperAdmin)

  return (
    <div className="flex items-center justify-between px-5 py-3.5 gap-3 flex-wrap">
      <div>
        <div className="font-medium text-ink">{u.full_name}</div>
        <div className="text-xs text-ink/40">{u.email}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-[11px] font-mono-lab px-2 py-0.5 rounded uppercase ${ROLE_STYLE[u.role] || ROLE_STYLE.user}`}>
          {ROLE_LABEL[u.role] || 'Estudiante'}
        </span>
        {canCode && (
          <button
            onClick={() => onGenerateCode(u)}
            disabled={generatingFor === u.id}
            title="Generar un código para que este usuario se ponga una contraseña nueva"
            className="text-xs border border-ink/15 rounded px-2 py-1 text-ink/60 hover:bg-ink/5 flex items-center gap-1 disabled:opacity-40"
          >
            <KeyRound className="w-3.5 h-3.5" /> {generatingFor === u.id ? 'Generando...' : 'Código de acceso'}
          </button>
        )}
        {canChangeRole && (
          <button
            onClick={() => onToggleRole(u)}
            className="text-xs border border-ink/15 rounded px-2 py-1 text-ink/60 hover:bg-ink/5"
          >
            Cambiar Rol
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(u)}
            disabled={deletingFor === u.id}
            title={`Eliminar esta cuenta de ${u.role === 'admin' ? 'docente' : 'estudiante'}`}
            className="text-xs border border-red-200 rounded px-2 py-1 text-red-500 hover:bg-red-50 flex items-center gap-1 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" /> {deletingFor === u.id ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function UserManagement() {
  const { user: viewer } = useAuth()
  const isSuperAdmin = viewer?.role === 'superadmin'
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [resetResult, setResetResult] = useState(null)
  const [generatingFor, setGeneratingFor] = useState(null)
  const [deletingFor, setDeletingFor] = useState(null)
  const [showTeachers, setShowTeachers] = useState(false)

  const load = () => api.users.list().then(setUsers).catch(() => {})
  useEffect(() => { load() }, [])

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    await api.users.setRole(u.id, newRole)
    load()
  }

  const generateCode = async (u) => {
    setGeneratingFor(u.id)
    try {
      const result = await api.users.generateResetCode(u.id)
      setResetResult(result)
    } finally {
      setGeneratingFor(null)
    }
  }

  const deleteUser = async (u) => {
    if (!confirm(`¿Eliminar la cuenta de ${u.full_name} (${u.email})? Esto borra todo su progreso y no se puede deshacer.`)) return
    setDeletingFor(u.id)
    try {
      await api.users.remove(u.id)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingFor(null)
    }
  }

  // La propia cuenta de quien mira se saca de la lista y se muestra aparte arriba, para que
  // nunca se confunda con "otro usuario más" en la tabla. Los administradores (rol tope) se
  // ocultan por completo salvo que quien mire sea el propio administrador (ya se ve arriba
  // como "tu cuenta", así que aquí solo aplicaría si hubiera un segundo administrador).
  const me = users.find((u) => u.id === viewer?.id) || viewer
  const others = useMemo(
    () => users.filter((u) => u.id !== viewer?.id && (u.role !== 'superadmin' || isSuperAdmin)),
    [users, viewer, isSuperAdmin]
  )
  const teachers = useMemo(() => others.filter((u) => u.role === 'admin'), [others])
  const students = useMemo(() => others.filter((u) => u.role === 'user'), [others])

  const matches = (u, q) => u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? students.filter((u) => matches(u, q)) : students
  }, [students, search])
  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? teachers.filter((u) => matches(u, q)) : teachers
  }, [teachers, search])

  const rowProps = { isSuperAdmin, generatingFor, deletingFor, onGenerateCode: generateCode, onToggleRole: toggleRole, onDelete: deleteUser }

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

      {resetResult && <ResetCodeBanner result={resetResult} onClose={() => setResetResult(null)} />}

      {me && (
        <div className="bg-blueprint/5 border border-blueprint/15 rounded-xl px-5 py-3.5 mb-4 flex items-center gap-3">
          <UserCircle2 className="w-5 h-5 text-blueprint shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-ink">{me.full_name} <span className="text-xs text-blueprint font-mono-lab">(tú)</span></div>
            <div className="text-xs text-ink/40">{me.email}</div>
          </div>
          <span className={`text-[11px] font-mono-lab px-2 py-0.5 rounded uppercase shrink-0 ${ROLE_STYLE[me.role] || ROLE_STYLE.user}`}>
            {ROLE_LABEL[me.role] || 'Estudiante'}
          </span>
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full border border-ink/15 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
        />
      </div>

      {teachers.length > 0 && (
        <div className="bg-white rounded-xl border border-ink/10 mb-4">
          <button
            onClick={() => setShowTeachers((v) => !v)}
            className="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-ink/70 hover:bg-ink/[0.02]"
          >
            {showTeachers ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Docentes ({teachers.length})
          </button>
          {showTeachers && (
            <div className="divide-y divide-ink/5 border-t border-ink/10">
              {filteredTeachers.map((u) => <UserRow key={u.id} u={u} {...rowProps} />)}
              {filteredTeachers.length === 0 && (
                <p className="px-5 py-4 text-sm text-ink/35 text-center">Ningún docente coincide con "{search}".</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
        {filteredStudents.map((u) => <UserRow key={u.id} u={u} {...rowProps} />)}
        {filteredStudents.length === 0 && (
          <p className="px-5 py-6 text-sm text-ink/35 text-center">No hay estudiantes que coincidan con "{search}".</p>
        )}
      </div>
    </div>
  )
}
