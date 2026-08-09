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
const CATEGORIES = ['hair', 'hat', 'clothing', 'accessories', 'facialHair', 'clothingGraphic']
// Ojos/cejas/boca no se desbloquean por progreso (no hay suficiente variedad "emocionante" para
// repartir como recompensa) — quedan libres desde el inicio, igual que los colores.
const FREE_CATEGORIES = ['eyes', 'eyebrows', 'mouth']
const FREE_VALUES = {
  eyes: ['default', 'happy', 'side', 'squint', 'wink', 'surprised', 'closed', 'cry', 'eyeRoll', 'hearts', 'winkWacky', 'xDizzy'],
  eyebrows: ['default', 'defaultNatural', 'raisedExcited', 'raisedExcitedNatural', 'sadConcerned', 'sadConcernedNatural', 'upDown', 'upDownNatural', 'angry', 'angryNatural', 'flatNatural', 'frownNatural', 'unibrowNatural'],
  mouth: ['smile', 'default', 'twinkle', 'serious', 'disbelief', 'concerned', 'sad', 'eating', 'grimace', 'screamOpen', 'tongue', 'vomit'],
}
const FREE_LABELS = {
  default: 'Normal', happy: 'Felices', side: 'De lado', squint: 'Entrecerrados', wink: 'Guiño', surprised: 'Sorprendidos',
  closed: 'Cerrados', cry: 'Llorando', eyeRoll: 'En blanco', hearts: 'Enamorados', winkWacky: 'Guiño loco', xDizzy: 'Mareados',
  defaultNatural: 'Normal', raisedExcited: 'Emocionadas', raisedExcitedNatural: 'Emocionadas', sadConcerned: 'Preocupadas',
  sadConcernedNatural: 'Preocupadas', upDown: 'Asimétricas', upDownNatural: 'Asimétricas', angry: 'Enojadas', angryNatural: 'Enojadas',
  flatNatural: 'Rectas', frownNatural: 'Fruncidas', unibrowNatural: 'Unidas',
  smile: 'Sonriendo', twinkle: 'Pícara', serious: 'Seria', disbelief: 'Incrédula', concerned: 'Preocupada', sad: 'Triste',
  eating: 'Comiendo', grimace: 'Mueca', screamOpen: 'Grito', tongue: 'Lengua afuera', vomit: 'De asco',
}

const SKIN_COLORS = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c']
const HAIR_COLORS = ['a55728', '2c1b18', 'b58143', 'd6b370', '724133', '4a312c', 'f59797', 'ecdcbf', 'c93305', 'e8e1e1']
const CLOTHES_COLORS = ['262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'a7ffc4', 'ffafb9', 'ff488e', 'ff5c5c', 'ffffff']

const DEFAULT_CONFIG = {
  top: 'shortFlat', clothing: 'shirtCrewNeck', accessories: '', facialHair: '', clothingGraphic: '',
  skinColor: 'edb98a', hairColor: '2c1b18', clothesColor: '65c9ff',
  eyes: 'default', eyebrows: 'default', mouth: 'smile',
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
  const [config, setConfig] = useState(user.avatar_config || DEFAULT_CONFIG)
  const [tab, setTab] = useState('hair')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const loadCatalog = () => {
    api.profile.avatarCatalog().then((r) => {
      setPieces(r.pieces)
      setSpeedBonusCount(r.speed_bonus_count || 0)
      setGender(r.avatar_gender || null)
      if (r.config) setConfig(r.config)
    }).catch(() => {})
  }

  useEffect(loadCatalog, [])

  const chooseGender = async (g) => {
    setGender(g)
    try {
      await api.profile.update({ avatar_gender: g })
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
    if (FREE_CATEGORIES.includes(cat)) {
      return FREE_VALUES[cat].map((value) => ({ id: `${cat}-${value}`, category: cat, value, label: FREE_LABELS[value] || value, unlocked: true }))
    }
    if (cat === 'hair' || cat === 'hat') return pieces.filter((p) => p.category === 'top' && p.subcategory === cat)
    return pieces.filter((p) => p.category === cat)
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
        {[...CATEGORIES, ...FREE_CATEGORIES]
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
          const thumb = piece.unlocked ? buildAvatarDataUri({ ...config, [key]: piece.value, seed: user.full_name }) : null
          return (
            <button
              key={piece.id}
              type="button"
              disabled={!piece.unlocked}
              onClick={() => choose(tab, piece.value)}
              title={piece.unlocked ? piece.label : `${piece.label} — ${hint}`}
              className={`aspect-square rounded-lg border overflow-hidden flex items-center justify-center relative ${
                isSelected ? 'border-coral ring-2 ring-coral/40' : 'border-ink/10'
              } ${!piece.unlocked ? 'bg-ink/5' : 'bg-white hover:border-coral/40'}`}
            >
              {piece.unlocked ? (
                thumb && <img src={thumb} alt={piece.label} className="w-full h-full object-cover" />
              ) : (
                <Lock className="w-4 h-4 text-ink/25" />
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
        <div>
          <p className="text-xs font-mono-lab text-ink/40 mb-1.5">COLOR DE PIEL</p>
          <div className="flex gap-1.5 flex-wrap">
            {SKIN_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setConfig((cfg) => ({ ...cfg, skinColor: c }))}
                className={`w-6 h-6 rounded-full border-2 ${config.skinColor === c ? 'border-coral' : 'border-transparent'}`}
                style={{ backgroundColor: `#${c}` }} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono-lab text-ink/40 mb-1.5">COLOR DE PELO</p>
          <div className="flex gap-1.5 flex-wrap">
            {HAIR_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setConfig((cfg) => ({ ...cfg, hairColor: c }))}
                className={`w-6 h-6 rounded-full border-2 ${config.hairColor === c ? 'border-coral' : 'border-transparent'}`}
                style={{ backgroundColor: `#${c}` }} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-mono-lab text-ink/40 mb-1.5">COLOR DE ROPA</p>
          <div className="flex gap-1.5 flex-wrap">
            {CLOTHES_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setConfig((cfg) => ({ ...cfg, clothesColor: c }))}
                className={`w-6 h-6 rounded-full border-2 ${config.clothesColor === c ? 'border-coral' : 'border-transparent'}`}
                style={{ backgroundColor: `#${c}` }} />
            ))}
          </div>
        </div>
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
