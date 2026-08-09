import { useEffect, useMemo, useState } from 'react'
import { Lock, Zap, Check } from 'lucide-react'
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
  if (piece.unlock_type === 'speed') return `Se desbloquea tras ganar el bono de velocidad ${piece.speed_tier * 3} veces`
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
      if (r.config) {
        setConfig(r.config)
      } else if (r.avatar_gender) {
        // Cuenta vieja de antes de este sistema: ya tiene género elegido pero nunca se le
        // guardó un avatar_config — se le asigna el mismo por defecto que a una cuenta nueva
        // y se guarda, para que también reciba el color inicial desbloqueado.
        const fallback = defaultConfigFor(r.avatar_gender)
        setConfig(fallback)
        api.profile.update({ avatar_config: fallback }).catch(() => {})
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

  const byCategory = (cat) => {
    if (cat === 'hair' || cat === 'hat') return pieces.filter((p) => p.category === 'top' && p.subcategory === cat)
    return pieces.filter((p) => p.category === cat)
  }

  // Los colores tienen nombres tipo "Piel 3", "Color de pelo 7" — se muestran en ese orden
  // numérico (no en el orden en que la base de datos los reparte entre misiones), para que la
  // grilla sea predecible y fácil de recorrer.
  const byColorCategory = (key) => pieces
    .filter((p) => p.category === key)
    .sort((a, b) => (parseInt(a.label.match(/\d+/)?.[0] || 0, 10) - parseInt(b.label.match(/\d+/)?.[0] || 0, 10)))

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
              {piece.unlocked && piece.unlock_type !== 'starter' && (
                <span className="absolute -bottom-1 -right-1 bg-teal rounded-full p-0.5 ring-2 ring-white">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
        {/* Opción "ninguno" para accesorios/vello facial/estampado/gorro, que son opcionales */}
        {['accessories', 'facialHair', 'clothingGraphic', 'hat'].includes(tab) && (
          <button
            type="button"
            onClick={() => setConfig((c) => ({ ...c, [configKey(tab)]: '' }))}
            className={`aspect-square rounded-lg border text-[10px] font-mono-lab text-ink/40 ${
              !config[configKey(tab)] ? 'border-coral ring-2 ring-coral/40' : 'border-ink/10 hover:border-coral/40'
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
                    {piece.unlocked && piece.unlock_type !== 'starter' && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-teal rounded-full p-0.5">
                        <Check className="w-2 h-2 text-white" strokeWidth={3} />
                      </span>
                    )}
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
