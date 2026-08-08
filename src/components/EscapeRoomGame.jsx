import { useEffect, useRef, useState } from 'react'
import { Users, Copy, LogOut, Play, X, CheckCircle2, XCircle, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import MathText from '@/lib/mathText'

const POLL_MS = 3000

export default function EscapeRoomGame({ mission }) {
  const { user, refresh } = useAuth()
  const [room, setRoom] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const pollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  const refreshState = async (roomId) => {
    try {
      const state = await api.rooms.state(roomId)
      setRoom(state)
      if (state.status === 'done') {
        stopPolling()
        await refresh()
      }
    } catch {
      setRoom(null)
      stopPolling()
    }
  }

  useEffect(() => stopPolling, [])

  const startPolling = (roomId) => {
    stopPolling()
    pollRef.current = setInterval(() => refreshState(roomId), POLL_MS)
  }

  const handleCreate = async () => {
    setBusy(true)
    setError('')
    try {
      const state = await api.rooms.create(mission.id)
      setRoom(state)
      startPolling(state.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setBusy(true)
    setError('')
    try {
      const state = await api.rooms.join(joinCode.trim())
      setRoom(state)
      startPolling(state.id)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleStart = async () => {
    setBusy(true)
    setError('')
    try {
      const state = await api.rooms.start(room.id)
      setRoom(state)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    stopPolling()
    await api.rooms.cancel(room.id).catch(() => {})
    setRoom(null)
  }

  const handleLeave = async () => {
    stopPolling()
    await api.rooms.leave(room.id).catch(() => {})
    setRoom(null)
    setSelected(null)
    setFeedback(null)
  }

  const handleAnswer = async () => {
    if (selected === null) return
    setBusy(true)
    setError('')
    try {
      const res = await api.rooms.answer(room.id, selected)
      // Si acertó, el servidor ya avanzó la sala (o la cerró) — esa version nueva
      // se guarda aparte y solo se aplica cuando el jugador confirma "Siguiente",
      // para que primero vea la retroalimentación del acertijo que resolvió.
      setFeedback({ isCorrect: res.is_correct, explanation: res.explanation, nextRoom: res.room || null })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleNext = () => {
    if (feedback?.nextRoom) setRoom(feedback.nextRoom)
    setSelected(null)
    setFeedback(null)
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code).catch(() => {})
  }

  // Sin sala: elegir crear una nueva o unirse con un código.
  if (!room) {
    return (
      <div>
        <p className="text-xs font-mono-lab text-ink/35 mb-3">MISIÓN COOPERATIVA — SE JUEGA EN SALA</p>
        <p className="text-sm text-ink/60 mb-4">
          Esta misión se resuelve en equipo, por turnos. Crea una sala y comparte el código con tus compañeros, o únete a una que ya exista.
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-ink/10 rounded-lg p-4">
            <p className="font-display font-medium text-ink mb-2">Crear sala</p>
            <p className="text-xs text-ink/40 mb-3">Tú serás el anfitrión y decidirás cuándo empezar.</p>
            <button
              onClick={handleCreate}
              disabled={busy}
              className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
            >
              Crear sala
            </button>
          </div>
          <div className="border border-ink/10 rounded-lg p-4">
            <p className="font-display font-medium text-ink mb-2">Unirme con código</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ej: F7K2M"
              maxLength={5}
              className="w-full border border-ink/10 rounded-lg px-3 py-2 text-sm font-mono-lab mb-3 tracking-widest uppercase"
            />
            <button
              onClick={handleJoin}
              disabled={busy || !joinCode.trim()}
              className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
            >
              Unirme
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isHost = room.host_user_id === user?.id

  // Lobby: esperando a que se una gente y a que el anfitrion empiece.
  if (room.status === 'lobby') {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono-lab text-ink/35">SALA DE ESPERA</p>
          <button onClick={copyCode} className="flex items-center gap-1.5 text-sm font-mono-lab bg-ink/5 hover:bg-ink/10 transition-colors rounded-lg px-3 py-1.5">
            <span className="tracking-widest font-semibold text-coral">{room.code}</span>
            <Copy className="w-3.5 h-3.5 text-ink/40" />
          </button>
        </div>
        <p className="text-sm text-ink/60 mb-4">Comparte el código con tus compañeros. Máximo {room.max_members} personas (hay {room.total_puzzles} acertijos, uno por turno).</p>

        <div className="space-y-2 mb-4">
          {room.members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2 border border-ink/10 rounded-lg px-3 py-2 text-sm">
              <Users className="w-4 h-4 text-ink/30" />
              <span className="text-ink/80">{m.full_name}</span>
              {m.user_id === room.host_user_id && <span className="text-[10px] font-mono-lab text-coral">ANFITRIÓN</span>}
              {m.user_id === user?.id && <span className="text-[10px] font-mono-lab text-ink/30">(TÚ)</span>}
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          {isHost ? (
            <>
              <button
                onClick={handleStart}
                disabled={busy || room.members.length < 2}
                className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30 flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Empezar
              </button>
              <button onClick={handleCancel} className="border border-ink/15 hover:bg-ink/5 transition-colors text-ink/70 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2">
                <X className="w-4 h-4" /> Cancelar sala
              </button>
            </>
          ) : (
            <button onClick={handleLeave} className="border border-ink/15 hover:bg-ink/5 transition-colors text-ink/70 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Salir de la sala
            </button>
          )}
        </div>
        {isHost && room.members.length < 2 && (
          <p className="text-xs text-ink/40 mt-2">Necesitas al menos un compañero más para empezar.</p>
        )}
      </div>
    )
  }

  // Terminado: resumen.
  if (room.status === 'done') {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-gold/15">
          <Trophy className="w-7 h-7 text-gold" />
        </div>
        <h2 className="text-xl font-display font-bold text-ink">¡Sala completada!</h2>
        <p className="text-ink/50 mt-1">Todo el equipo resolvió los {room.total_puzzles} sistemas críticos.</p>
        <div className="text-left mt-6 space-y-2 max-w-sm mx-auto">
          {room.members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2 bg-teal/5 rounded-lg px-3 py-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
              <span className="text-ink/70">{m.full_name}{m.user_id === user?.id ? ' (tú)' : ''}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleLeave}
          className="mt-6 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          Salir de la sala
        </button>
      </div>
    )
  }

  // Jugando: acertijo actual, solo el que tiene el turno puede responder.
  const myTurn = room.my_turn
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono-lab text-ink/40">SISTEMA {room.current_puzzle_index + 1} / {room.total_puzzles}</span>
        <button onClick={handleLeave} className="text-xs text-ink/40 hover:text-red-500 transition-colors flex items-center gap-1">
          <LogOut className="w-3.5 h-3.5" /> Salir
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {room.members.map((m, i) => (
          <span
            key={m.user_id}
            className={`text-[11px] font-mono-lab px-2 py-1 rounded-full ${
              m.user_id === room.turn_user_id ? 'bg-coral text-white' : 'bg-ink/5 text-ink/40'
            }`}
          >
            {m.full_name}{m.user_id === user?.id ? ' (tú)' : ''}
          </span>
        ))}
      </div>

      {room.puzzle && (
        <>
          <p className="font-display font-medium text-ink mb-4"><MathText text={room.puzzle.question} /></p>
          <div className="space-y-2">
            {room.puzzle.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => myTurn && !feedback && setSelected(i)}
                disabled={!myTurn || !!feedback}
                className={`w-full text-left border rounded-lg px-4 py-2.5 text-sm font-mono-lab transition-colors ${
                  selected === i ? 'border-coral bg-coral/5' : 'border-ink/10'
                } ${feedback?.isCorrect && selected === i ? 'border-teal bg-teal/10' : ''} ${
                  feedback && !feedback.isCorrect && selected === i ? 'border-red-400 bg-red-50' : ''
                } ${!myTurn ? 'opacity-50' : ''}`}
              >
                <MathText text={opt} />
              </button>
            ))}
          </div>
        </>
      )}

      {!myTurn && !feedback && (
        <p className="text-sm text-ink/40 mt-4">Esperando a que {room.members.find((m) => m.user_id === room.turn_user_id)?.full_name} resuelva este sistema…</p>
      )}

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {feedback && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 ${feedback.isCorrect ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'}`}>
          {feedback.isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{feedback.isCorrect ? '¡Correcto! Sistema restaurado.' : 'No es correcto, inténtalo de nuevo.'} {feedback.explanation}</span>
        </div>
      )}

      {myTurn && (
        <div className="mt-4">
          {!feedback ? (
            <button onClick={handleAnswer} disabled={selected === null || busy} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30">
              Verificar
            </button>
          ) : (
            <button onClick={handleNext} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium">
              {feedback.isCorrect ? (feedback.nextRoom?.status === 'done' ? 'Ver resultado' : 'Siguiente sistema') : 'Reintentar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
