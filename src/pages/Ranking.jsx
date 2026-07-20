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
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Ranking</h1>
      <p className="text-slate-500 mb-6">Los mejores estudiantes por XP acumulado.</p>
      <div className="bg-white rounded-xl border divide-y">
        {rows.map((r, i) => (
          <div key={r.id} className={`flex items-center gap-4 px-5 py-3 ${r.id === user?.id ? 'bg-[#457B9D]/5' : ''}`}>
            <span className="w-6 text-center font-bold text-slate-400">{i + 1}</span>
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
              {r.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-800">{r.full_name}</div>
              <div className="text-xs text-slate-400">Nivel {r.level}</div>
            </div>
            <div className="font-semibold text-[#457B9D]">{r.xp} XP</div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-5 text-slate-400 text-sm">Aún no hay estudiantes en el ranking.</p>}
      </div>
    </div>
  )
}
