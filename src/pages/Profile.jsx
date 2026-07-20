import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'

export default function Profile() {
  const { user, refresh } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saved, setSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    await api.profile.update({ full_name: fullName, bio })
    await refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    try {
      await api.profile.update({ current_password: currentPassword, new_password: newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordSaved(true)
      setTimeout(() => setPasswordSaved(false), 2000)
    } catch (err) {
      setPasswordError(err.message)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-lg">
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">CUENTA</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-6">Mi Perfil</h1>
      <div className="bg-white rounded-xl border border-ink/10 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-coral/15 border border-coral/30 flex items-center justify-center text-2xl font-display font-semibold text-coral">
            {user.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-medium text-ink">{user.email}</div>
            <div className="text-sm font-mono-lab text-ink/40">{user.xp} XP · Nivel {user.level}</div>
          </div>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="text-sm text-ink/50">Nombre completo</label>
            <input className="w-full border border-ink/15 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-ink/50">Biografía</label>
            <textarea className="w-full border border-ink/15 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <button type="submit" className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">Guardar cambios</button>
          {saved && <span className="text-teal text-sm ml-3">Guardado ✓</span>}
        </form>
      </div>

      <div className="bg-white rounded-xl border border-ink/10 p-6 mt-6">
        <h2 className="text-lg font-display font-semibold text-ink mb-4">Cambiar contraseña</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="text-sm text-ink/50">Contraseña actual</label>
            <input
              type="password"
              className="w-full border border-ink/15 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-ink/50">Contraseña nueva</label>
            <input
              type="password"
              className="w-full border border-ink/15 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          <button type="submit" className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">Actualizar contraseña</button>
          {passwordSaved && <span className="text-teal text-sm ml-3">Actualizada ✓</span>}
        </form>
      </div>
    </div>
  )
}
