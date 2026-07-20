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
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Users className="w-5 h-5" /> Gestión de Usuarios</h1>
      <p className="text-slate-500 mb-6">Administra los roles de docentes y estudiantes.</p>

      <div className="bg-white rounded-xl border divide-y">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="font-medium text-slate-800">{u.full_name}</div>
              <div className="text-xs text-slate-400">{u.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                {u.role === 'admin' ? 'Docente' : 'Estudiante'}
              </span>
              <button
                onClick={() => toggleRole(u)}
                className="text-xs border rounded px-2 py-1 text-slate-600 hover:bg-slate-50"
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
