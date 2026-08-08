import { useEffect, useRef, useState } from 'react'
import { Lock, Camera } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import { AvatarCircle } from '@/components/ui/avatar-circle'

// Redimensiona y comprime la imagen en el navegador antes de subirla, para no acumular
// fotos pesadas en la base de datos (se guarda como un JPEG chico, máx. ~320px de lado).
async function resizeImage(file) {
  const bitmap = await createImageBitmap(file)
  const maxDim = 320
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export default function Profile() {
  const { user, setUser, refresh } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saved, setSaved] = useState(false)
  const [badges, setBadges] = useState([])
  const [progress, setProgress] = useState([])
  const [missions, setMissions] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.badges.list().then(setBadges).catch(() => {})
    api.progress.list().then(setProgress).catch(() => {})
    api.missions.list().then(setMissions).catch(() => {})
  }, [])

  // Actualiza la interfaz al instante (sin esperar la respuesta del servidor) y revierte
  // si la petición falla, para que el switch/insignia se sientan inmediatos.
  const applyStyle = (data) => {
    const previous = user
    setUser((u) => ({ ...u, ...data }))
    api.profile.update(data).catch(() => setUser(previous))
  }

  // Equipar/desequipar una insignia: se pueden llevar 0, algunas o todas a la vez.
  const toggleBadge = (badge) => {
    const wasEquipped = badge.equipped
    setBadges((list) => list.map((b) => (
      b.id === badge.id ? { ...b, equipped: !wasEquipped, equipped_at: wasEquipped ? null : new Date().toISOString() } : b
    )))
    api.badges.toggle(badge.id).catch(() => {
      setBadges((list) => list.map((b) => (b.id === badge.id ? { ...b, equipped: wasEquipped, equipped_at: badge.equipped_at } : b)))
    })
  }

  const isAdmin = user?.role === 'admin'
  const rainbowUnlocked = isAdmin || badges.some((b) => b.requirement_value === 14 && b.earned)
  const darkBubbleUnlocked = isAdmin || badges.some((b) => b.requirement_value === 13 && b.earned)
  const avatarGlowUnlocked = isAdmin || badges.some((b) => b.requirement_value === 12 && b.earned)
  const mission11 = missions.find((m) => m.order === 11)
  const photoUnlocked = isAdmin || (mission11 && progress.some((p) => p.mission_id === mission11.id && p.progress_percentage >= 100))

  const choosePhoto = () => fileInputRef.current?.click()

  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      setPhotoError('Solo se admiten imágenes (no GIF ni video).')
      return
    }
    setUploadingPhoto(true)
    try {
      const dataUrl = await resizeImage(file)
      await api.profile.update({ avatar: dataUrl })
      await refresh()
    } catch {
      setPhotoError('No se pudo subir la imagen. Intenta con otra.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const removePhoto = async () => {
    setPhotoError('')
    setUploadingPhoto(true)
    try {
      await api.profile.update({ avatar: '' })
      await refresh()
    } catch {
      setPhotoError('No se pudo quitar la foto.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const equippedBadges = badges
    .filter((b) => b.equipped)
    .sort((a, b) => new Date(a.equipped_at) - new Date(b.equipped_at))

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
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            <AvatarCircle
              name={user.full_name}
              image={user.avatar}
              glow={user.avatar_glow}
              className="w-16 h-16 bg-coral/15 border border-coral/30"
              textClassName="text-2xl font-display font-semibold text-coral"
            />
            {photoUnlocked && (
              <button
                type="button"
                onClick={choosePhoto}
                disabled={uploadingPhoto}
                title="Cambiar foto de perfil"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blueprint hover:bg-coral transition-colors text-white flex items-center justify-center border-2 border-white"
              >
                <Camera className="w-3 h-3" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPhotoSelected} className="hidden" />
          </div>
          <div>
            <div className={`font-medium ${user.name_rainbow ? 'name-rainbow' : 'text-ink'}`}>{user.full_name}</div>
            <div className="text-sm font-mono-lab text-ink/40">{user.xp} XP · Nivel {user.level}</div>
            {user.avatar && (
              <button
                type="button"
                onClick={removePhoto}
                disabled={uploadingPhoto}
                className="text-xs text-red-500 hover:text-red-600 transition-colors mt-0.5"
              >
                Quitar foto
              </button>
            )}
          </div>
        </div>
        {photoError && <p className="text-red-500 text-xs -mt-2 mb-3">{photoError}</p>}
        {uploadingPhoto && <p className="text-ink/40 text-xs -mt-2 mb-3">Subiendo foto...</p>}

        {equippedBadges.length > 0 && (
          <div className="mb-4 pt-1">
            <div className="grid grid-cols-4 gap-2 max-w-[280px]">
              {equippedBadges.map((b) => (
                <div key={b.id} className="w-14 h-14 rounded-full overflow-hidden bg-ink/5 ring-2 ring-coral/50" title={b.name}>
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover scale-110" />
                </div>
              ))}
            </div>
          </div>
        )}

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
        <p className="text-sm text-ink/40 mb-4">Se ganan al completar misiones. Toca las que quieras equipar — puedes llevar ninguna, algunas o todas a la vez.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((b) => (
            <button
              key={b.id}
              type="button"
              disabled={!b.earned}
              onClick={() => toggleBadge(b)}
              className={`text-center border rounded-xl p-3 transition-colors ${
                b.earned ? 'border-ink/10 hover:border-coral/40 cursor-pointer' : 'border-ink/10 cursor-not-allowed'
              } ${b.equipped ? 'ring-2 ring-coral border-coral/40' : ''}`}
            >
              <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-ink/5 flex items-center justify-center">
                {b.earned ? (
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover scale-110" />
                ) : (
                  <Lock className="w-5 h-5 text-ink/25" />
                )}
              </div>
              <span className={`text-xs font-medium ${b.earned ? 'text-ink' : 'text-ink/35'}`}>{b.name}</span>
              <p className="text-[11px] text-ink/35 mt-0.5">{b.description}</p>
              {b.equipped && <p className="text-[10px] font-mono-lab text-coral mt-1">EQUIPADA</p>}
            </button>
          ))}
          {badges.length === 0 && <p className="text-ink/35 text-sm col-span-full">Cargando insignias...</p>}
        </div>

        {avatarGlowUnlocked && (
          <div className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Aro iluminado en la foto de perfil</p>
              <p className="text-xs text-ink/40">Desbloqueado al llegar a la misión 12. Se ve en tu foto en todos lados, incluido el ranking.</p>
            </div>
            <Switch
              checked={!!user.avatar_glow}
              onCheckedChange={(checked) => applyStyle({ avatar_glow: checked })}
            />
          </div>
        )}

        {darkBubbleUnlocked && (
          <div className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Burbuja oscura en el Chat</p>
              <p className="text-xs text-ink/40">Desbloqueada al llegar a la misión 13. Cambia el color de tus mensajes para todos los que los vean, no solo para ti.</p>
            </div>
            <Switch
              checked={!!user.dark_bubble}
              onCheckedChange={(checked) => applyStyle({ dark_bubble: checked })}
            />
          </div>
        )}

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
