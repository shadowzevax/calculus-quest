import { useEffect, useState } from 'react'
import { Map } from 'lucide-react'
import { api } from '@/lib/api'

export default function MissionManagement() {
  const [missions, setMissions] = useState([])

  useEffect(() => { api.missions.list('misiones').then(setMissions).catch(() => {}) }, [])

  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">ADMINISTRACIÓN</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <Map className="w-6 h-6 text-blueprint" /> Gestión de Misiones
      </h1>
      <p className="text-ink/50 mb-6">Administra las misiones del curso. La edición de ejercicios se habilitará próximamente.</p>

      <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
        {missions.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="font-medium text-ink">{m.order}. {m.title}</div>
              <div className="text-xs font-mono-lab text-ink/40">{m.difficulty} · {m.estimated_time} min · +{m.xp_reward} XP</div>
            </div>
            <span className="text-xs font-mono-lab text-teal">ACTIVA</span>
          </div>
        ))}
      </div>
    </div>
  )
}
