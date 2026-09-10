import { useState } from 'react'
import { Terminal, ChevronRight, Link2 } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, Prompt, MathText } from './GameBits'

// Misión 7 — Terminal de datos: la pregunta se "ejecuta" en una consola retro (fondo negro,
// texto verde monoespaciado) — hay que correr el análisis y luego elegir la opción correcta
// desde un menú numerado, o escribir la respuesta en el prompt de comandos.
export default function DataTerminalGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, selected, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  const [booted, setBooted] = useState(false)
  const [scanning, setScanning] = useState(false)

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

  const runAnalysis = () => {
    setScanning(true)
    setTimeout(() => { setScanning(false); setBooted(true) }, 900)
  }

  const nextItem = () => { next(); setBooted(false); setScanning(false) }

  return (
    <div>
      <GameHeader index={index} total={total} label="CONSULTA" />

      <div className="rounded-xl overflow-hidden border border-teal/30 bg-[#0a0f0d] shadow-lg shadow-teal/5">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#111a17] border-b border-teal/20">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-gold/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-teal/70" />
          <span className="ml-2 text-[10px] font-mono-lab text-teal/50 flex items-center gap-1">
            <Terminal className="w-3 h-3" /> funcionlab@algebra:~$
          </span>
        </div>

        <div className="p-4 font-mono-lab text-sm min-h-[7rem]">
          <p className="text-teal/50 mb-1">$ analizar_funciones --consulta {index + 1}</p>
          <p className="text-teal leading-relaxed">
            <span className="text-teal/40">&gt;</span> <MathText text={current.prompt} />
          </p>

          {!booted ? (
            <button
              onClick={runAnalysis}
              disabled={scanning}
              className="mt-4 flex items-center gap-2 border border-teal/40 text-teal hover:bg-teal/10 transition-colors rounded px-3 py-1.5 text-xs disabled:opacity-60"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              {scanning ? 'Ejecutando análisis...' : 'Ejecutar análisis'}
            </button>
          ) : (
            <div className="mt-3 space-y-1.5">
              <p className="text-teal/40 text-xs">// resultado disponible — selecciona la respuesta</p>
              {items.kind === 'choice' ? (
                <div className="space-y-1 pt-1">
                  {current.options.map((opt, i) => {
                    const isRight = feedback && i === current.correctIndex
                    const isWrongPick = feedback && selected === i && i !== current.correctIndex
                    return (
                      <button
                        key={i}
                        onClick={() => checkChoice(i)}
                        disabled={!!feedback}
                        className={`w-full text-left flex items-center gap-2 rounded px-2.5 py-1.5 text-sm transition-colors border ${
                          isRight
                            ? 'border-teal bg-teal/10 text-teal'
                            : isWrongPick
                              ? 'border-red-500/60 bg-red-500/10 text-red-400'
                              : 'border-teal/10 text-teal/80 hover:bg-teal/5 hover:border-teal/30'
                        }`}
                      >
                        <span className="text-teal/40">[{i + 1}]</span>
                        <MathText text={opt} />
                      </button>
                    )
                  })}
                </div>
              ) : (
                <TerminalInput feedback={feedback} onCheck={checkText} />
              )}
            </div>
          )}
        </div>
      </div>

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={nextItem} />
    </div>
  )
}

function TerminalInput({ feedback, onCheck }) {
  const [value, setValue] = useState('')
  const submit = () => { if (value.trim()) onCheck(value) }
  return (
    <div className="flex items-center gap-1.5 pt-1">
      <span className="text-teal">&gt;</span>
      <input
        autoFocus
        className="flex-1 bg-transparent border-b border-teal/30 focus:border-teal outline-none text-teal placeholder:text-teal/25 px-1 py-1 text-sm"
        placeholder="escribe tu respuesta_"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        disabled={!!feedback}
      />
      {!feedback && (
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="border border-teal/40 text-teal hover:bg-teal/10 transition-colors rounded px-2.5 py-1 text-xs disabled:opacity-30"
        >
          ENTER
        </button>
      )}
    </div>
  )
}
