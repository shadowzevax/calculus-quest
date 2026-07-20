import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { api } from '@/lib/api'

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
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">ADMINISTRACIÓN</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <Users className="w-6 h-6 text-blueprint" /> Gestión de Usuarios
      </h1>
      <p className="text-ink/50 mb-6">Administra los roles de docentes y estudiantes.</p>

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
