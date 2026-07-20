import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, Trophy, MessageSquare, User, BarChart3,
  Users, Map, Wrench, LogOut, Shield,
} from 'lucide-react'
import { useAuth } from './lib/AuthContext'
import MiniCurve from './components/MiniCurve'

const studentNav = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/missions', label: 'Misiones', icon: BookOpen },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/profile', label: 'Mi Perfil', icon: User },
]

const adminNav = [
  { to: '/teacher-panel', label: 'Panel Docente', icon: BarChart3 },
  { to: '/user-management', label: 'Gestión Usuarios', icon: Users },
  { to: '/mission-management', label: 'Gestión Misiones', icon: Map },
  { to: '/repair-missions', label: 'Reparar Misiones', icon: Wrench },
]

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `group flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-md text-sm font-medium font-body transition-colors border-l-2 ${
          isActive
            ? 'bg-white/10 text-white border-coral'
            : 'text-white/55 border-transparent hover:text-white/85 hover:bg-white/5'
        }`
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { user, isLoadingAuth, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  if (!isLoadingAuth && !user) {
    return (
      <div className="min-h-screen bg-paper bg-grid-light bg-grid flex items-center justify-center font-body">
        <div className="max-w-md w-full">{children}</div>
      </div>
    )
  }

  // h-screen + overflow-hidden aquí y overflow-y-auto solo en <main>: así el
  // scroll queda contenido en el contenido y el sidebar no se mueve.
  return (
    <div className="h-screen flex font-body overflow-hidden">
      <aside className="w-64 h-full bg-blueprint bg-grid-dark bg-grid flex flex-col shrink-0 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blueprint/0 via-blueprint/40 to-blueprint pointer-events-none" />

        <div className="relative p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-coral/15 border border-coral/40 flex items-center justify-center">
            <MiniCurve seed="logo" width={26} height={20} stroke="#FF6B4A" animate={false} />
          </div>
          <div>
            <div className="font-display font-semibold text-white leading-tight tracking-tight">Cálculo Lab</div>
            <div className="text-[11px] font-mono-lab text-white/40 tracking-wide">LABORATORIO DEL FUTURO</div>
          </div>
        </div>

        {isAdmin && (
          <div className="relative mx-4 mt-4 p-3 rounded-md bg-gold/10 border border-gold/30">
            <div className="flex items-center gap-2 text-gold text-xs font-semibold font-mono-lab tracking-wide">
              <Shield className="w-3.5 h-3.5" /> MODO DOCENTE
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">Acceso completo al sistema</div>
          </div>
        )}

        <nav className="relative flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {studentNav.map((item) => <NavItem key={item.to} {...item} />)}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-4 text-[10px] font-mono-lab font-semibold text-white/30 tracking-widest">ADMINISTRACIÓN</div>
              {adminNav.map((item) => <NavItem key={item.to} {...item} />)}
            </>
          )}
        </nav>

        {user && (
          <div className="relative p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-coral/20 border border-coral/40 flex items-center justify-center text-sm font-display font-semibold text-coral">
                {user.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.full_name}</div>
                <div className="text-[11px] font-mono-lab text-white/40 truncate">{user.xp} XP</div>
              </div>
              {isAdmin && (
                <span className="text-[10px] font-mono-lab font-bold bg-gold/20 text-gold rounded px-1.5 py-0.5">ADMIN</span>
              )}
            </div>
            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="mt-3 flex items-center gap-2 text-xs text-white/40 hover:text-coral transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-paper bg-grid-light bg-grid p-8">{children}</main>
    </div>
  )
}
