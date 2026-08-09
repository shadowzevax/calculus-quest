import { useEffect, useMemo, useState } from 'react'
import { Lock, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { buildAvatarDataUri } from '@/lib/avatarBuilder'

const CATEGORY_LABELS = {
  top: 'Peinado / gorro',
  accessories: 'Accesorios',
  facialHair: 'Vello facial',
  clothing: 'Ropa',
  clothingGraphic: 'Estampado de la ropa',
}
const CATEGORIES = ['top', 'clothing', 'accessories', 'facialHair', 'clothingGraphic']

const SKIN_COLORS = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c']
const HAIR_COLORS = ['a55728', '2c1b18', 'b58143', 'd6b370', '724133', '4a312c', 'f59797', 'ecdcbf', 'c93305', 'e8e1e1']
const CLOTHES_COLORS = ['262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', '929598', '3c4f5c', 'a7ffc4', 'ffafb9', 'ff488e', 'ff5c5c', 'ffffff']

const DEFAULT_CONFIG = {
  top: 'shortFlat', clothing: 'shirtCrewNeck', accessories: '', facialHair: '', clothingGraphic: '',
  skinColor: 'edb98a', hairColor: '2c1b18', clothesColor: '65c9ff',
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
  const [config, setConfig] = useState(user.avatar_config || DEFAULT_CONFIG)
  const [tab, setTab] = useState('top')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.profile.avatarCatalog().then((r) => {
      setPieces(r.pieces)
      setSpeedBonusCount(r.speed_bonus_count || 0)
      if (r.config) setConfig(r.config)
    }).catch(() => {})
  }, [])

  const preview = useMemo(() => {
    try {
      return buildAvatarDataUri({ ...config, seed: user.full_name })
    } catch {
      return null
    }
  }, [config, user.full_name])

  const byCategory = (cat) => pieces.filter((p) => p.category === cat)

  const choose = (cat, value) => setConfig((c) => ({ ...c, [cat]: c[cat] === value ? '' : value }))

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
        {CATEGORIES.filter((c) => c !== 'clothingGraphic' || showGraphicTab).map((cat) => (
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

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-4">
        {byCategory(tab).map((piece) => {
          const isSelected = config[tab] === piece.value
          const hint = unlockHint(piece)
          const thumb = piece.unlocked ? buildAvatarDataUri({ ...config, [tab]: piece.value, seed: user.full_name }) : null
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
        {/* Opción "ninguno" para accesorios/vello facial/estampado, que son opcionales */}
        {['accessories', 'facialHair', 'clothingGraphic'].includes(tab) && (
          <button
            type="button"
            onClick={() => setConfig((c) => ({ ...c, [tab]: '' }))}
            className={`aspect-square rounded-lg border text-[10px] font-mono-lab text-ink/40 ${
              !config[tab] ? 'border-coral ring-2 ring-coral/40' : 'border-ink/10 hover:border-coral/40'
            }`}
          >
            Ninguno
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs font-mono-lab text-ink/40 mb-1.5">COLOR DE PIEL</p>
        <div className="flex gap-1.5">
          {SKIN_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setConfig((cfg) => ({ ...cfg, skinColor: c }))}
              className={`w-6 h-6 rounded-full border-2 ${config.skinColor === c ? 'border-coral' : 'border-transparent'}`}
              style={{ backgroundColor: `#${c}` }} />
          ))}
        </div>
      </div>
      <div className="mb-4">
        <p className="text-xs font-mono-lab text-ink/40 mb-1.5">COLOR DE PELO</p>
        <div className="flex gap-1.5 flex-wrap">
          {HAIR_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setConfig((cfg) => ({ ...cfg, hairColor: c }))}
              className={`w-6 h-6 rounded-full border-2 ${config.hairColor === c ? 'border-coral' : 'border-transparent'}`}
              style={{ backgroundColor: `#${c}` }} />
          ))}
        </div>
      </div>
      <div className="mb-4">
        <p className="text-xs font-mono-lab text-ink/40 mb-1.5">COLOR DE ROPA</p>
        <div className="flex gap-1.5 flex-wrap">
          {CLOTHES_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setConfig((cfg) => ({ ...cfg, clothesColor: c }))}
              className={`w-6 h-6 rounded-full border-2 ${config.clothesColor === c ? 'border-coral' : 'border-transparent'}`}
              style={{ backgroundColor: `#${c}` }} />
          ))}
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
