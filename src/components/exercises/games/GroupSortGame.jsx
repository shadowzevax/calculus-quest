import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Inbox, CheckCircle2, XCircle } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

// Misión 1 — Ordenar por grupo (calca de la plantilla real "Group sort" de Wordwall): los
// BLOQUES que se arrastran son las opciones de respuesta; las categorías son "Correcto" e
// "Incorrecto" — se arrastra cada bloque a su grupo y se envían todas juntas al final.
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
        <GroupSortBoard key={index} options={current.options} correctIndex={current.correctIndex} feedback={feedback} onSubmit={checkChoice} />
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
// ("Correcto" / "Incorrecto") donde se sueltan. Se envia todo junto con un boton al final.
function GroupSortBoard({ options, correctIndex, feedback, onSubmit }) {
  const [pool, setPool] = useState(options.map((text, i) => ({ id: `opt-${i}`, text, i })))
  const [bins, setBins] = useState({ correct: [], incorrect: [] })
  const [submitted, setSubmitted] = useState(false)

  const listFor = (id) => (id === 'pool' ? pool : id === 'correct' ? bins.correct : bins.incorrect)
  const setListFor = (id, next) => {
    if (id === 'pool') setPool(next)
    else setBins((b) => ({ ...b, [id]: next }))
  }

  const onDragEnd = (result) => {
    if (submitted) return
    const { source, destination } = result
    if (!destination) return
    const sourceList = Array.from(listFor(source.droppableId))
    const [moved] = sourceList.splice(source.index, 1)
    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, moved)
      setListFor(source.droppableId, sourceList)
    } else {
      setListFor(source.droppableId, sourceList)
      const destList = Array.from(listFor(destination.droppableId))
      destList.splice(destination.index, 0, moved)
      setListFor(destination.droppableId, destList)
    }
  }

  const allPlaced = pool.length === 0
  const submit = () => {
    setSubmitted(true)
    const isCorrect = bins.correct.length === 1 && bins.correct[0].i === correctIndex
    onSubmit(isCorrect ? correctIndex : -1)
  }

  const Bin = ({ id, label, accent }) => (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex-1 min-h-[8rem] rounded-xl border-2 border-dashed p-3 transition-colors ${snapshot.isDraggingOver ? 'brightness-95' : ''}`}
          style={{ borderColor: accent, backgroundColor: `${accent}10` }}
        >
          <div className="flex items-center gap-1.5 text-xs font-mono-lab uppercase mb-2" style={{ color: accent }}>
            <Inbox className="w-4 h-4" /> {label}
          </div>
          <div className="space-y-2">
            {listFor(id).map((item, idx) => (
              <Draggable draggableId={item.id} index={idx} key={item.id} isDragDisabled={submitted}>
                {(dragProvided, snapshot) => {
                  const isRightHere = submitted && ((id === 'correct') === (item.i === correctIndex))
                  return (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm font-mono-lab shadow-sm ${
                        snapshot.isDragging ? 'shadow-lg' : ''
                      } ${submitted ? (isRightHere ? 'border-teal bg-teal/10' : 'border-red-400 bg-red-50') : 'border-ink/10'}`}
                    >
                      {submitted && (isRightHere ? <CheckCircle2 className="w-3.5 h-3.5 text-teal shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />)}
                      {item.text}
                    </div>
                  )
                }}
              </Draggable>
            ))}
          </div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="pool">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[3rem] flex flex-wrap gap-2 border-2 border-dashed border-ink/15 rounded-xl p-3 mb-4 bg-ink/[0.02] transition-colors ${snapshot.isDraggingOver ? 'bg-ink/5' : ''}`}
          >
            {pool.length === 0 && <span className="text-xs text-ink/30 font-mono-lab">Arrastraste todos los bloques ↓</span>}
            {pool.map((item, idx) => (
              <Draggable draggableId={item.id} index={idx} key={item.id} isDragDisabled={submitted}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`px-3 py-2 rounded-lg text-white text-sm font-mono-lab shadow-sm cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    style={{ backgroundColor: BLOCK_COLORS[item.i % BLOCK_COLORS.length] }}
                  >
                    {item.text}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

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
    </DragDropContext>
  )
}
