import { Wrench } from 'lucide-react'

export default function RepairMissions() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Wrench className="w-5 h-5" /> Reparar Misiones</h1>
      <p className="text-slate-500 mb-6">Herramientas automáticas de diagnóstico y reparación de ejercicios.</p>
      <div className="bg-white rounded-xl border p-6 text-slate-400 text-sm">
        Próximamente: detección de ejercicios mal configurados, duplicados y vacíos.
      </div>
    </div>
  )
}
