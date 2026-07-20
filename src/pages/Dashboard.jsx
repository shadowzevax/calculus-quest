import { useAuth } from '@/lib/AuthContext'

export default function Dashboard() {
  const { user, isLoadingAuth } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold">Bienvenido a Calculus Quest</h1>
      {isLoadingAuth ? (
        <p className="text-slate-500 mt-2">Cargando...</p>
      ) : user ? (
        <p className="text-slate-500 mt-2">
          Hola {user.full_name}, tienes {user.xp} XP y estás en nivel {user.level}.
        </p>
      ) : (
        <p className="text-slate-500 mt-2">Inicia sesión para empezar tu progreso.</p>
      )}
    </div>
  )
}
