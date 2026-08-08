import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Trophy, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import MultipleChoiceExercise from '@/components/exercises/MultipleChoiceExercise'
import FillBlankExercise from '@/components/exercises/FillBlankExercise'
import TrueFalseExercise from '@/components/exercises/TrueFalseExercise'
import MatchingExercise from '@/components/exercises/MatchingExercise'
import EscapeRoomGame from '@/components/EscapeRoomGame'

// Cada ejercicio tiene un `type`; este mapa elige qué componente lo renderiza
// (evita un if/else gigante). Nuevo tipo = nuevo componente + una línea aquí.
const EXERCISE_COMPONENTS = {
  multiple_choice: MultipleChoiceExercise,
  fill_blank: FillBlankExercise,
  true_false: TrueFalseExercise,
  matching: MatchingExercise,
}

export default function MissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [mission, setMission] = useState(null)
  const [allMissions, setAllMissions] = useState([])
  const [exercises, setExercises] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)
  const [results, setResults] = useState([]) // [{exercise, isCorrect}] de este intento
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    // Reinicia el estado de la misión anterior — sin esto, al ir a "Siguiente misión" seguía
    // mostrando el resumen/resultados de la misión que se acababa de completar.
    setCurrent(0)
    setShowDone(false)
    setResults([])
    setLoading(true)
    Promise.all([api.missions.list('misiones'), api.exercises.byMission(id)])
      .then(([missions, ex]) => {
        setMission(missions.find((m) => m.id === id))
        setAllMissions(missions)
        setExercises(ex)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-ink/40 font-mono-lab text-sm">Cargando misión...</p>
  if (!mission) return <p className="text-red-500 text-sm">Misión no encontrada.</p>

  const exercise = exercises[current]
  const Component = exercise ? EXERCISE_COMPONENTS[exercise.type] : null
  const allCorrect = results.length > 0 && results.every((r) => r.isCorrect)
  const earnedXp = results.filter((r) => r.isCorrect).reduce((sum, r) => sum + (r.exercise.xp_value || 0), 0)
  const nextMission = allMissions.find((m) => m.order === mission.order + 1)

  const handleComplete = async ({ isCorrect }) => {
    if (isCorrect) {
      try {
        await api.progress.submit({
          exercise_id: exercise.id,
          answer_given: 'completed',
          is_correct: true,
          xp_earned: exercise.xp_value || 10,
        })
        // El XP/nivel del usuario vive en el AuthContext (se usa en Dashboard, la barra
        // lateral, etc.) — sin este refresh, se quedaba desactualizado hasta el próximo login.
        await refresh()
      } catch {}
    }
    setResults((r) => [...r, { exercise, isCorrect }])
    if (current < exercises.length - 1) {
      setCurrent(current + 1)
    } else {
      setShowDone(true)
    }
  }

  const retry = () => {
    setResults([])
    setCurrent(0)
    setShowDone(false)
    setRetryKey((k) => k + 1)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/missions" className="text-sm text-ink/50 hover:text-coral flex items-center gap-1 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Volver a Misiones
      </Link>

      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-1">MISIÓN</div>
      <h1 className="text-2xl font-display font-bold text-ink">{mission.title}</h1>
      <p className="text-ink/50 mt-1 mb-6">{mission.story || mission.description}</p>

      {mission.is_collaborative ? (
        <div className="bg-white rounded-xl border border-ink/10 p-8">
          <EscapeRoomGame mission={mission} />
        </div>
      ) : (
        <>
      {exercises.length === 0 && (
        <div className="bg-white rounded-xl border border-ink/10 p-6 text-ink/40 text-sm">
          Esta misión aún no tiene ejercicios cargados.
        </div>
      )}

      {!showDone && exercise && (
        <div className="bg-white rounded-xl border border-ink/10 p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono-lab text-ink/40">EJERCICIO {current + 1} / {exercises.length}</span>
            <span className="text-xs font-mono-lab font-semibold text-coral">+{exercise.xp_value} XP</span>
          </div>
          {Component ? (
            <Component key={`${exercise.id}-${retryKey}`} exercise={exercise} onComplete={handleComplete} />
          ) : (
            <p className="text-red-500 text-sm">Tipo de ejercicio no soportado: {exercise.type}</p>
          )}
        </div>
      )}

      {showDone && (
        <div className="bg-white rounded-xl border border-ink/10 p-8 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${allCorrect ? 'bg-gold/15' : 'bg-ink/5'}`}>
            <Trophy className={`w-7 h-7 ${allCorrect ? 'text-gold' : 'text-ink/30'}`} />
          </div>
          <h2 className="text-xl font-display font-bold text-ink">
            {allCorrect ? '¡Misión completada!' : 'Casi lo logras'}
          </h2>
          <p className="text-ink/50 mt-1">
            {allCorrect
              ? `Acertaste los ${results.length} ejercicios y ganaste ${earnedXp} XP.`
              : 'Debes acertar todos los ejercicios de la misión para avanzar y desbloquear su recompensa.'}
          </p>

          <div className="text-left mt-6 space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${r.isCorrect ? 'bg-teal/5' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {r.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <span className="text-ink/70">Ejercicio {i + 1}</span>
                </div>
                <span className={`font-mono-lab text-xs font-medium ${r.isCorrect ? 'text-teal' : 'text-red-500'}`}>
                  {r.isCorrect ? `+${r.exercise.xp_value} XP` : 'Incorrecto'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            {!allCorrect && (
              <button
                onClick={retry}
                className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-5 py-2.5 text-sm font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reintentar misión
              </button>
            )}
            {allCorrect && nextMission && (
              <button
                onClick={() => navigate(`/missions/${nextMission.id}`)}
                className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-5 py-2.5 text-sm font-medium flex items-center gap-2"
              >
                Siguiente misión <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => navigate('/missions')}
              className="border border-ink/15 hover:bg-ink/5 transition-colors text-ink/70 rounded-lg px-5 py-2.5 text-sm font-medium"
            >
              Volver a Misiones
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
