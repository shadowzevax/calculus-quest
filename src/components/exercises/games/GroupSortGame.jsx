import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Inbox, Move } from 'lucide-react'
import { getExerciseItems, useStepper } from '@/lib/exerciseItems'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import { GameHeader, FeedbackBanner, NextButton, TextAnswer, Prompt } from './GameBits'

const BIN_COLORS = ['#FF6B4A', '#457B9D', '#3FBFAD', '#F0A93C']

// Misión 1 — Ordenar por grupo (calca de la plantilla real de Wordwall "Group sort"): en vez
// de tocar un botón, se ARRASTRA la respuesta hacia el grupo/canasto correcto — igual mecánica
// que en https://wordwall.net (arrastrar y soltar), con nuestro propio diseño de colores.
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
        <DragToBins key={index} options={current.options} correctIndex={current.correctIndex} feedback={feedback} onDrop={checkChoice} />
      ) : (
        <div className="border-2 border-dashed rounded-xl p-4" style={{ borderColor: BIN_COLORS[0] }}>
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

// Una sola ficha "Respuesta" que se arrastra hacia el canasto correcto — es la mecánica real
// de arrastrar y soltar de "Ordenar por grupo", aplicada a una pregunta con varias opciones.
function DragToBins({ options, correctIndex, feedback, onDrop }) {
  const [placedIn, setPlacedIn] = useState(null) // indice del canasto donde quedo la ficha

  const onDragEnd = (result) => {
    if (feedback || placedIn !== null) return
    const dest = result.destination
    if (!dest || dest.droppableId === 'pool') return
    const binIndex = Number(dest.droppableId.replace('bin-', ''))
    setPlacedIn(binIndex)
    onDrop(binIndex)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {placedIn === null && (
        <Droppable droppableId="pool" isDropDisabled>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex justify-center mb-5">
              <Draggable draggableId="answer-chip" index={0} isDragDisabled={!!feedback}>
                {(dragProvided, snapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`flex items-center gap-2 bg-white border-2 border-coral rounded-full px-4 py-2 text-sm font-mono-lab shadow-md ${
                      snapshot.isDragging ? 'shadow-xl' : ''
                    }`}
                  >
                    <Move className="w-3.5 h-3.5 text-coral" /> Arrastra tu respuesta
                  </div>
                )}
              </Draggable>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt, i) => {
          const color = BIN_COLORS[i % BIN_COLORS.length]
          const isRight = feedback && i === correctIndex
          const isWrongPick = feedback && placedIn === i && i !== correctIndex
          return (
            <Droppable droppableId={`bin-${i}`} key={i} isDropDisabled={!!feedback || placedIn !== null}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`relative flex flex-col items-center gap-2 rounded-b-2xl rounded-t-lg pt-6 pb-4 px-3 border-b-[6px] text-sm font-mono-lab text-center min-h-[6.5rem] transition-colors ${
                    isWrongPick ? 'opacity-40' : ''
                  } ${snapshot.isDraggingOver ? 'brightness-95' : ''}`}
                  style={{
                    backgroundColor: `${color}14`,
                    borderColor: isRight ? '#2A9D8F' : color,
                    boxShadow: isRight ? '0 0 0 2px #2A9D8F inset' : undefined,
                  }}
                >
                  <Inbox className="w-6 h-6" style={{ color }} />
                  <span className="text-ink">{opt}</span>
                  {placedIn === i && (
                    <div className="flex items-center gap-1.5 bg-white border border-coral rounded-full px-3 py-1 text-xs font-mono-lab shadow">
                      <Move className="w-3 h-3 text-coral" /> Tu respuesta
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )
        })}
      </div>
    </DragDropContext>
  )
}
