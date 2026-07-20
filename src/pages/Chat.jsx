import { MessageSquare } from 'lucide-react'

export default function Chat() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Chat</h1>
      <p className="text-slate-500 mb-6">Comunicación entre docentes y estudiantes.</p>
      <div className="bg-white rounded-xl border p-6 text-slate-400 text-sm">
        Próximamente: mensajería en tiempo real.
      </div>
    </div>
  )
}
