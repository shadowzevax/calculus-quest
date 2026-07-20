import { useState } from 'react'
import { Wrench, ScanSearch, CheckCircle2, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'

export default function RepairMissions() {
  const [result, setResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [disabling, setDisabling] = useState(false)

  const scan = async () => {
    setScanning(true)
    try {
      const r = await api.exercisesAudit.scan()
      setResult(r)
    } catch {} finally {
      setScanning(false)
    }
  }

  const disableProblematic = async () => {
    if (!result?.problems?.length) return
    if (!confirm(`¿Desactivar ${result.problems.length} ejercicio(s) mal configurado(s)? Podrás reactivarlos manualmente desde la base de datos.`)) return
    setDisabling(true)
    try {
      await api.exercisesAudit.disable(result.problems.map((p) => p.id))
      await scan()
    } finally {
      setDisabling(false)
    }
  }

  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">ADMINISTRACIÓN</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <Wrench className="w-6 h-6 text-blueprint" /> Reparar Misiones
      </h1>
      <p className="text-ink/50 mb-6">Analiza todos los ejercicios activos y detecta configuración incompleta o rota.</p>

      <button
        onClick={scan}
        disabled={scanning}
        className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
      >
        <ScanSearch className="w-4 h-4" /> {scanning ? 'Analizando...' : 'Analizar Ejercicios'}
      </button>

      {result && (
        <div className="mt-6">
          <p className="text-sm font-mono-lab text-ink/50 mb-3">
            {result.totalScanned} ejercicios analizados · {result.problems.length} con problemas
          </p>

          {result.problems.length === 0 ? (
            <div className="bg-teal/10 border border-teal/30 text-teal rounded-lg p-4 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5" /> Todos los ejercicios están correctamente configurados.
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-ink/10 divide-y divide-ink/5 mb-4">
                {result.problems.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-ink text-sm">{p.question || '(sin título)'}</div>
                      <div className="text-xs text-ink/40">{p.mission || 'Misión desconocida'}</div>
                      <div className="text-xs text-gold font-mono-lab mt-0.5">{p.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={disableProblematic}
                disabled={disabling}
                className="text-sm border border-red-200 text-red-500 rounded-lg px-4 py-2 hover:bg-red-50 disabled:opacity-50"
              >
                {disabling ? 'Desactivando...' : `Desactivar ${result.problems.length} ejercicio(s) problemático(s)`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
