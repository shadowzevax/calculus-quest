import { MessageSquare } from 'lucide-react'

export default function Chat() {
  return (
    <div>
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">COMUNIDAD</div>
      <h1 className="text-3xl font-display font-bold text-ink mb-1 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-blueprint" /> Chat
      </h1>
      <p className="text-ink/50 mb-6">Comunicación entre docentes y estudiantes.</p>
      <div className="bg-white rounded-xl border border-ink/10 p-6 text-ink/35 text-sm font-mono-lab">
        PRÓXIMAMENTE: mensajería en tiempo real.
      </div>
    </div>
  )
}
