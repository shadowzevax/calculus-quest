import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { api } from '@/lib/api'
import MiniCurve from '@/components/MiniCurve'
import { buildAvatarDataUri } from '@/lib/avatarBuilder'

// Botón de mostrar/ocultar dentro del propio campo — el gesto típico de cualquier login, para
// que el estudiante pueda revisar lo que escribió antes de enviarlo (sobre todo en celular,
// donde es fácil tocar una tecla vecina sin darse cuenta). `autoComplete` explícito (no
// autoComplete="off", que Chrome ignora en campos de contraseña) es necesario porque sin él el
// navegador no sabe si ofrecer/guardar la del login o la de cambio de clave, y en el perfil de
// pruebas de esta sesión llegó a autocompletar la contraseña real de otra cuenta guardada
// (hallazgo de la auditoría de calidad, 2026-09-21).
function PasswordInput({ value, onChange, placeholder, minLength, required, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        className="w-full border border-ink/15 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        minLength={minLength}
        required={required}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60 transition-colors"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

const PRESETS = [
  { id: 'm1', gender: 'male', top: 'shortFlat', clothing: 'shirtCrewNeck', clothesColor: '5199e4', skinColor: 'edb98a', hairColor: '2c1b18' },
  { id: 'm2', gender: 'male', top: 'shortRound', clothing: 'hoodie', clothesColor: '25557c', skinColor: 'd08b5b', hairColor: '4a312c' },
  { id: 'f1', gender: 'female', top: 'bob', clothing: 'shirtCrewNeck', clothesColor: 'ff488e', skinColor: 'edb98a', hairColor: '2c1b18' },
  { id: 'f2', gender: 'female', top: 'bun', clothing: 'hoodie', clothesColor: 'ffafb9', skinColor: 'd08b5b', hairColor: '724133' },
]

export default function Login() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()

  // Layout.jsx ya intercepta por completo cuando NO hay sesión (muestra este mismo componente
  // sin sidebar), así que este efecto solo cubre el caso de alguien YA logueado navegando a
  // /login a propósito (marcador guardado, historial del navegador, etc.) — antes se veía el
  // sidebar normal CON el formulario de login superpuesto encima, logo duplicado y todo
  // (hallazgo de la auditoría de calidad, 2026-09-21).
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [regCode, setRegCode] = useState('')
  const [presetId, setPresetId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetDone, setResetDone] = useState(false)

  const previews = useMemo(
    () => PRESETS.map((p) => ({ ...p, uri: buildAvatarDataUri({ ...p, eyes: 'default', eyebrows: 'default', mouth: 'smile', seed: p.id }) })),
    []
  )

  // Ya hay sesión: el efecto de arriba está redirigiendo, no hay nada que mostrar mientras tanto.
  if (user) return null

  // Antes, cambiar de modo (login/registro/recuperar) no limpiaba nada: una contraseña escrita
  // en un modo seguía apareciendo en el campo del siguiente, dando la falsa impresión de que
  // "quedó guardada de antes" (hallazgo de la auditoría de calidad, 2026-09-21). El correo sí
  // se conserva a propósito — es común querer registrarse o recuperar acceso con el mismo
  // correo que se acaba de escribir en otro modo.
  const switchMode = (next) => {
    setError('')
    setPassword('')
    setFullName('')
    setRegCode('')
    setPresetId('')
    setResetCode('')
    setNewPassword('')
    setMode(next)
  }

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
        navigate('/')
      } else if (mode === 'reset') {
        await api.auth.redeemResetCode(email, resetCode, newPassword)
        setResetDone(true)
        setMode('login')
        setPassword('')
      } else {
        const preset = PRESETS.find((p) => p.id === presetId)
        await register({
          email, password, full_name: fullName, reg_code: regCode,
          avatar_gender: preset.gender,
          avatar_config: { top: preset.top, clothing: preset.clothing, clothesColor: preset.clothesColor, skinColor: preset.skinColor, hairColor: preset.hairColor },
        })
        navigate('/')
      }
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
        {mode === 'login' ? 'Bienvenido de vuelta' : mode === 'reset' ? 'Recupera tu acceso' : 'Crea tu cuenta'}
      </h1>
      <p className="text-sm text-ink/50 mb-6">
        {mode === 'login'
          ? 'Continúa tu recorrido por el laboratorio.'
          : mode === 'reset'
            ? 'Escribe el código generado por tu docente y elige una contraseña nueva.'
            : 'Empieza a resolver misiones y ganar XP.'}
      </p>

      {resetDone && mode === 'login' && (
        <div className="bg-teal/10 border border-teal/30 text-teal text-sm rounded-lg p-3 mb-4">
          Listo, tu contraseña ya se actualizó. Inicia sesión con la nueva.
        </div>
      )}

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
          placeholder={mode === 'register' ? 'Correo institucional (@umariana.edu.co)' : 'Correo'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete={mode === 'register' ? 'email' : 'username'}
          required
        />
        {mode === 'reset' ? (
          <>
            <input
              className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
              placeholder="Código generado por tu docente"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              maxLength={6}
              required
            />
            <PasswordInput
              placeholder="Contraseña nueva (mín. 6 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
              required
            />
          </>
        ) : (
          <PasswordInput
            placeholder={mode === 'register' ? 'Contraseña (mín. 6 caracteres)' : 'Contraseña'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === 'register' ? 6 : undefined}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
          />
        )}
        {mode === 'register' && (
          <input
            className="w-full border border-ink/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral tracking-widest"
            placeholder="Código de registro (generado por tu docente)"
            value={regCode}
            onChange={(e) => setRegCode(e.target.value)}
            maxLength={4}
            required
          />
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-coral hover:bg-coral/90 transition-colors text-white rounded-lg px-3 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : mode === 'reset' ? 'Cambiar contraseña' : 'Registrarme'}
        </button>
      </form>
      <div className="flex flex-col items-start gap-1.5 mt-4">
        {mode !== 'reset' && (
          <button
            className="text-sm text-coral font-medium"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        )}
        {mode === 'login' && (
          <button
            className="text-sm text-ink/40 hover:text-ink/60 transition-colors"
            onClick={() => switchMode('reset')}
          >
            ¿Olvidaste tu contraseña? Tengo un código
          </button>
        )}
        {mode === 'reset' && (
          <button
            className="text-sm text-ink/40 hover:text-ink/60 transition-colors"
            onClick={() => switchMode('login')}
          >
            ← Volver a iniciar sesión
          </button>
        )}
      </div>
    </div>
  )
}
