import { useEffect, useState } from 'react'
import { NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, Trophy, MessageSquare, User, BarChart3,
  Users, Map, LogOut, Shield, MessagesSquare, BarChart2, Menu, X,
} from 'lucide-react'
import { useAuth } from './lib/AuthContext'
import MiniCurve from './components/MiniCurve'
import { AvatarCircle } from './components/ui/avatar-circle'
import Login from './pages/Login'

const studentNav = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/missions', label: 'Misiones', icon: BookOpen },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/profile', label: 'Mi Perfil', icon: User },
  { to: '/survey', label: 'Encuesta', icon: MessagesSquare },
]

const adminNav = [
  { to: '/teacher-panel', label: 'Panel Docente', icon: BarChart3 },
  { to: '/teacher-analytics', label: 'Analítica', icon: BarChart2 },
  { to: '/user-management', label: 'Gestión Usuarios', icon: Users },
  // "Gestión Misiones" oculto a pedido del usuario (2026-09-08) — la ruta /mission-management
  // sigue existiendo en App.jsx, solo se quitó del menú. Volver a agregar aquí cuando pida
  // que se muestre de nuevo: { to: '/mission-management', label: 'Gestión Misiones', icon: Map },
]

// Rutas que solo tienen sentido para docente/admin. El backend YA las protege de verdad (sin
// fuga de datos posible), pero antes de esto un estudiante que llegaba aquí por curiosidad o
// un enlace guardado veía la pantalla real, rota: "Aún no hay estudiantes registrados" (en
// realidad un 403 silenciado) o un "Cargando..." infinito — hallazgo de la auditoría de
// calidad, 2026-09-21. Ahora se le manda de vuelta al Dashboard sin exponer esa confusión.
const STAFF_ONLY_PATHS = ['/teacher-panel', '/teacher-analytics', '/user-management', '/mission-management']

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
  const location = useLocation()
  const isAdmin = (user?.role === 'admin' || user?.role === 'superadmin')
  // El sidebar (256px fijos, sin ninguna clase responsive) se comía el 68% del ancho en un
  // celular de 375px, dejando ~119px para el contenido de la misión — suficiente para que
  // varios grids de 2 columnas colapsaran a 0px de ancho real y quedaran imposibles de tocar
  // (hallazgo de la auditoría de calidad, 2026-09-21, confirmado con getBoundingClientRect() en
  // las Misiones 1, 9, 11 y 13). Ahora es un cajón (drawer) que se desliza sobre el contenido en
  // pantallas angostas, y vuelve a ser parte normal del layout desde el breakpoint `md`.
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  useEffect(() => { setMobileNavOpen(false) }, [location.pathname])

  // Sin sesión: se muestra el login sin importar qué ruta se haya pedido
  // (antes se mostraba "children", es decir la página de esa ruta, lo que
  // dejaba ver el Dashboard sin haber iniciado sesión).
  if (!isLoadingAuth && !user) {
    return (
      <div className="min-h-screen bg-paper bg-grid-light bg-grid flex items-center justify-center font-body">
        <div className="max-w-md w-full"><Login /></div>
      </div>
    )
  }

  if (isLoadingAuth) return null

  // Estudiante con sesión, en una ruta de docente/admin: de vuelta al Dashboard, sin mostrar
  // la pantalla rota (ver comentario de STAFF_ONLY_PATHS arriba).
  if (!isAdmin && STAFF_ONLY_PATHS.includes(location.pathname)) {
    return <Navigate to="/" replace />
  }

  // h-screen + overflow-hidden aquí y overflow-y-auto solo en <main>: así el
  // scroll queda contenido en el contenido y el sidebar no se mueve.
  return (
    <div className="h-screen flex font-body overflow-hidden">
      {/* Fondo oscuro detrás del cajón, solo en móvil — tocarlo cierra el menú. */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-ink/50 z-30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 h-full bg-blueprint bg-grid-dark bg-grid flex flex-col shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-out ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:inset-auto md:z-auto md:translate-x-0`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blueprint/0 via-blueprint/40 to-blueprint pointer-events-none" />

        <div className="relative p-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-coral/15 border border-coral/40 flex items-center justify-center shrink-0">
            <MiniCurve seed="logo" width={26} height={20} stroke="#FF6B4A" animate={false} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-white leading-tight tracking-tight">FuncionLab</div>
            <div className="text-[11px] font-mono-lab text-white/40 tracking-wide">LABORATORIO DEL FUTURO</div>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden text-white/50 hover:text-white transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
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
              <AvatarCircle
                name={user.full_name}
                image={user.avatar}
                avatarConfig={user.avatar_config}
                glow={user.avatar_glow}
                className="w-9 h-9 bg-coral/20 border border-coral/40"
                textClassName="text-sm font-display font-semibold text-coral"
              />
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

      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {/* Barra superior solo en móvil: el sidebar completo vive en el cajón de arriba. */}
        <div className="md:hidden shrink-0 flex items-center gap-3 h-14 px-4 bg-blueprint bg-grid-dark bg-grid border-b border-white/10">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="text-white/70 hover:text-white transition-colors -ml-1 p-1"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-7 h-7 rounded-md bg-coral/15 border border-coral/40 flex items-center justify-center shrink-0">
            <MiniCurve seed="logo-mobile" width={18} height={14} stroke="#FF6B4A" animate={false} />
          </div>
          <span className="font-display font-semibold text-white text-sm truncate">FuncionLab</span>
        </div>

        <main className="flex-1 overflow-y-auto bg-paper bg-grid-light bg-grid p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
