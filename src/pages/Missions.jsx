import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function Missions() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.missions.list('misiones')
      .then(setMissions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando misiones...</p>
  if (error) return <p className="text-red-500">Error: {error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Misiones</h1>
      {missions.length === 0 && <p className="text-slate-500">Aún no hay misiones cargadas.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {missions.map((m) => (
          <div key={m.id} className="bg-white rounded-lg p-4 shadow">
            <h2 className="font-semibold">{m.title}</h2>
            <p className="text-sm text-slate-500">{m.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
