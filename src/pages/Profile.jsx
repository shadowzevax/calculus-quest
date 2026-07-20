import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'

export default function Profile() {
  const { user, refresh } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saved, setSaved] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    await api.profile.update({ full_name: fullName, bio })
    await refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!user) return null

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-semibold text-slate-600">
            {user.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{user.email}</div>
            <div className="text-sm text-slate-400">{user.xp} XP · Nivel {user.level}</div>
          </div>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="text-sm text-slate-500">Nombre completo</label>
            <input className="w-full border rounded px-3 py-2 mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-slate-500">Biografía</label>
            <textarea className="w-full border rounded px-3 py-2 mt-1" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <button type="submit" className="bg-[#457B9D] text-white rounded px-4 py-2 text-sm">Guardar cambios</button>
          {saved && <span className="text-green-600 text-sm ml-3">Guardado ✓</span>}
        </form>
      </div>
    </div>
  )
}
