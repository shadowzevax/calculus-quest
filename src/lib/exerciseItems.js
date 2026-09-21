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
        // El formato exacto que la propia pregunta le pide escribir al estudiante (p.answer)
        // SIEMPRE debe aceptarse, aunque accepted_answers exista — antes, si accepted_answers
        // se definía, reemplazaba a p.answer en vez de sumarse, y si alguien olvidaba incluir
        // ahí el formato literal que la pregunta pedía, esa respuesta exacta quedaba rechazada
        // (pasó en la Misión 2: "[3,inf)" era el formato pedido pero no estaba en la lista).
        accepted: [p.answer, ...(Array.isArray(p.accepted_answers) ? p.accepted_answers : [])],
        answer: p.answer,
        tolerance: p.tolerance,
        explanation: p.explanation,
      })),
      threshold: 0.6,
    }
  }

  return { kind: 'empty', list: [], threshold: 0.6 }
}

const DIACRITICS = /[̀-ͯ]/g

// Los símbolos del SymbolToolbar (√ ∞ ≤ ≥ ≠ π × ÷ ² ³) se canonicalizan a su equivalente de
// teclado/texto plano. Se revisaron las 40 respuestas reales del banco el 2026-09-20 y NINGUNA
// usa estos caracteres unicode: los exponentes se escriben "^2" (no "²"), el infinito se
// escribe "inf"/"infinito" (no "∞"), las fracciones se escriben con "/" (no "÷"). Sin este
// mapa, el propio botón "²" del toolbar podía marcar como incorrecta una respuesta como
// "x^2-25" con el exponente bien escrito, solo por haber usado el botón en vez del teclado.
const SYMBOL_TO_TEXT = {
  '×': '*',
  '÷': '/',
  '≤': '<=',
  '≥': '>=',
  '≠': '!=',
  '∞': 'inf',
  'π': 'pi',
  '²': '^2',
  '³': '^3',
}
const SYMBOL_RE = new RegExp(Object.keys(SYMBOL_TO_TEXT).join('|'), 'g')

// Quita acentos (NFD + strip de diacríticos, mismo patrón que stripAccents de
// TowerClimbGame.jsx), normaliza el signo menos tipográfico de KaTeX (U+2212) al guion
// ASCII normal, y los símbolos del toolbar a su forma de texto — antes "máximo"/"maximo" y
// "−3" (copiado de KaTeX) /"-3" se marcaban como respuestas distintas, fallando injustamente
// a un estudiante que respondió bien. Se aplica por igual a la respuesta del banco y a la del
// estudiante, así que da lo mismo cuál de las dos formas use cualquiera de las dos partes.
function normalizeText(str) {
  return String(str)
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/−/g, '-')
    .replace(SYMBOL_RE, (m) => SYMBOL_TO_TEXT[m])
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

// Maquina de estados compartida por los juegos de tipo "choice" y "text": avanza item por
// item, guarda si cada uno se acerto, y llama onComplete al terminar — misma logica que ya
// usaban MultipleChoiceExercise/TrueFalseExercise/FillBlankExercise, ahora reutilizable.
export function useStepper(items, onComplete, onFeedback) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null) // indice de opcion elegida (choice) o texto (text)
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  // Guarda lo que el estudiante respondió en cada sub-pregunta (no solo si acertó) — el
  // servidor lo necesita para poder recalcular is_correct por su cuenta en vez de confiar en
  // lo que mande el cliente (antes cualquiera podía llamar la API directo con is_correct:true
  // y xp_earned inventado sin haber resuelto nada).
  const [answers, setAnswers] = useState([])

  const current = items.list[index]
  const total = items.list.length

  const checkChoice = (optionIndex) => {
    if (feedback) return
    setSelected(optionIndex)
    const isCorrect = optionIndex === current.correctIndex
    if (isCorrect) setCorrectCount((c) => c + 1)
    setAnswers((a) => [...a, { index, value: optionIndex }])
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
    setAnswers((a) => [...a, { index, value }])
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
      onComplete({ isCorrect: correctCount / total >= items.threshold, answers })
    }
  }

  return { index, total, current, selected, feedback, checkChoice, checkText, next }
}
