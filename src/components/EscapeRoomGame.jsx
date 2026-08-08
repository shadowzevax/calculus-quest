import { useEffect, useRef, useState } from 'react'
import { Users, Copy, LogOut, Play, X, CheckCircle2, XCircle, Trophy, Zap } from 'lucide-react'
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

  // Estado del tablero de memoria del Sistema 6 (es local a cada jugador — cada quien
  // baraja y juega su propio tablero, solo el tiempo total se manda al servidor).
  const [cardBoard, setCardBoard] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matchedPairs, setMatchedPairs] = useState(new Set())
  const [cardsSubmitted, setCardsSubmitted] = useState(false)
  const cardsStartRef = useRef(0)

  const resetCardsState = () => {
    setCardBoard([])
    setFlipped([])
    setMatchedPairs(new Set())
    setCardsSubmitted(false)
    cardsStartRef.current = 0
  }

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  const refreshState = async (roomId) => {
    try {
      const state = await api.rooms.state(roomId)
      setRoom(state)
      // No se deja de sondear al llegar a "done" — la sala puede seguir avanzando al
      // Sistema 6 si el anfitrión lo inicia, y hay que enterarse aunque no sea el host.
      if (state.status === 'done' || state.status === 'cards_done') await refresh()
    } catch {
      setRoom(null)
      stopPolling()
    }
  }

  // Al entrar a la misión, si el usuario ya estaba en una sala activa (por ejemplo,
  // recargó la página a mitad de partida) se reconecta solo, en vez de dejarlo varado
  // en la pantalla de "crear/unirse" sin poder volver a lo que ya tenía en curso.
  useEffect(() => {
    api.rooms.myActiveRoom(mission.id).then((state) => {
      if (state) {
        setRoom(state)
        startPolling(state.id)
      }
    }).catch(() => {})
    return stopPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id])

  // Arma y baraja el tablero de memoria en cuanto la sala entra a 'cards' — una sola
  // vez por partida (si ya hay cartas armadas no se vuelve a barajar en cada sondeo).
  useEffect(() => {
    if (room?.status === 'cards' && room.cards && cardBoard.length === 0) {
      setCardBoard([...room.cards].sort(() => Math.random() - 0.5))
      cardsStartRef.current = Date.now()
    }
  }, [room?.status, room?.cards, cardBoard.length])

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
    resetCardsState()
  }

  const handleLeave = async () => {
    stopPolling()
    await api.rooms.leave(room.id).catch(() => {})
    setRoom(null)
    setSelected(null)
    setFeedback(null)
    resetCardsState()
  }

  const handleStartCards = async () => {
    setBusy(true)
    setError('')
    try {
      const state = await api.rooms.startCards(room.id)
      setRoom(state)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // Voltea dos cartas; si combinan quedan reveladas, si no se voltean de nuevo.
  // Al completar todas las parejas se manda el tiempo total al servidor.
  const handleCardClick = (index) => {
    if (cardsSubmitted || flipped.length === 2) return
    if (flipped.includes(index) || matchedPairs.has(cardBoard[index].pairId)) return

    const next = [...flipped, index]
    setFlipped(next)
    if (next.length < 2) return

    const [i1, i2] = next
    if (cardBoard[i1].pairId === cardBoard[i2].pairId) {
      setTimeout(() => {
        setMatchedPairs((prev) => {
          const updated = new Set(prev)
          updated.add(cardBoard[i1].pairId)
          if (updated.size === cardBoard.length / 2) finishCards()
          return updated
        })
        setFlipped([])
      }, 400)
    } else {
      setTimeout(() => setFlipped([]), 800)
    }
  }

  const finishCards = async () => {
    const elapsed = Date.now() - cardsStartRef.current
    setCardsSubmitted(true)
    try {
      const state = await api.rooms.submitCardsTime(room.id, elapsed)
      setRoom(state)
    } catch (e) {
      setError(e.message)
    }
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
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="flex items-center justify-center gap-3 mt-6">
          {isHost && (
            <button
              onClick={handleStartCards}
              disabled={busy}
              className="bg-gold hover:bg-gold/80 transition-colors text-white rounded-lg px-5 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-30"
            >
              <Zap className="w-4 h-4" /> Jugar Sistema 6 (desempate)
            </button>
          )}
          <button
            onClick={handleLeave}
            className="border border-ink/15 hover:bg-ink/5 transition-colors text-ink/70 rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            Salir de la sala
          </button>
        </div>
        <p className="text-xs text-ink/35 mt-3">
          El Sistema 6 es opcional: un desafío de memoria individual (todo el equipo juega a la vez) que
          no da XP, solo sirve para desempatar el ranking si varios llegan al mismo puntaje.
        </p>
      </div>
    )
  }

  // Sistema 6: memoria de cartas — todo el equipo juega su propio tablero a la vez.
  if (room.status === 'cards') {
    const totalPairs = (room.cards?.length || 0) / 2
    return (
      <div>
        <p className="text-xs font-mono-lab text-ink/35 mb-3">
          SISTEMA 6 · DESAFÍO DE VELOCIDAD (no da XP, solo desempata el ranking)
        </p>

        {!cardsSubmitted ? (
          <>
            <p className="text-sm text-ink/60 mb-4">
              Encuentra las {totalPairs} parejas lo más rápido posible. Tu equipo juega su propio
              tablero al mismo tiempo que vos.
            </p>
            {cardBoard.length === 0 ? (
              <p className="text-ink/40 text-sm">Preparando tablero…</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-w-md">
                {cardBoard.map((card, i) => {
                  const isRevealed = flipped.includes(i) || matchedPairs.has(card.pairId)
                  const isMatched = matchedPairs.has(card.pairId)
                  return (
                    <button
                      key={card.cardId}
                      onClick={() => handleCardClick(i)}
                      disabled={isMatched}
                      className={`aspect-square rounded-lg border text-[11px] font-mono-lab p-1.5 flex items-center justify-center text-center transition-colors ${
                        isMatched
                          ? 'bg-teal/10 border-teal/30 text-teal'
                          : isRevealed
                            ? 'bg-white border-coral text-ink'
                            : 'bg-blueprint/10 border-blueprint/20 text-blueprint/30 hover:border-blueprint/40'
                      }`}
                    >
                      {isRevealed ? <MathText text={card.text} /> : '?'}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="text-sm text-teal font-medium mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> ¡Listo! Esperando a que tu equipo termine…
            </p>
            <div className="space-y-1.5 max-w-sm">
              {room.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-ink/[0.03]">
                  <span className="text-ink/70">{m.full_name}{m.user_id === user?.id ? ' (tú)' : ''}</span>
                  {m.cards_time_ms !== null
                    ? <CheckCircle2 className="w-4 h-4 text-teal" />
                    : <span className="text-ink/30 text-xs font-mono-lab">jugando…</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>
    )
  }

  // Sistema 6 terminado por todo el equipo: resumen de tiempos (solo por diversión).
  if (room.status === 'cards_done') {
    const sorted = [...room.members].filter((m) => m.cards_time_ms != null).sort((a, b) => a.cards_time_ms - b.cards_time_ms)
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-gold/15">
          <Zap className="w-7 h-7 text-gold" />
        </div>
        <h2 className="text-xl font-display font-bold text-ink">¡Sistema 6 completado!</h2>
        <p className="text-ink/50 mt-1">Así les fue a todos en tu equipo:</p>
        <div className="text-left mt-6 space-y-2 max-w-sm mx-auto">
          {sorted.map((m, i) => (
            <div key={m.user_id} className="flex items-center justify-between bg-ink/[0.03] rounded-lg px-3 py-2 text-sm">
              <span className="text-ink/70">#{i + 1} {m.full_name}{m.user_id === user?.id ? ' (tú)' : ''}</span>
              <span className="font-mono-lab text-xs text-ink/50">{(m.cards_time_ms / 1000).toFixed(1)}s</span>
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
