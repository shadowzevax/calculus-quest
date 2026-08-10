import { useEffect, useMemo, useState } from 'react'
import { Lock, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { buildAvatarDataUri } from '@/lib/avatarBuilder'

const CATEGORY_LABELS = {
  hair: 'Peinado',
  hat: 'Gorro',
  accessories: 'Accesorios',
  facialHair: 'Vello facial',
  clothing: 'Ropa',
  clothingGraphic: 'Estampado de la ropa',
  eyes: 'Ojos',
  eyebrows: 'Cejas',
  mouth: 'Boca',
}
// "hair" y "hat" son las dos mitades de la categoria "top" de DiceBear — se separan aqui
// solo para la interfaz (el usuario pidio que no aparecieran mezcladas), pero las dos
// escriben en config.top porque asi lo espera la libreria.
const TAB_CONFIG_KEY = { hair: 'top', hat: 'top' }
const CATEGORIES = ['hair', 'hat', 'clothing', 'accessories', 'facialHair', 'clothingGraphic', 'eyes', 'eyebrows', 'mouth']

const COLOR_CATEGORIES = [
  { key: 'skinColor', label: 'COLOR DE PIEL' },
  { key: 'hairColor', label: 'COLOR DE PELO' },
  { key: 'clothesColor', label: 'COLOR DE ROPA' },
]

// El avatar por defecto de cada género — el mismo que se ofrece al elegir género por primera
// vez, tanto en el registro como en "Elegir avatar" de Mi Perfil.
function defaultConfigFor(gender) {
  return {
    top: gender === 'female' ? 'bob' : 'shortFlat',
    clothing: 'shirtCrewNeck', accessories: '', facialHair: '', clothingGraphic: '',
    skinColor: 'edb98a', hairColor: '2c1b18', clothesColor: gender === 'female' ? 'ff488e' : '5199e4',
    eyes: 'default', eyebrows: 'default', mouth: 'smile',
  }
}

function unlockHint(piece) {
  if (piece.unlock_type === 'starter') return null
  if (piece.unlock_type === 'mission') return `Se desbloquea al completar la misión ${piece.unlock_mission_order}`
  if (piece.unlock_type === 'finale') return 'Se desbloquea al completar la misión cooperativa (Escape Room)'
  if (piece.unlock_type === 'speed') return `Se desbloquea tras ganar el bono de velocidad ${piece.speed_tier * 5} veces`
  return null
}

export default function AvatarPicker({ user, onSaved }) {
  const [pieces, setPieces] = useState([])
  const [speedBonusCount, setSpeedBonusCount] = useState(0)
  const [gender, setGender] = useState(user.avatar_gender || null)
  const [config, setConfig] = useState(user.avatar_config || defaultConfigFor(user.avatar_gender))
  const [tab, setTab] = useState('hair')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const loadCatalog = () => {
    api.profile.avatarCatalog().then((r) => {
      setPieces(r.pieces)
      setSpeedBonusCount(r.speed_bonus_count || 0)
      setGender(r.avatar_gender || null)
      if (!r.config && r.avatar_gender) {
        // Cuenta vieja de antes de este sistema: ya tiene género elegido pero nunca se le
        // guardó un avatar_config — se le asigna el mismo por defecto que a una cuenta nueva
        // y se guarda, para que también reciba el color inicial desbloqueado.
        const fallback = defaultConfigFor(r.avatar_gender)
        setConfig(fallback)
        api.profile.update({ avatar_config: fallback }).catch(() => {})
        return
      }
      if (r.config) {
        // Cuentas guardadas antes de que ojos/cejas/boca existieran como piezas propias no
        // tienen esas claves en su avatar_config — sin ellas ningún tile de esas pestañas se
        // ve marcado como seleccionado. Se completan con los valores por defecto y se guarda,
        // para que la selección se vea bien de una vez y no en cada visita.
        const defaults = defaultConfigFor(r.avatar_gender)
        const missing = Object.keys(defaults).some((k) => r.config[k] === undefined)
        const merged = missing ? { ...defaults, ...r.config } : r.config
        setConfig(merged)
        if (missing) api.profile.update({ avatar_config: merged }).catch(() => {})
      }
    }).catch(() => {})
  }

  useEffect(loadCatalog, [])

  const chooseGender = async (g) => {
    setGender(g)
    // Al elegir género se guarda de una vez un avatar por defecto (la primera pieza starter
    // de ese género) — antes se quedaba con el config previo (a veces de otro género), y la
    // vista previa no coincidía con nada de lo que se veía desbloqueado en la grilla.
    const defaultConfig = defaultConfigFor(g)
    setConfig(defaultConfig)
    try {
      await api.profile.update({ avatar_gender: g, avatar_config: defaultConfig })
      loadCatalog()
      onSaved?.()
    } catch (e) {
      setError(e.message)
    }
  }

  const preview = useMemo(() => {
    try {
      return buildAvatarDataUri({ ...config, seed: user.full_name })
    } catch {
      return null
    }
  }, [config, user.full_name])

  // El valor por defecto de cada categoría (el mismo que trae el avatar inicial) va primero en
  // su grilla, para que sea lo primero que se vea al abrir esa pestaña.
  const FIRST_VALUE = {
    hair: gender === 'female' ? 'bob' : 'shortFlat',
    eyes: 'default',
    eyebrows: 'default',
    mouth: 'smile',
  }
  const sortFirst = (list, cat) => {
    const first = FIRST_VALUE[cat]
    if (!first) return list
    return [...list].sort((a, b) => (a.value === first ? -1 : b.value === first ? 1 : 0))
  }

  const byCategory = (cat) => {
    if (cat === 'hair') return sortFirst(pieces.filter((p) => p.category === 'top' && p.subcategory === 'hair'), 'hair')
    if (cat === 'hat') return pieces.filter((p) => p.category === 'top' && p.subcategory === cat)
    if (cat === 'eyes' || cat === 'eyebrows' || cat === 'mouth') return sortFirst(pieces.filter((p) => p.category === cat), cat)
    return pieces.filter((p) => p.category === cat)
  }

  // config.top guarda EITHER un peinado O un gorro (DiceBear los junta en un solo campo) — en
  // la pestaña Gorro, "Ninguno" debe verse seleccionado siempre que el valor actual sea un
  // peinado (o esté vacío), no solo cuando está vacío a secas.
  const hatValues = new Set(pieces.filter((p) => p.category === 'top' && p.subcategory === 'hat').map((p) => p.value))
  const noHatSelected = !config.top || !hatValues.has(config.top)

  // El color con el que ya arranca el avatar (el que se le otorgó al registrarse o elegir
  // género) va siempre primero — no tiene sentido que aparezca a mitad de la grilla solo
  // porque su número de etiqueta ("Piel 4", por ejemplo) cae ahí. El resto de colores, los
  // que sí se ganan como recompensa, se muestran después en su orden numérico ("Piel 1",
  // "Piel 2"...), que ya coincide con el orden real en que se van desbloqueando por misión.
  const byColorCategory = (key) => pieces
    .filter((p) => p.category === key)
    .sort((a, b) => {
      if (a.owned !== b.owned) return a.owned ? -1 : 1
      return parseInt(a.label.match(/\d+/)?.[0] || 0, 10) - parseInt(b.label.match(/\d+/)?.[0] || 0, 10)
    })

  const chooseColor = (key, piece) => {
    if (!piece.unlocked) return
    setConfig((c) => ({ ...c, [key]: piece.value }))
  }

  const configKey = (cat) => TAB_CONFIG_KEY[cat] || cat

  const choose = (cat, value) => {
    const key = configKey(cat)
    setConfig((c) => ({ ...c, [key]: c[key] === value ? '' : value }))
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await api.profile.update({ avatar_config: config })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const showGraphicTab = config.clothing === 'graphicShirt'
  const showFacialHairTab = gender !== 'female'

  if (!gender) {
    return (
      <div>
        <p className="text-sm text-ink/60 mb-4">Antes de armar tu avatar, elige con cuál empezar:</p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => chooseGender('male')}
            className="flex-1 border-2 border-transparent hover:border-blueprint/40 rounded-xl p-4 text-center transition-colors bg-blueprint/5"
          >
            <img src={buildAvatarDataUri({ top: 'shortFlat', clothing: 'shirtCrewNeck', clothesColor: '5199e4', skinColor: 'edb98a', hairColor: '2c1b18', eyes: 'default', eyebrows: 'default', mouth: 'smile', seed: 'm' })} alt="" className="w-20 h-20 mx-auto rounded-full mb-2" />
            <span className="text-sm font-medium text-blueprint">Avatar niño</span>
          </button>
          <button
            type="button"
            onClick={() => chooseGender('female')}
            className="flex-1 border-2 border-transparent hover:border-coral/40 rounded-xl p-4 text-center transition-colors bg-coral/5"
          >
            <img src={buildAvatarDataUri({ top: 'bob', clothing: 'shirtCrewNeck', clothesColor: 'ff488e', skinColor: 'edb98a', hairColor: '2c1b18', eyes: 'default', eyebrows: 'default', mouth: 'smile', seed: 'f' })} alt="" className="w-20 h-20 mx-auto rounded-full mb-2" />
            <span className="text-sm font-medium text-coral">Avatar niña</span>
          </button>
        </div>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-ink/5 border border-ink/10 shrink-0">
          {preview && <img src={preview} alt="" className="w-full h-full object-cover" />}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Arma tu avatar</p>
          <p className="text-xs text-ink/40">Vas ganando piezas nuevas al completar misiones y con el bono de velocidad.</p>
          {speedBonusCount > 0 && (
            <p className="text-[11px] font-mono-lab text-gold flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3" /> {speedBonusCount} bonos de velocidad ganados
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATEGORIES
          .filter((c) => c !== 'clothingGraphic' || showGraphicTab)
          .filter((c) => c !== 'facialHair' || showFacialHairTab)
          .map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setTab(cat)}
              className={`text-xs font-mono-lab px-3 py-1.5 rounded-full transition-colors ${
                tab === cat ? 'bg-blueprint text-white' : 'bg-ink/5 text-ink/50 hover:bg-ink/10'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
        {byCategory(tab).map((piece) => {
          const key = configKey(tab)
          const isSelected = config[key] === piece.value
          const hint = unlockHint(piece)
          const thumb = buildAvatarDataUri({ ...config, [key]: piece.value, seed: user.full_name })
          return (
            <button
              key={piece.id}
              type="button"
              disabled={!piece.unlocked}
              onClick={() => choose(tab, piece.value)}
              title={piece.unlocked ? piece.label : `${piece.label} — ${hint}`}
              className={`aspect-square rounded-lg border flex items-center justify-center relative ${
                isSelected ? 'border-coral ring-2 ring-coral/40' : 'border-ink/10'
              } ${!piece.unlocked ? 'bg-ink/5 cursor-not-allowed' : 'bg-white hover:border-coral/40'}`}
            >
              <span className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                {thumb && (
                  <img
                    src={thumb}
                    alt={piece.label}
                    className={`w-full h-full object-cover ${!piece.unlocked ? 'grayscale opacity-30' : ''}`}
                  />
                )}
                {!piece.unlocked && (
                  <Lock className="w-4 h-4 text-ink/50 absolute drop-shadow" />
                )}
              </span>
            </button>
          )
        })}
        {/* Opción "ninguno" para accesorios/vello facial/estampado/gorro, que son opcionales */}
        {['accessories', 'facialHair', 'clothingGraphic', 'hat'].includes(tab) && (
          <button
            type="button"
            onClick={() => setConfig((c) => ({ ...c, [configKey(tab)]: '' }))}
            className={`aspect-square rounded-lg border text-[10px] font-mono-lab text-ink/40 ${
              (tab === 'hat' ? noHatSelected : !config[configKey(tab)]) ? 'border-coral ring-2 ring-coral/40' : 'border-ink/10 hover:border-coral/40'
            }`}
          >
            Ninguno
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {COLOR_CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <p className="text-xs font-mono-lab text-ink/40 mb-1.5">{label}</p>
            <div className="flex gap-1.5 flex-wrap">
              {byColorCategory(key).map((piece) => {
                const isSelected = config[key] === piece.value
                const hint = unlockHint(piece)
                return (
                  <button
                    key={piece.id}
                    type="button"
                    disabled={!piece.unlocked}
                    onClick={() => chooseColor(key, piece)}
                    title={piece.unlocked ? piece.label : `${piece.label} — ${hint}`}
                    className={`relative w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-coral' : 'border-transparent'
                    } ${!piece.unlocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: `#${piece.value}` }}
                  >
                    {!piece.unlocked && <Lock className="w-2.5 h-2.5 text-white drop-shadow" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
      >
        Guardar avatar
      </button>
      {saved && <span className="text-teal text-sm ml-3">Guardado ✓</span>}
    </div>
  )
}
