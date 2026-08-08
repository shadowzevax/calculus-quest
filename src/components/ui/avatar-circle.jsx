// Círculo de avatar reutilizable: muestra la foto personalizada si el usuario la subió
// (recompensa de la misión 11), o si no, la inicial del nombre sobre un color de fondo.
export function AvatarCircle({ name, image, glow, className = '', textClassName = '' }) {
  return (
    <div className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${glow ? 'avatar-glow' : ''} ${className}`}>
      {image ? (
        <img src={image} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className={textClassName}>{name?.[0]?.toUpperCase() || '?'}</span>
      )}
    </div>
  )
}
