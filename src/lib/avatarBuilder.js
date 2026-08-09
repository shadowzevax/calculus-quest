// Genera el SVG del avatar armable (Avataaars, via DiceBear) en el navegador — no depende
// de ningun servicio externo, igual que el resto de la personalizacion de perfil.
import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'

export function buildAvatarDataUri(config) {
  if (!config) return null
  const options = {}
  for (const key of ['top', 'accessories', 'facialHair', 'clothing', 'clothingGraphic', 'eyes', 'eyebrows', 'mouth']) {
    if (config[key]) options[key] = [config[key]]
  }
  for (const key of ['skinColor', 'hairColor', 'clothesColor', 'accessoriesColor', 'facialHairColor', 'hatColor']) {
    if (config[key]) options[key] = [config[key]]
  }
  // Sin esto, DiceBear elegia ojos/boca al azar segun el seed — con la misma semilla en todas
  // las miniaturas del "armario" (solo cambiaba la pieza que se estaba mostrando), terminaban
  // TODAS con la misma expresion rara (ojos cerrados, boca abierta). Se fuerza una expresion
  // neutral por defecto si el usuario no eligio otra.
  if (!options.eyes) options.eyes = ['default']
  if (!options.eyebrows) options.eyebrows = ['default']
  if (!options.mouth) options.mouth = ['smile']
  options.accessoriesProbability = config.accessories ? 100 : 0
  options.facialHairProbability = config.facialHair ? 100 : 0
  options.topProbability = 100

  const avatar = createAvatar(avataaars, { seed: config.seed || 'funcionlab', ...options })
  return avatar.toDataUri()
}
