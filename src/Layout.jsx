import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, Trophy, MessageSquare, User, BarChart3,
  Users, Map, Wrench, LogOut, Sparkles, Shield,
} from 'lucide-react'
import { useAuth } from './lib/AuthContext'

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
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-[#457B9D]/10 text-[#457B9D]' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      <Icon className="w-4 h-4" />
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
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="max-w-md w-full">{children}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex">
      <aside className="w-64 bg-white border-r flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#457B9D] to-[#F4A261] flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-800 leading-tight">Cálculo Lab</div>
            <div className="text-xs text-slate-400">Laboratorio del Futuro</div>
          </div>
        </div>

        {isAdmin && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-center gap-2 text-purple-700 text-sm font-semibold">
              <Shield className="w-4 h-4" /> Panel de Administrador
            </div>
            <div className="text-xs text-purple-500 mt-0.5">Acceso completo al sistema</div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {studentNav.map((item) => <NavItem key={item.to} {...item} />)}
          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-4 text-xs font-semibold text-slate-400 uppercase">Administración</div>
              {adminNav.map((item) => <NavItem key={item.to} {...item} />)}
            </>
          )}
        </nav>

        {user && (
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                {user.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{user.full_name}</div>
                <div className="text-xs text-slate-400 truncate">{user.email}</div>
              </div>
              {isAdmin && (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-600 rounded px-1.5 py-0.5">Admin</span>
              )}
            </div>
            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="mt-3 flex items-center gap-2 text-xs text-red-500 hover:text-red-600"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
