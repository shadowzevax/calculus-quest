import { useCallback, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { Terminal, Link2 } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, MathText } from './GameBits'
import './terminal-detective.css'

// Misión 7 — Terminal de datos.
//
// Antes: la consola era decorativa. El enunciado ya estaba visible, el botón "Ejecutar
// análisis" no imprimía nada (solo escondía las opciones 900 ms) y el menú numerado
// [1] [2] [3] prometía entrada por teclado que no existía: pulsar "1" no hacía nada.
//
// Ahora la consola SE MANEJA DE VERDAD: el estudiante escribe órdenes reales
// (`ejecutar`, `ayuda`, `repetir`, `sel <n>`), el comando imprime los registros línea a
// línea con tipeo progresivo, y las teclas 1-9 seleccionan el registro correspondiente.
// En celular las mismas órdenes están como botones táctiles y los registros se tocan.
const TYPE_MS = 18 // ms entre pulsos de tipeo
const CHUNK = 2 // caracteres por pulso (≈110 car/s: vivo pero no lento)
const LINE_GAP = 70 // pausa entre líneas

// Tonos con contraste suficiente sobre el fondo #0a0f0d (mínimo AA 4.5:1).
// El antiguo text-teal/40 y el placeholder text-teal/25 daban ~1.9:1 y eran ilegibles.
const TONE = {
  cmd: 'text-gold',
  sys: 'text-teal',
  data: 'text-[#D7F2EC]',
  note: 'text-teal/70',
  err: 'text-coral',
  ask: 'text-[#EAF7F4]',
}

const HELP_LINES = (kind, ready, count) => [
  { tone: 'note', text: '  ejecutar   recupera los registros de la consulta' },
  { tone: 'note', text: '  repetir    vuelve a imprimir la consulta' },
  kind === 'choice' && ready
    ? { tone: 'note', text: `  sel <n>    elige un registro (o pulsa 1-${count})` }
    : { tone: 'note', text: '  ayuda      muestra esta lista' },
]

