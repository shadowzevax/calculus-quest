import { useEffect, useState } from 'react'
import { Map, Pencil, X } from 'lucide-react'
import { api } from '@/lib/api'

function EditModal({ mission, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: mission.title,
    description: mission.description || '',
    difficulty: mission.difficulty,
    xp_reward: mission.xp_reward,
    estimated_time: mission.estimated_time,
  })
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.missions.update({ id: mission.id, ...form, xp_reward: Number(form.xp_reward), estimated_time: Number(form.estimated_time) })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-ink/10 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-ink">Editar misión</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-ink/40" /></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="text-xs text-ink/50">Título</label>
            <input className="w-full border border-ink/15 rounded-lg px-3 py-2 mt-1 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-ink/50">Descripción</label>
            <textarea className="w-full border border-ink/15 rounded-lg px-3 py-2 mt-1 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-ink/50">Dificultad</label>
              <select className="w-full border border-ink/15 rounded-lg px-2 py-2 mt-1 text-sm" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="facil">Fácil</option>
                <option value="intermedio">Intermedio</option>
                <option value="dificil">Difícil</option>
                <option value="experto">Experto</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/50">XP</label>
              <input type="number" className="w-full border border-ink/15 rounded-lg px-2 py-2 mt-1 text-sm" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-ink/50">Min.</label>
              <input type="number" className="w-full border border-ink/15 rounded-lg px-2 py-2 mt-1 text-sm" value={form.estimated_time} onChange={(e) => setForm({ ...form, estimated_time: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MissionManagement() {
  const [missions, setMissions] = useState([])
  const [editing, setEditing] = useState(null)

  const load = () => api.missions.list('misiones').then(setMissions).catch(() => {})
  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">ADMINISTRACIÓN</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <Map className="w-6 h-6 text-blueprint" /> Gestión de Misiones
      </h1>
      <p className="text-ink/50 mb-6">Edita título, descripción, dificultad, XP y duración de cada misión.</p>

      <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5">
        {missions.map((m) => (
          <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <div className="font-medium text-ink">{m.order}. {m.title}</div>
              <div className="text-xs font-mono-lab text-ink/40">{m.difficulty} · {m.estimated_time} min · +{m.xp_reward} XP</div>
            </div>
            <button onClick={() => setEditing(m)} className="text-xs border border-ink/15 rounded px-2 py-1.5 text-ink/60 hover:bg-ink/5 flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <EditModal
          mission={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}
