import { useEffect, useRef, useState } from 'react'
import { Ghost, Heart, HeartCrack } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const ROWS = 11
const COLS = 17
const CELL = 26 // px
const START_LIVES = 2

// Laberinto tipo rejilla: paredes en el borde + "pilares" sueltos en las celdas (impar,impar)
// — deja calles de 1 celda en todas las direcciones y garantiza que todo quede conectado,
// sin tener que dibujar un laberinto de Pac-Man real a mano.
function buildMaze() {
  const grid = []
  for (let r = 0; r < ROWS; r++) {
    const row = []
    for (let c = 0; c < COLS; c++) {
      const border = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1
      const pillar = r % 2 === 1 && c % 2 === 1
      row.push(border || pillar ? 1 : 0) // 1 = pared, 0 = camino
    }
    grid.push(row)
  }
  return grid
}
const MAZE = buildMaze()

const ANSWER_SPOTS = [
  { r: 1, c: 2 },
  { r: 1, c: COLS - 3 },
  { r: ROWS - 2, c: 2 },
  { r: ROWS - 2, c: COLS - 3 },
]
const SPOT_COLORS = ['#3FBFAD', '#FF6B4A', '#F0A93C', '#9B5DE5']
const SPOT_LETTERS = ['A', 'B', 'C', 'D']
const PLAYER_START = { r: ROWS - 2, c: Math.floor(COLS / 2) }
const GHOST_STARTS = [
  { r: Math.floor(ROWS / 2) - 1, c: Math.floor(COLS / 2) },
  { r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2) },
]

const DIR_VECTORS = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
  w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
}
// Rotacion del "gajo" de la boca de Pac-Man segun hacia donde mira.
const FACE_ROTATION = { ArrowRight: 0, ArrowDown: 90, ArrowLeft: 180, ArrowUp: 270, d: 0, s: 90, a: 180, w: 270 }

function isPath(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS && MAZE[r][c] === 0
}

// BFS: primer paso del camino mas corto entre dos celdas — asi los fantasmas persiguen de
// verdad al jugador en vez de moverse al azar.
function nextStepTowards(fr, fc, tr, tc) {
  if (fr === tr && fc === tc) return { r: fr, c: fc }
  const visited = new Set([`${fr},${fc}`])
  const queue = [{ r: fr, c: fc, first: null }]
  while (queue.length) {
    const cur = queue.shift()
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = cur.r + dr
      const nc = cur.c + dc
      if (!isPath(nr, nc)) continue
      const key = `${nr},${nc}`
      if (visited.has(key)) continue
      visited.add(key)
      const first = cur.first || { r: nr, c: nc }
      if (nr === tr && nc === tc) return first
      queue.push({ r: nr, c: nc, first })
    }
  }
  return { r: fr, c: fc }
}

// Misión 3 — Laberinto (calca de Pac-Man): el jugador amarillo se controla con las flechas
// del teclado y debe llegar a la celda de la respuesta correcta; dos fantasmas lo persiguen
// por el laberinto. Se pierde una vida si un fantasma lo atrapa o si llega a una respuesta
// incorrecta — con 2 vidas, al perder la segunda el intento cuenta como incorrecto.
export default function PacManGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-blueprint">
          <Ghost className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Esquiva a los fantasmas emparejando cada pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="LABERINTO" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <MazeBoard key={index} options={current.options} correctIndex={current.correctIndex} feedback={feedback} onResolve={checkChoice} />
      ) : (
        <div className="border-2 border-dashed border-blueprint/30 rounded-xl p-4">
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}