export default function DataTerminalGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  const [lines, setLines] = useState([])
  const [printed, setPrinted] = useState(0) // líneas ya impresas por completo
  const [chars, setChars] = useState(0) // caracteres visibles de la línea en curso
  const [stage, setStage] = useState('brief') // brief = sin registros; ready = ya se ejecutó
  const [command, setCommand] = useState('')
  const logRef = useRef(null)
  const idRef = useRef(0)
  const stageRef = useRef('brief')
  const linesRef = useRef([])

  const kind = items.kind
  const prompt = current?.prompt
  const optionCount = kind === 'choice' && current ? current.options.length : 0
  const typing = printed < lines.length

  const mk = useCallback((list) => list.filter(Boolean).map((l) => ({ id: idRef.current++, ...l })), [])
  const push = useCallback(
    (list) => {
      const added = mk(list)
      setLines((prev) => [...prev, ...added])
    },
    [mk]
  )
  // `linesRef` deja leer cuántas líneas hay pendientes desde manejadores memorizados
  // (saltar el tipeo) sin volver a crearlos en cada render.
  useEffect(() => {
    linesRef.current = lines
  }, [lines])
  const skipTyping = useCallback(() => {
    setPrinted(linesRef.current.length)
    setChars(0)
  }, [])

  // Arranque de cada consulta: limpia la pantalla e imprime la cabecera + el enunciado.
  useEffect(() => {
    if (kind !== 'choice' && kind !== 'text') return
    idRef.current = 0
    setPrinted(0)
    setChars(0)
    setStage('brief')
    stageRef.current = 'brief'
    setCommand('')
    setLines(
      mk([
        { tone: 'cmd', text: `funcionlab@algebra:~$ abrir_consulta --id ${index + 1}`, instant: true },
        { tone: 'sys', text: `[ok] consulta ${index + 1}/${total} cargada · modo ${kind === 'choice' ? 'registro' : 'valor'}` },
        { tone: 'ask', text: prompt || '', math: true },
        { tone: 'note', text: 'escribe "ejecutar" para recuperar los datos ("ayuda" lista las órdenes)' },
      ])
    )
  }, [index, total, kind, prompt, mk])

  // Motor de tipeo: avanza de a CHUNK caracteres y luego pasa a la línea siguiente.
  useEffect(() => {
    if (printed >= lines.length) return
    const line = lines[printed]
    const len = line.text.length
    if (line.instant || chars >= len) {
      const t = setTimeout(() => {
        setPrinted((p) => p + 1)
        setChars(0)
      }, line.instant ? 30 : LINE_GAP)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setChars((c) => Math.min(len, c + CHUNK)), TYPE_MS)
    return () => clearTimeout(t)
  }, [lines, printed, chars])

  // El log se desplaza solo dentro de su caja (nunca mueve la página).
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [printed, chars, lines.length])

  // Resultado de la verificación impreso como salida del sistema, no solo como banner.
  useEffect(() => {
    if (!feedback) return
    push([
      feedback.isCorrect
        ? { tone: 'sys', text: kind === 'choice' ? '[ok] coincidencia verificada — registro correcto' : '[ok] valor aceptado por el nodo' }
        : { tone: 'err', text: kind === 'choice' ? '[!!] registro descartado — la coincidencia no es esa' : '[!!] el nodo rechazó el valor' },
    ])
    if (feedback.isCorrect && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const rect = logRef.current?.getBoundingClientRect()
      if (rect) {
        confetti({
          particleCount: 16,
          shapes: ['square'],
          colors: ['#3FBFAD', '#D7F2EC'],
          scalar: 0.6,
          spread: 60,
          startVelocity: 20,
          ticks: 45,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
        })
      }
    }
    // push es estable; solo interesa reaccionar al feedback nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback])

  const runAnalysis = useCallback(() => {
    if (stageRef.current === 'ready') {
      push([{ tone: 'note', text: '// los registros ya están en pantalla' }])
      return
    }
    stageRef.current = 'ready'
    setStage('ready')
    if (kind === 'choice') {
      push([
        { tone: 'sys', text: '[..] consultando nodo ALGEBRA_DE_FUNCIONES' },
        { tone: 'sys', text: `[ok] ${optionCount} registros recuperados:` },
        ...current.options.map((opt, i) => ({ tone: 'data', text: `  [${i + 1}] ${opt}`, record: i, option: opt })),
        { tone: 'note', text: `// pulsa 1-${optionCount}, escribe "sel <n>" o toca un registro` },
      ])
    } else {
      push([
        { tone: 'sys', text: '[..] abriendo canal de escritura' },
        { tone: 'sys', text: '[ok] el nodo espera un valor de retorno' },
        { tone: 'note', text: '// escribe el valor y pulsa ENTER' },
      ])
    }
  }, [kind, optionCount, current, push])

  const selectRecord = useCallback(
    (i) => {
      if (feedback || stageRef.current !== 'ready' || kind !== 'choice') return
      push([{ tone: 'cmd', text: `funcionlab@algebra:~$ sel ${i + 1}`, instant: true }])
      checkChoice(i)
    },
    [feedback, kind, push, checkChoice]
  )

  // Teclas 1-9 = elegir registro (la promesa que el menú numerado hacía y no cumplía).
  // Escape salta el tipeo. Se limpia siempre al desmontar.
  useEffect(() => {
    if (kind !== 'choice') return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        skipTyping()
        return
      }
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return // ahí los dígitos se escriben
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= optionCount) {
        e.preventDefault()
        selectRecord(n - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kind, optionCount, selectRecord, skipTyping])

  const runCommand = useCallback(
    (raw) => {
      const cmd = raw.trim()
      if (!cmd || feedback) return
      setCommand('')
      skipTyping()
      const low = cmd
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
      const echo = { tone: 'cmd', text: `funcionlab@algebra:~$ ${cmd}`, instant: true }
      const ready = stageRef.current === 'ready'

      if (low === 'ayuda' || low === 'help' || low === '?') {
        push([echo, { tone: 'sys', text: '[ok] órdenes disponibles:' }, ...HELP_LINES(kind, ready, optionCount)])
        return
      }
      if (low === 'repetir' || low === 'ver' || low === 'consulta') {
        push([echo, { tone: 'ask', text: prompt || '', math: true }])
        return
      }
      if (low === 'ejecutar' || low === 'run' || low === 'analizar') {
        push([echo])
        runAnalysis()
        return
      }
      if (ready && kind === 'choice') {
        const m = low.match(/^(?:sel(?:eccionar)?\s*)?(\d+)$/)
        if (m) {
          const n = Number(m[1])
          if (n >= 1 && n <= optionCount) {
            selectRecord(n - 1)
            return
          }
          push([echo, { tone: 'err', text: `[!!] no existe el registro ${n} (hay ${optionCount})` }])
          return
        }
        push([echo, { tone: 'err', text: `bash: ${cmd}: orden no encontrada — usa "sel <n>" o pulsa 1-${optionCount}` }])
        return
      }
      if (ready && kind === 'text') {
        push([echo])
        checkText(cmd) // el valor escrito ES la respuesta
        return
      }
      push([echo, { tone: 'err', text: `bash: ${cmd}: orden no encontrada — escribe "ayuda"` }])
    },
    [feedback, kind, optionCount, prompt, push, runAnalysis, selectRecord, checkText, skipTyping]
  )

  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-teal">
          <Link2 className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Conecta cada registro con su pareja</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  const nextItem = () => next()
  const visibleLast = Math.min(printed, lines.length - 1)

  return (
    <div>
      <GameHeader index={index} total={total} label="CONSULTA" />

      <div className="relative rounded-xl overflow-hidden border border-teal/40 bg-[#0a0f0d] shadow-lg shadow-teal/5">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#111a17] border-b border-teal/30">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-gold/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-teal term-led" />
          <span className="ml-2 text-[10px] font-mono-lab text-teal flex items-center gap-1">
            <Terminal className="w-3 h-3" /> funcionlab@algebra:~$
          </span>
        </div>

        <div className="relative overflow-hidden">
          <span className="term-scanline" aria-hidden="true" />
          <div
            ref={logRef}
            onClick={skipTyping}
            className="relative p-4 font-mono-lab text-sm min-h-[9rem] max-h-[20rem] overflow-y-auto space-y-0.5"
          >
            {lines.map((l, i) => {
              if (i > printed) return null
              const done = i < printed || l.instant
              const shown = done ? l.text : l.text.slice(0, chars)
              const caret = i === visibleLast && !feedback

              if (l.record !== undefined && done) {
                const isRight = feedback && l.record === current.correctIndex
                const isWrongPick = feedback && selected === l.record && l.record !== current.correctIndex
                return (
                  <button
                    key={l.id}
                    onClick={() => selectRecord(l.record)}
                    disabled={!!feedback}
                    className={`term-line w-full text-left flex items-start gap-2 rounded px-2 py-1 border transition-colors ${
                      isRight
                        ? 'border-teal bg-teal/15 text-teal'
                        : isWrongPick
                          ? 'border-coral bg-coral/10 text-coral'
                          : 'border-transparent text-[#D7F2EC] hover:bg-teal/10 hover:border-teal/40 active:bg-teal/20'
                    }`}
                  >
                    <span className={isRight || isWrongPick ? '' : 'text-teal'}>[{l.record + 1}]</span>
                    <MathText text={l.option} />
                    {isRight && <span className="ml-auto shrink-0 text-xs">&lt;= coincide</span>}
                  </button>
                )
              }

              return (
                <p key={l.id} className={`term-line leading-relaxed break-words ${TONE[l.tone] || TONE.data}`}>
                  {done && l.math ? <MathText text={l.text} /> : shown}
                  {caret && <span className="term-caret ml-1 align-middle" aria-hidden="true" />}
                </p>
              )
            })}
            {typing && (
              <p className="text-teal/70 text-[11px] pt-1">{'// toca la consola (o pulsa Esc) para saltar el tipeo'}</p>
            )}
          </div>
        </div>

        {!feedback && (
          <div className="border-t border-teal/30 px-3 py-2.5 bg-[#0d1512]">
            <div className="flex items-center gap-1.5 font-mono-lab">
              <span className="text-teal shrink-0">$</span>
              <input
                className="flex-1 min-w-0 bg-transparent border-b border-teal/40 focus:border-teal outline-none text-teal placeholder:text-teal/70 px-1 py-1 text-sm"
                placeholder={
                  stage === 'brief'
                    ? 'ejecutar'
                    : kind === 'choice'
                      ? `sel 1 … sel ${optionCount}`
                      : 'escribe el valor'
                }
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runCommand(command)}
                aria-label="Línea de órdenes del terminal"
              />
              <button
                onClick={() => runCommand(command)}
                disabled={!command.trim()}
                className="border border-teal/60 text-teal hover:bg-teal/10 active:bg-teal/20 transition-colors rounded px-2.5 py-1 text-xs disabled:opacity-40 shrink-0"
              >
                ENTER
              </button>
            </div>

            {/* Las mismas órdenes como botones: en celular nadie quiere teclear "ejecutar". */}
            <div className="flex flex-wrap gap-2 mt-2">
              {stage === 'brief' && (
                <button
                  onClick={() => runCommand('ejecutar')}
                  className="border border-teal bg-teal/10 text-teal hover:bg-teal/20 active:bg-teal/30 transition-colors rounded px-2.5 py-1 text-[11px] font-mono-lab"
                >
                  ▸ ejecutar
                </button>
              )}
              <button
                onClick={() => runCommand('repetir')}
                className="border border-teal/50 text-teal/70 hover:text-teal hover:bg-teal/10 active:bg-teal/20 transition-colors rounded px-2.5 py-1 text-[11px] font-mono-lab"
              >
                repetir
              </button>
              <button
                onClick={() => runCommand('ayuda')}
                className="border border-teal/50 text-teal/70 hover:text-teal hover:bg-teal/10 active:bg-teal/20 transition-colors rounded px-2.5 py-1 text-[11px] font-mono-lab"
              >
                ayuda
              </button>
            </div>
          </div>
        )}
      </div>

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}
