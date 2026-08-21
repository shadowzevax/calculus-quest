import { useState } from 'react'

// Normaliza los 4 formatos de datos que ya existen en exercise.metadata (questions,
// statements, problems, pairs) a una forma unica que los 13 juegos por-mision pueden
// consumir sin preocuparse de que tipo de ejercicio es realmente. Los datos reales
// (preguntas, respuestas, explicaciones) nunca se inventan aqui, solo se reacomodan.
export function getExerciseItems(exercise) {
  const meta = exercise?.metadata || {}

  if (exercise?.type === 'matching') {
    return { kind: 'matching', list: [], threshold: 1 }
  }

  if (Array.isArray(meta.questions) && meta.questions.length) {
    return {
      kind: 'choice',
      list: meta.questions.map((q) => ({
        prompt: q.question,
        options: q.options,
        correctIndex: q.correct_index,
        explanation: q.explanation,
      })),
      threshold: 0.6,
    }
  }

  if (Array.isArray(meta.statements) && meta.statements.length) {
    return {
      kind: 'choice',
      list: meta.statements.map((s) => ({
        prompt: s.statement,
        options: ['Verdadero', 'Falso'],
        correctIndex: s.answer ? 0 : 1,
        explanation: s.explanation,
      })),
      threshold: 0.6,
    }
  }

  if (Array.isArray(meta.problems) && meta.problems.length) {
    return {
      kind: 'text',
      list: meta.problems.map((p) => ({
        prompt: p.question,
        accepted: Array.isArray(p.accepted_answers) ? p.accepted_answers : [p.answer],
        answer: p.answer,
        tolerance: p.tolerance,
        explanation: p.explanation,
      })),
      threshold: 0.6,
    }
  }

  return { kind: 'empty', list: [], threshold: 0.6 }
}

function normalizeText(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, '')
}

// Maquina de estados compartida por los juegos de tipo "choice" y "text": avanza item por
// item, guarda si cada uno se acerto, y llama onComplete al terminar — misma logica que ya
// usaban MultipleChoiceExercise/TrueFalseExercise/FillBlankExercise, ahora reutilizable.
export function useStepper(items, onComplete, onFeedback) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null) // indice de opcion elegida (choice) o texto (text)
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  const current = items.list[index]
  const total = items.list.length

  const checkChoice = (optionIndex) => {
    if (feedback) return
    setSelected(optionIndex)
    const isCorrect = optionIndex === current.correctIndex
    if (isCorrect) setCorrectCount((c) => c + 1)
    setFeedback({ isCorrect, explanation: current.explanation })
    onFeedback?.(true)
  }

  const checkText = (value) => {
    if (feedback || !value.trim()) return
    const accepted = current.accepted || [current.answer]
    let isCorrect = accepted.some((a) => normalizeText(a) === normalizeText(value))
    if (!isCorrect && current.tolerance !== undefined) {
      const num = parseFloat(String(value).replace(',', '.'))
      const target = parseFloat(current.answer)
      if (!isNaN(num) && !isNaN(target) && Math.abs(num - target) <= current.tolerance) isCorrect = true
    }
    if (isCorrect) setCorrectCount((c) => c + 1)
    setFeedback({ isCorrect, explanation: current.explanation })
    onFeedback?.(true)
  }

  const next = () => {
    setSelected(null)
    setFeedback(null)
    onFeedback?.(false)
    if (index < total - 1) {
      setIndex(index + 1)
    } else {
      onComplete({ isCorrect: correctCount / total >= items.threshold })
    }
  }

  return { index, total, current, selected, feedback, checkChoice, checkText, next }
}
