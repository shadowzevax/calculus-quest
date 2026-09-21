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
  const { index, total, current, feedback, checkChoice, checkText, next } = useStepper(items, onComplete, onFeedback)
  if (items.kind === 'empty') return <p className="text-red-500 text-sm">Este ejercicio no tiene contenido configurado.</p>

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
          <TextAnswer key={index} feedback={feedback} onCheck={checkText} />
        </div>
      )}

      <FeedbackBanner feedback={feedback} />
      <NextButton feedback={feedback} index={index} total={total} onNext={next} />
    </div>
  )
}

const BLOCK_COLORS = ['#FF6B4A', '#457B9D', '#3FBFAD', '#F0A93C']

// Block y Bin viven a nivel de módulo (no dentro de GroupSortBoard como antes): declarados
// dentro del padre, React los trataba como un tipo de componente NUEVO en cada render de
// GroupSortBoard, así que los desmontaba y remontaba en vez de actualizarlos — y con eso
// las clases `transition-*` nunca alcanzaban a animar (no hay "antes" que comparar, el
// elemento siempre es "nuevo"). A nivel de módulo, React los reconoce como el mismo
// componente entre renders y las transiciones sí se ven.
function Block({ i, text, inBin, submitted, correctIndex, selectedId, onSelect, onMove }) {
  const isTheCorrectOne = i === correctIndex
  const isRightHere = submitted && ((inBin === 'correct') === isTheCorrectOne)
  return (
    <div
      draggable={!submitted}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move' }}
      onClick={(e) => {
        if (submitted) return
        // Evita que el clic también le llegue al canasto contenedor (que movería ahí
        // cualquier bloque que hubiera quedado seleccionado antes de este toque).
        e.stopPropagation()
        if (inBin) { onMove(i, null); return }
        onSelect(i)
      }}
      className={`select-none flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-mono-lab shadow-sm transition-all ${
        submitted ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
      } ${
        inBin
          ? `bg-white border ${submitted ? (isRightHere ? 'border-teal bg-teal/10' : 'border-red-400 bg-red-50') : 'border-ink/10'}`
          : 'text-white'
      } ${selectedId === i ? 'ring-2 ring-offset-1 ring-coral scale-105' : ''} ${
        // Marca la opción REALMENTE correcta con un anillo propio, sin importar en qué canasto
        // haya quedado — antes, si el estudiante se equivocaba de bloque, cada uno se marcaba
        // solo según SU PROPIO acierto de ubicación, y en el peor caso los 4 podían quedar en
        // rojo sin ninguna pista de cuál era la respuesta real (hallazgo de la auditoría de
        // calidad, 2026-09-21 — comparado con OpenBoxGame, que sí revela la opción correcta).
        submitted && isTheCorrectOne ? 'ring-2 ring-teal/60 ring-offset-1' : ''
      }`}
      style={!inBin ? { backgroundColor: BLOCK_COLORS[i % BLOCK_COLORS.length] } : undefined}
    >
      {submitted && inBin && (isRightHere ? <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />)}
      <span className="flex-1">{text}</span>
      {submitted && isTheCorrectOne && (
        <span className="text-[9px] font-mono-lab font-bold uppercase tracking-wide text-teal shrink-0">Era esta</span>
      )}
    </div>
  )
}

function Bin({ id, label, accent, items, submitted, correctIndex, selectedId, onSelect, onMove, dragOverBin, onDragOver, onDragLeave }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(id) }}
      onDragLeave={() => onDragLeave(id)}
      onDrop={(e) => {
        e.preventDefault()
        onDragOver(null)
        const dragged = Number(e.dataTransfer.getData('text/plain'))
        if (!isNaN(dragged)) onMove(dragged, id)
      }}
      onClick={() => { if (selectedId !== null) onMove(selectedId, id) }}
      className={`flex-1 min-h-[8rem] rounded-xl border-2 border-dashed p-3 transition-colors ${dragOverBin === id ? 'brightness-95' : ''} ${
        selectedId !== null ? 'cursor-pointer' : ''
      }`}
      style={{ borderColor: accent, backgroundColor: `${accent}10` }}
    >
      <div className="flex items-center gap-1.5 text-xs font-mono-lab uppercase mb-2" style={{ color: accent }}>
        <Inbox className="w-4 h-4" /> {label}
      </div>
      <div className="space-y-2">
        {items.map(({ i, text }) => (
          <Block key={i} i={i} text={text} inBin={id} submitted={submitted} correctIndex={correctIndex} selectedId={selectedId} onSelect={onSelect} onMove={onMove} />
        ))}
      </div>
    </div>
  )
}

// Tablero real de clasificar en grupos: un cajon con los bloques sin ubicar, y dos canastos
// ("Correcto" / "Incorrecto") donde se sueltan. Soporta arrastrar-y-soltar nativo (mouse) y
// tocar-para-colocar (tactil): tocar un bloque lo resalta, tocar un canasto lo mueve ahi.
function GroupSortBoard({ options, correctIndex, onSubmit }) {
  const [placement, setPlacement] = useState(() => Object.fromEntries(options.map((_, i) => [i, null]))) // i -> null|'correct'|'incorrect'
  const [selectedId, setSelectedId] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [dragOverBin, setDragOverBin] = useState(null)

  const pool = options.map((_, i) => i).filter((i) => placement[i] === null)
  const binItems = (bin) => options.map((_, i) => i).filter((i) => placement[i] === bin).map((i) => ({ i, text: options[i] }))
  const allPlaced = pool.length === 0

  const toggleSelect = (i) => setSelectedId((cur) => (cur === i ? null : i))
  const onDragLeave = (id) => setDragOverBin((cur) => (cur === id ? null : cur))

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
    const correctBin = binItems('correct').map((b) => b.i)
    const isCorrect = correctBin.length === 1 && correctBin[0] === correctIndex
    onSubmit(isCorrect ? correctIndex : -1)
  }

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, null)}
        className="min-h-[3rem] flex flex-wrap gap-2 border-2 border-dashed border-ink/15 rounded-xl p-3 mb-4 bg-ink/[0.02]"
      >
        {pool.length === 0 && <span className="text-xs text-ink/70 font-mono-lab">Arrastraste todos los bloques ↓</span>}
        {pool.map((i) => (
          <Block key={i} i={i} text={options[i]} inBin={null} submitted={submitted} correctIndex={correctIndex} selectedId={selectedId} onSelect={toggleSelect} onMove={moveTo} />
        ))}
      </div>
      {!submitted && (
        <p className="text-[11px] text-ink/70 font-mono-lab mb-3">Arrastra cada bloque a un canasto, o tócalo y luego toca el canasto.</p>
      )}

      <div className="flex gap-3">
        <Bin
          id="correct" label="Correcto" accent="#2A9D8F" items={binItems('correct')}
          submitted={submitted} correctIndex={correctIndex} selectedId={selectedId}
          onSelect={toggleSelect} onMove={moveTo} dragOverBin={dragOverBin} onDragOver={setDragOverBin} onDragLeave={onDragLeave}
        />
        <Bin
          id="incorrect" label="Incorrecto" accent="#E76F51" items={binItems('incorrect')}
          submitted={submitted} correctIndex={correctIndex} selectedId={selectedId}
          onSelect={toggleSelect} onMove={moveTo} dragOverBin={dragOverBin} onDragOver={setDragOverBin} onDragLeave={onDragLeave}
        />
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
