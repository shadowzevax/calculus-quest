import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { Switch } from '@/components/ui/switch'

export default function Profile() {
  const { user, setUser, refresh } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saved, setSaved] = useState(false)
  const [badges, setBadges] = useState([])

  useEffect(() => { api.badges.list().then(setBadges).catch(() => {}) }, [])

  // Actualiza la interfaz al instante (sin esperar la respuesta del servidor) y revierte
  // si la petición falla, para que activar el switch/insignia se sienta inmediato.
  const applyStyle = (data) => {
    const previous = user
    setUser((u) => ({ ...u, ...data }))
    api.profile.update(data).catch(() => setUser(previous))
  }

  const isAdmin = user?.role === 'admin'
  const rainbowUnlocked = isAdmin || badges.some((b) => b.requirement_type === 'missions_completed' && b.requirement_value === 14 && b.earned)

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
            <div className={`font-medium flex items-center gap-1.5 ${user.name_rainbow ? 'name-rainbow' : 'text-ink'}`}>
              {user.full_name}
              {user.equipped_badge_id && badges.find((b) => b.id === user.equipped_badge_id) && (
                <img
                  src={badges.find((b) => b.id === user.equipped_badge_id).image}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              )}
            </div>
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
        <h2 className="text-lg font-display font-semibold text-ink mb-1">Insignias y logros</h2>
        <p className="text-sm text-ink/40 mb-4">Se ganan al completar misiones. Equipa una para mostrar su ícono junto a tu nombre en el ranking y el chat.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => {
            const isEquipped = user.equipped_badge_id === b.id
            return (
              <button
                key={b.id}
                type="button"
                disabled={!b.earned}
                onClick={() => applyStyle({ equipped_badge_id: b.id })}
                className={`text-center border rounded-xl p-3 transition-colors ${
                  b.earned ? 'border-ink/10 hover:border-coral/40 cursor-pointer' : 'border-ink/10 cursor-not-allowed'
                } ${isEquipped ? 'ring-2 ring-coral border-coral/40' : ''}`}
              >
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-ink/5 flex items-center justify-center">
                  {b.earned ? (
                    <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                  ) : (
                    <Lock className="w-5 h-5 text-ink/25" />
                  )}
                </div>
                <span className={`text-xs font-medium ${b.earned ? 'text-ink' : 'text-ink/35'}`}>{b.name}</span>
                <p className="text-[11px] text-ink/35 mt-0.5">{b.description}</p>
                {isEquipped && <p className="text-[10px] font-mono-lab text-coral mt-1">EQUIPADA</p>}
              </button>
            )
          })}
          {badges.length === 0 && <p className="text-ink/35 text-sm col-span-full">Cargando insignias...</p>}
        </div>

        {rainbowUnlocked && (
          <div className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium name-rainbow inline-block">Nombre arcoíris</p>
              <p className="text-xs text-ink/40">Recompensa máxima: completaste las 14 misiones. Actívalo para lucir tu nombre en todos lados.</p>
            </div>
            <Switch
              checked={!!user.name_rainbow}
              onCheckedChange={(checked) => applyStyle({ name_rainbow: checked })}
            />
          </div>
        )}
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
