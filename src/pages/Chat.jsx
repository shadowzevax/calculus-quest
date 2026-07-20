import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, Trash2, Ban } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

export default function Chat() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  const load = () => {
    api.messages.list().then(setMessages).catch(() => {})
    api.settings.get().then((s) => setEnabled(s.chat_enabled !== 'false')).catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    try {
      await api.messages.send(text.trim())
      setText('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const clearChat = async () => {
    if (!confirm('¿Borrar todos los mensajes del chat?')) return
    await api.messages.clear()
    load()
  }

  const toggleChat = async () => {
    await api.settings.set('chat_enabled', enabled ? 'false' : 'true')
    load()
  }

  return (
    <div className="max-w-2xl">
      <div className="text-[11px] font-mono-lab text-coral tracking-widest mb-2">COMUNIDAD</div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-display font-bold text-ink flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blueprint" /> Chat
        </h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={toggleChat} className="text-xs border border-ink/15 rounded px-2 py-1.5 text-ink/60 hover:bg-ink/5 flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> {enabled ? 'Desactivar Chat' : 'Activar Chat'}
            </button>
            <button onClick={clearChat} className="text-xs border border-ink/15 rounded px-2 py-1.5 text-red-500 hover:bg-red-50 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Limpiar Chat
            </button>
          </div>
        )}
      </div>
      <p className="text-ink/50 mb-6">Comunicación entre docentes y estudiantes del laboratorio.</p>

      {!enabled && !isAdmin && (
        <div className="bg-gold/10 border border-gold/30 text-gold text-sm rounded-lg p-3 mb-4">
          El docente ha desactivado el chat temporalmente.
        </div>
      )}

      <div className="bg-white rounded-xl border border-ink/10 flex flex-col h-[420px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                m.user_id === user?.id ? 'bg-coral text-white' : 'bg-ink/5 text-ink'
              }`}>
                <div className="text-[10px] font-mono-lab opacity-60 mb-0.5">
                  {m.author_name} {m.role === 'admin' && '· Docente'}
                </div>
                {m.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-ink/35 text-sm font-mono-lab">Aún no hay mensajes. ¡Sé el primero en escribir!</p>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="border-t border-ink/10 p-3 flex gap-2">
          <input
            className="flex-1 border border-ink/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral"
            placeholder={enabled || isAdmin ? 'Escribe un mensaje...' : 'El chat está desactivado'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!enabled && !isAdmin}
          />
          <button
            type="submit"
            disabled={!enabled && !isAdmin}
            className="bg-blueprint hover:bg-coral transition-colors text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}
