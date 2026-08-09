import { buildAvatarDataUri } from '@/lib/avatarBuilder'

// Base neutral para renderizar la miniatura de una sola pieza de avatar — el resto del muñeco
// queda con valores por defecto de ESE género (para que el peinado base no contradiga el
// género real de quien mira la vista previa), solo cambia la pieza que se quiere mostrar.
function baseFor(gender) {
  return {
    top: gender === 'female' ? 'bob' : 'shortFlat',
    clothing: 'shirtCrewNeck', skinColor: 'edb98a', hairColor: '2c1b18',
    clothesColor: gender === 'female' ? 'ff488e' : '5199e4',
    eyes: 'default', eyebrows: 'default', mouth: 'smile',
  }
}

export const COLOR_CATEGORIES = ['skinColor', 'hairColor', 'clothesColor']

export function isColorPiece(piece) {
  return COLOR_CATEGORIES.includes(piece.category)
}

export function avatarPieceThumb(piece, gender) {
  const key = piece.category === 'top' ? 'top' : piece.category
  return buildAvatarDataUri({ ...baseFor(gender), [key]: piece.value, seed: piece.id })
}

// El peinado es la única categoría donde tiene sentido ver el muñeco completo (es lo que más
// cambia la silueta). Para todo lo demás (gorro, ropa, accesorio, ojos, cejas, boca, estampado)
// se recorta/hace zoom sobre la región aproximada de esa pieza en el SVG de Avataaars (viewBox
// 280x280), para que se vea "solo el objeto" en vez del avatar entero.
const CROP_REGIONS = {
  hat: { x: 0.5, y: 0.16, zoom: 3.0 },
  accessories: { x: 0.5, y: 0.42, zoom: 2.6 },
  facialHair: { x: 0.5, y: 0.56, zoom: 2.4 },
  eyes: { x: 0.5, y: 0.4, zoom: 2.9 },
  eyebrows: { x: 0.5, y: 0.34, zoom: 3.2 },
  mouth: { x: 0.5, y: 0.53, zoom: 3.2 },
  clothing: { x: 0.5, y: 0.82, zoom: 1.7 },
  clothingGraphic: { x: 0.5, y: 0.75, zoom: 2.8 },
}

// Devuelve el estilo inline para el <img> dentro de un contenedor con overflow-hidden de
// tamaño fijo, o null si la categoría debe mostrarse sin recortar (peinado). "top" es la
// categoría interna que junta peinado Y gorro (así lo espera DiceBear) — solo el gorro
// (subcategory === 'hat') se recorta; el peinado se ve completo.
export function pieceCropStyle(piece) {
  const key = piece.category === 'top' ? piece.subcategory : piece.category
  const region = CROP_REGIONS[key]
  if (!region) return null
  const { x, y, zoom } = region
  return {
    position: 'absolute',
    width: `${zoom * 100}%`,
    height: `${zoom * 100}%`,
    left: `${50 - x * zoom * 100}%`,
    top: `${50 - y * zoom * 100}%`,
    maxWidth: 'none',
  }
}
