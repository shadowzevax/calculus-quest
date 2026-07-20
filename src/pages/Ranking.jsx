import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

export default function Ranking() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])

  useEffect(() => { api.ranking.list().then(setRows).catch(() => {}) }, [])

  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">TABLA DE POSICIONES</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-gold" /> Ranking
      </h1>
      <p className="text-ink/50 mb-6">Los mejores estudiantes por XP acumulado.</p>
      <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
        {rows.map((r, i) => (
          <div key={r.id} className={`flex items-center gap-4 px-5 py-3.5 ${r.id === user?.id ? 'bg-coral/5' : ''}`}>
            <span className="w-6 text-center font-display font-bold text-ink/30">{i + 1}</span>
            <div className="w-9 h-9 rounded-full bg-blueprint/10 flex items-center justify-center text-sm font-display font-semibold text-blueprint">
              {r.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-ink">{r.full_name}</div>
              <div className="text-[11px] font-mono-lab text-ink/35">NIVEL {r.level}</div>
            </div>
            <div className="font-mono-lab font-semibold text-coral">{r.xp} XP</div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-5 text-ink/35 text-sm">Aún no hay estudiantes en el ranking.</p>}
      </div>
    </div>
  )
}
