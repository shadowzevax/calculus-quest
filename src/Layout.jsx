import { Link } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-[#457B9D]">Calculus Quest</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/">Dashboard</Link>
          <Link to="/missions">Misiones</Link>
          {user ? (
            <>
              <span className="text-slate-500">{user.full_name} · {user.xp} XP</span>
              <button onClick={logout} className="text-red-500">Salir</button>
            </>
          ) : (
            <Link to="/login" className="text-[#457B9D] font-medium">Iniciar sesión</Link>
          )}
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
