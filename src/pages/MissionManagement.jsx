import { useEffect, useState } from 'react'
import { Map } from 'lucide-react'
import { api } from '@/lib/api'

export default function MissionManagement() {
  const [missions, setMissions] = useState([])

  useEffect(() => { api.missions.list('misiones').then(setMissions).catch(() => {}) }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Map className="w-5 h-5" /> Gestión de Misiones</h1>
      <p className="text-slate-500 mb-6">Administra las misiones del curso. La edición de ejercicios se habilitará próximamente.</p>

      <div className="bg-white rounded-xl border divide-y">
        {missions.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="font-medium text-slate-800">{m.order}. {m.title}</div>
              <div className="text-xs text-slate-400">{m.difficulty} · {m.estimated_time} min · +{m.xp_reward} XP</div>
            </div>
            <span className="text-xs text-green-600">Activa</span>
          </div>
        ))}
      </div>
    </div>
  )
}
