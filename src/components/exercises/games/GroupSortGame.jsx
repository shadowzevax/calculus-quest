import { useState } from 'react'
import { Inbox, CheckCircle2, XCircle } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 1 — Ordenar por grupo (calca de la plantilla real "Group sort" de Wordwall): los
// BLOQUES que se arrastran son las opciones de respuesta; las categorías son "Correcto" e
// "Incorrecto" — se arrastra cada bloque a su grupo y se envían todas juntas al final.
// Arrastre nativo HTML5 (mas confiable que librerias de terceros) + alternativa de toque:
// tocar un bloque lo selecciona, tocar un canasto lo coloca ahi.
export default function GroupSortGame({ exercise, onComplete, onFeedback }) {
  const items = getExerciseItems(exercise)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

  const { index, total, current, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)

  if (items.kind === 'matching') {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4 text-coral">
          <Inbox className="w-5 h-5" />
          <span className="text-xs font-mono-lab uppercase tracking-wide">Clasifica cada pareja en su lugar</span>
        </div>
        <MatchingExercise exercise={exercise} onComplete={onComplete} />
      </div>
    )
  }

  return (
    <div>
      <GameHeader index={index} total={total} label="CLASIFICA" />
      <Prompt text={current.prompt} />

      {items.kind === 'choice' ? (
        <GroupSortBoard key={index} options={current.options} correctIndex={current.correctIndex} onSubmit={checkChoice} />
      ) : (
        <div className="border-2 border-dashed rounded-xl p-4 border-coral">
          <div className="flex items-center gap-2 mb-2 text-coral text-xs font-mono-lab uppercase">
            <Inbox className="w-4 h-4" /> Escribe la respuesta y guárdala en el canasto
          </div>
          <TextAnswer feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}

const BLOCK_COLORS = ['#FF6B4A', '#457B9D', '#3FBFAD', '#F0A93C']

// Tablero real de clasificar en grupos: un cajon con los bloques sin ubicar, y dos canastos
// ("Correcto" / "Incorrecto") donde se sueltan. Soporta arrastrar-y-soltar nativo (mouse) y
// tocar-para-colocar (tactil): tocar un bloque lo resalta, tocar un canasto lo mueve ahi.
function GroupSortBoard({ options, correctIndex, onSubmit }) {
  const [placement, setPlacement] = useState(() => Object.fromEntries(options.map((_, i) => [i, null]))) // i -> null|'correct'|'incorrect'
  const [selectedId, setSelectedId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [dragOverBin, setDragOverBin] = useState(null)

  const pool = options.map((_, i) => i).filter((i) => placement[i] === null)
  const binItems = (bin) => options.map((_, i) => i).filter((i) => placement[i] === bin)
  const allPlaced = pool.length === 0

  const moveTo = (i, bin) => {
    if (submitted) return
    setPlacement((p) => ({ ...p, [i]: bin }))
    setSelectedId(null)
  }

  const handleDrop = (e, bin) => {
    e.preventDefault()
    setDragOverBin(null)
    const id = Number(e.dataTransfer.getData('text/plain'))
    if (!isNaN(id)) moveTo(id, bin)
  }

  const submit = () => {
    setSubmitted(true)
    const correctBin = binItems('correct')
    const isCorrect = correctBin.length === 1 && correctBin[0] === correctIndex
    onSubmit(isCorrect ? correctIndex : -1)
  }

  const Block = ({ i, inBin }) => {
    const isRightHere = submitted && ((inBin === 'correct') === (i === correctIndex))
    return (
      <div
        draggable={!submitted}
        onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move' }}
        onClick={() => {
          if (submitted) return
          if (inBin) { setPlacement((p) => ({ ...p, [i]: null })); return }
          setSelectedId((cur) => (cur === i ? null : i))
        }}
        className={`select-none flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono-lab shadow-sm transition-all ${
          submitted ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        } ${
          inBin
            ? `bg-white border ${submitted ? (isRightHere ? 'border-teal bg-teal/10' : 'border-red-400 bg-red-50') : 'border-ink/10'}`
            : 'text-white'
        } ${selectedId === i ? 'ring-2 ring-offset-1 ring-coral scale-105' : ''}`}
        style={!inBin ? { backgroundColor: BLOCK_COLORS[i % BLOCK_COLORS.length] } : undefined}
      >
        {submitted && inBin && (isRightHere ? <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />)}
        {options[i]}
      </div>
    )
  }

  const Bin = ({ id, label, accent }) => (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOverBin(id) }}
      onDragLeave={() => setDragOverBin((cur) => (cur === id ? null : cur))}
      onDrop={(e) => handleDrop(e, id)}
      onClick={() => { if (selectedId !== null) moveTo(selectedId, id) }}
      className={`flex-1 min-h-[8rem] rounded-xl border-2 border-dashed p-3 transition-colors ${dragOverBin === id ? 'brightness-95' : ''} ${
        selectedId !== null ? 'cursor-pointer' : ''
      }`}
      style={{ borderColor: accent, backgroundColor: `${accent}10` }}
    >
      <div className="flex items-center gap-1.5 text-xs font-mono-lab uppercase mb-2" style={{ color: accent }}>
        <Inbox className="w-4 h-4" /> {label}
      </div>
      <div className="space-y-2">
        {binItems(id).map((i) => <Block key={i} i={i} inBin={id} />)}
      </div>
    </div>
  )

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, null)}
        className="min-h-[3rem] flex flex-wrap gap-2 border-2 border-dashed border-ink/15 rounded-xl p-3 mb-4 bg-ink/[0.02]"
      >
        {pool.length === 0 && <span className="text-xs text-ink/30 font-mono-lab">Arrastraste todos los bloques ↓</span>}
        {pool.map((i) => <Block key={i} i={i} inBin={null} />)}
      </div>
      {!submitted && (
        <p className="text-[11px] text-ink/30 font-mono-lab mb-3">Arrastra cada bloque a un canasto, o tócalo y luego toca el canasto.</p>
      )}

      <div className="flex gap-3">
        <Bin id="correct" label="Correcto" accent="#2A9D8F" />
        <Bin id="incorrect" label="Incorrecto" accent="#E76F51" />
      </div>

      {!submitted && (
        <button
          onClick={submit}
          disabled={!allPlaced}
          className="mt-4 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
        >
          Enviar respuestas
        </button>
      )}
    </div>
  )
}
