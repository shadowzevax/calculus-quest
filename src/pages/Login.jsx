import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import MiniCurve from '@/components/MiniCurve'
import { buildAvatarDataUri } from '@/lib/avatarBuilder'

const PRESETS = [
  { id: 'm1', gender: 'male', top: 'shortFlat', clothing: 'shirtCrewNeck', clothesColor: '5199e4', skinColor: 'edb98a', hairColor: '2c1b18' },
  { id: 'm2', gender: 'male', top: 'shortRound', clothing: 'hoodie', clothesColor: '25557c', skinColor: 'd08b5b', hairColor: '4a312c' },
  { id: 'f1', gender: 'female', top: 'bob', clothing: 'shirtCrewNeck', clothesColor: 'ff488e', skinColor: 'edb98a', hairColor: '2c1b18' },
  { id: 'f2', gender: 'female', top: 'bun', clothing: 'hoodie', clothesColor: 'ffafb9', skinColor: 'd08b5b', hairColor: '724133' },
]

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [presetId, setPresetId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const previews = useMemo(
    () => PRESETS.map((p) => ({ ...p, uri: buildAvatarDataUri({ ...p, eyes: 'default', eyebrows: 'default', mouth: 'smile', seed: p.id }) })),
    []
  )

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register' && !presetId) {
      setError('Elige un avatar para empezar.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        const preset = PRESETS.find((p) => p.id === presetId)
        await register({
          email, password, full_name: fullName,
          avatar_gender: preset.gender,
          avatar_config: { top: preset.top, clothing: preset.clothing, clothesColor: preset.clothesColor, skinColor: preset.skinColor, hairColor: preset.hairColor },
        })
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-ink/10 shadow-sm p-8 font-body">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-lg bg-coral/10 border border-coral/30 flex items-center justify-center">
          <MiniCurve seed="login" width={26} height={20} stroke="#FF6B4A" animate={false} />
        </div>
        <div>
          <div className="font-display font-semibold text-ink leading-tight">FuncionLab</div>
          <div className="text-[11px] font-mono-lab text-ink/40">LABORATORIO DEL FUTURO</div>
        </div>
      </div>

      <h1 className="text-xl font-display font-semibold text-ink mb-1">
        {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
      </h1>
      <p className="text-sm text-ink/50 mb-6">
        {mode === 'login' ? 'Continúa tu recorrido por el laboratorio.' : 'Empieza a resolver misiones y ganar XP.'}
      </p>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && (
          <>
            <input
              className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <div>
              <p className="text-sm text-ink/50 mb-2">Elige tu avatar (podrás personalizarlo más adelante)</p>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetId(p.id)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      presetId === p.id ? 'border-coral' : 'border-transparent hover:border-ink/15'
                    }`}
                  >
                    <img src={p.uri} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <input
          className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-coral hover:bg-coral/90 transition-colors text-white rounded-lg px-3 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
      </form>
      <button
        className="text-sm text-coral mt-4 font-medium"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  )
}
