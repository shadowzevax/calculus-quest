import { useMemo } from 'react'
import { buildAvatarDataUri } from '@/lib/avatarBuilder'

// Círculo de avatar reutilizable. Orden de prioridad: foto personalizada subida por el
// usuario (recompensa de la misión 11) > avatar armable (Avataaars) > inicial del nombre.
export function AvatarCircle({ name, image, avatarConfig, glow, className = '', textClassName = '' }) {
  const builtAvatar = useMemo(() => {
    if (image || !avatarConfig) return null
    try {
      return buildAvatarDataUri({ ...avatarConfig, seed: name || 'funcionlab' })
    } catch {
      return null
    }
  }, [image, avatarConfig, name])

  const src = image || builtAvatar

  return (
    <div className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${glow ? 'avatar-glow' : ''} ${className}`}>
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className={textClassName}>{name?.[0]?.toUpperCase() || '?'}</span>
      )}
    </div>
  )
}
