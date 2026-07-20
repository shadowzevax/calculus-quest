import { Wrench } from 'lucide-react'

export default function RepairMissions() {
  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">ADMINISTRACIÓN</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <Wrench className="w-6 h-6 text-blueprint" /> Reparar Misiones
      </h1>
      <p className="text-ink/50 mb-6">Herramientas automáticas de diagnóstico y reparación de ejercicios.</p>
      <div className="bg-white rounded-xl border border-ink/10 p-6 text-ink/35 text-sm font-mono-lab">
        PRÓXIMAMENTE: detección de ejercicios mal configurados, duplicados y vacíos.
      </div>
    </div>
  )
}
