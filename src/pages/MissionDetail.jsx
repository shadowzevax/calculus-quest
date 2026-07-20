import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise'
import FillBlankExercise from '@/components/exercises/FillBlankExercise'

const EXERCISE_COMPONENTS = {
  multiple_choice: MultipleChoiceExercise,
  fill_blank: FillBlankExercise,
}

export default function MissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mission, setMission] = useState(null)
  const [exercises, setExercises] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completedIds, setCompletedIds] = useState(new Set())
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    Promise.all([api.missions.list('misiones'), api.exercises.byMission(id)])
      .then(([missions, ex]) => {
        setMission(missions.find((m) => m.id === id))
        setExercises(ex)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-slate-500">Cargando misión...</p>
  if (!mission) return <p className="text-red-500">Misión no encontrada.</p>

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
      setCompletedIds((prev) => new Set(prev).add(exercise.id))
    }
    if (current < exercises.length - 1) {
      setCurrent(current + 1)
    } else {
      setShowDone(true)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/missions" className="text-sm text-slate-500 flex items-center gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> Volver a Misiones
      </Link>

      <h1 className="text-2xl font-bold">{mission.title}</h1>
      <p className="text-slate-500 mt-1 mb-6">{mission.story || mission.description}</p>

      {exercises.length === 0 && (
        <div className="bg-white rounded-xl border p-6 text-slate-400 text-sm">
          Esta misión aún no tiene ejercicios cargados.
        </div>
      )}

      {!showDone && exercise && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400">Ejercicio {current + 1} de {exercises.length}</span>
            <span className="text-xs font-medium text-[#457B9D]">+{exercise.xp_value} XP</span>
          </div>
          {Component ? (
            <Component exercise={exercise} onComplete={handleComplete} />
          ) : (
            <p className="text-red-500 text-sm">Tipo de ejercicio no soportado: {exercise.type}</p>
          )}
        </div>
      )}

      {showDone && (
        <div className="bg-white rounded-xl border p-8 text-center">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold">¡Misión completada!</h2>
          <p className="text-slate-500 mt-1">Ganaste XP por los ejercicios que resolviste correctamente.</p>
          <button onClick={() => navigate('/missions')} className="mt-4 bg-[#457B9D] text-white rounded px-4 py-2 text-sm">
            Volver a Misiones
          </button>
        </div>
      )}
    </div>
  )
}
