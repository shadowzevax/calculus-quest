import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise'
import FillBlankExercise from '@/components/exercises/FillBlankExercise'
import TrueFalseExercise from '@/components/exercises/TrueFalseExercise'
import MatchingExercise from '@/components/exercises/MatchingExercise'

// Motor de ejercicios "dirigido por metadata": cada fila de la tabla
// exercises tiene una columna `type` (texto) y una columna `metadata`
// (JSON con la forma que necesite ese tipo de ejercicio: preguntas,
// opciones, pares a emparejar, etc). En vez de tener un componente gigante
// con ifs para cada tipo, este mapa asocia el string `type` con el
// componente React que sabe renderizarlo. Para agregar un tipo de
// ejercicio nuevo en el futuro: crear el componente en
// src/components/exercises/ y agregar una línea aquí.
const EXERCISE_COMPONENTS = {
  multiple_choice: MultipleChoiceExercise,
  fill_blank: FillBlankExercise,
  true_false: TrueFalseExercise,
  matching: MatchingExercise,
}

export default function MissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [exercises, setExercises] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    Promise.all([api.missions.list('misiones'), api.exercises.byMission(id)])
      .then(([missions, ex]) => {
        setMission(missions.find((m) => m.id === id))
        setExercises(ex)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-ink/40 font-mono-lab text-sm">Cargando misión...</p>
  if (!mission) return <p className="text-red-500 text-sm">Misión no encontrada.</p>

  const exercise = exercises[current]
  const Component = exercise ? EXERCISE_COMPONENTS[exercise.type] : null

  const handleComplete = async ({ isCorrect }) => {
    if (isCorrect) {
      try {
        await api.progress.submit({
          exercise_id: exercise.id,
          answer_given: 'completed',
          is_correct: true,
          xp_earned: exercise.xp_value || 10,
        })
      } catch {}
    }
    if (current < exercises.length - 1) {
      setCurrent(current + 1)
    } else {
      setShowDone(true)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/missions" className="text-sm text-ink/50 hover:text-coral flex items-center gap-1 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a Misiones
      </Link>

      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-1">MISIÓN</div>
      <h1 className="text-2xl font-display font-bold text-ink">{mission.title}</h1>
      <p className="text-ink/50 mt-1 mb-6">{mission.story || mission.description}</p>

      {exercises.length === 0 && (
        <div className="bg-white rounded-xl border border-ink/10 p-6 text-ink/40 text-sm">
          Esta misión aún no tiene ejercicios cargados.
        </div>
      )}

      {!showDone && exercise && (
        <div className="bg-white rounded-xl border border-ink/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono-lab text-ink/40">EJERCICIO {current + 1} / {exercises.length}</span>
            <span className="text-xs font-mono-lab font-semibold text-coral">+{exercise.xp_value} XP</span>
          </div>
          {Component ? (
            <Component exercise={exercise} onComplete={handleComplete} />
          ) : (
            <p className="text-red-500 text-sm">Tipo de ejercicio no soportado: {exercise.type}</p>
          )}
        </div>
      )}

      {showDone && (
        <div className="bg-white rounded-xl border border-ink/10 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-xl font-display font-bold text-ink">¡Misión completada!</h2>
          <p className="text-ink/50 mt-1">Ganaste XP por los ejercicios que resolviste correctamente.</p>
          <button onClick={() => navigate('/missions')} className="mt-5 bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-5 py-2.5 text-sm font-medium">
            Volver a Misiones
          </button>
        </div>
      )}
    </div>
  )
}