function MazeBoard({ options, correctIndex, feedback, onResolve }) {
  const [lives, setLives] = useState(START_LIVES)
  const [player, setPlayer] = useState(PLAYER_START)
  const [facing, setFacing] = useState('ArrowLeft')
  const [ghosts, setGhosts] = useState(GHOST_STARTS)
  const [eaten, setEaten] = useState([])
  const [resolved, setResolved] = useState(false)
  const dirRef = useRef(null)

  const spots = ANSWER_SPOTS.slice(0, options.length)

  // Controles: flechas o WASD. preventDefault en las flechas para que no haga scroll la pagina.
  useEffect(() => {
    const onKey = (e) => {
      if (!DIR_VECTORS[e.key]) return
      dirRef.current = e.key
      setFacing(e.key)
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const paused = resolved || !!feedback

  // Movimiento del jugador (un paso por tick si la direccion pedida no choca con una pared).
  useEffect(() => {
    if (paused) return
    const tick = setInterval(() => {
      setPlayer((p) => {
        const dir = dirRef.current
        if (!dir) return p
        const [dr, dc] = DIR_VECTORS[dir]
        const nr = p.r + dr
        const nc = p.c + dc
        return isPath(nr, nc) ? { r: nr, c: nc } : p
      })
    }, 160)
    return () => clearInterval(tick)
  }, [paused])

  // Los fantasmas persiguen al jugador por el camino mas corto, un paso por tick.
  useEffect(() => {
    if (paused) return
    const tick = setInterval(() => {
      setGhosts((gs) => gs.map((g) => nextStepTowards(g.r, g.c, player.r, player.c)))
    }, 260)
    return () => clearInterval(tick)
  }, [player, paused])

  // Un fantasma alcanza al jugador -> pierde una vida (o termina el intento si ya no le quedan).
  useEffect(() => {
    if (paused) return
    const caught = ghosts.some((g) => g.r === player.r && g.c === player.c)
    if (!caught) return
    setLives((l) => {
      const remaining = l - 1
      if (remaining <= 0) {
        setResolved(true)
        onResolve(-1)
      } else {
        setPlayer(PLAYER_START)
        setGhosts(GHOST_STARTS)
      }
      return Math.max(remaining, 0)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ghosts, player, paused])

  // El jugador llega a una celda de respuesta.
  useEffect(() => {
    if (paused) return
    const spotIdx = spots.findIndex((s, i) => s.r === player.r && s.c === player.c && !eaten.includes(i))
    if (spotIdx === -1) return
    if (spotIdx === correctIndex) {
      setResolved(true)
      onResolve(spotIdx)
      return
    }
    setEaten((e) => [...e, spotIdx])
    setLives((l) => {
      const remaining = l - 1
      if (remaining <= 0) {
        setResolved(true)
        onResolve(spotIdx)
      } else {
        setPlayer(PLAYER_START)
      }
      return Math.max(remaining, 0)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, paused])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-mono-lab text-ink/40">Mueve con las flechas del teclado (o WASD)</p>
        <div className="flex gap-1">
          {Array.from({ length: START_LIVES }).map((_, i) =>
            i < lives
              ? <Heart key={i} className="w-4 h-4 text-coral fill-coral" />
              : <HeartCrack key={i} className="w-4 h-4 text-ink/20" />
          )}
        </div>
      </div>

      <div
        className="relative mx-auto rounded-lg overflow-hidden"
        style={{ width: COLS * CELL, height: ROWS * CELL, background: '#050514', maxWidth: '100%' }}
      >
        {MAZE.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className="absolute"
              style={{
                left: c * CELL, top: r * CELL, width: CELL, height: CELL,
                backgroundColor: cell === 1 ? '#1B3A5C' : 'transparent',
                borderRadius: cell === 1 ? 4 : 0,
              }}
            >
              {cell === 0 && !spots.some((s) => s.r === r && s.c === c) && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-gold/50" />
                </div>
              )}
            </div>
          ))
        )}

        {spots.map((s, i) => (
          <div
            key={i}
            className={`absolute flex items-center justify-center text-[11px] font-bold text-white rounded-full transition-opacity ${eaten.includes(i) ? 'opacity-15' : ''}`}
            style={{ left: s.c * CELL + 3, top: s.r * CELL + 3, width: CELL - 6, height: CELL - 6, backgroundColor: SPOT_COLORS[i] }}
          >
            {SPOT_LETTERS[i]}
          </div>
        ))}

        {/* jugador */}
        <div
          className="absolute transition-all duration-150 ease-linear"
          style={{ left: player.c * CELL + 2, top: player.r * CELL + 2, width: CELL - 4, height: CELL - 4 }}
        >
          <div
            className="w-full h-full rounded-full bg-gold"
            style={{
              clipPath: 'polygon(100% 74%, 44% 50%, 100% 26%, 100% 0%, 0% 0%, 0% 100%, 100% 100%)',
              transform: `rotate(${FACE_ROTATION[facing] || 0}deg)`,
            }}
          />
        </div>

        {/* fantasmas */}
        {ghosts.map((g, i) => (
          <div
            key={i}
            className="absolute transition-all duration-200 ease-linear flex items-center justify-center"
            style={{ left: g.c * CELL + 1, top: g.r * CELL + 1, width: CELL - 2, height: CELL - 2 }}
          >
            <Ghost className="w-full h-full" style={{ color: i === 0 ? '#E76F51' : '#F4A6C6' }} fill="currentColor" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {options.map((opt, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs font-mono-lab bg-ink/[0.03] rounded-full px-2.5 py-1">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: SPOT_COLORS[i] }}>
              {SPOT_LETTERS[i]}
            </span>
            {opt}
          </span>
        ))}
      </div>
    </div>
  )
}
