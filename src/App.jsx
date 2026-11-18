import './App.css'
import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Layout from './Layout'
import ChunkErrorBoundary from './ChunkErrorBoundary'

// Cada página se descarga en su propio archivo separado, solo cuando se visita esa ruta —
// antes todas (incluidas las de admin, que la mayoría de usuarios nunca abre) iban juntas en
// un único bundle de 1.4MB que había que bajar y parsear completo para ver hasta el Dashboard.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Missions = lazy(() => import('./pages/Missions'))
const MissionDetail = lazy(() => import('./pages/MissionDetail'))
const Login = lazy(() => import('./pages/Login'))
const Ranking = lazy(() => import('./pages/Ranking'))
const Profile = lazy(() => import('./pages/Profile'))
const Chat = lazy(() => import('./pages/Chat'))
const TeacherPanel = lazy(() => import('./pages/TeacherPanel'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const TeacherAnalytics = lazy(() => import('./pages/TeacherAnalytics'))

// Antes una dirección inexistente dejaba la página en blanco dentro del layout.
function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <h1 className="text-xl font-display font-semibold text-ink mb-2">Página no encontrada</h1>
      <p className="text-sm text-ink/60 mb-5">Esta dirección no existe en FuncionLab.</p>
      <Link to="/" className="text-sm text-coral font-medium">Volver al inicio</Link>
    </div>
  )
}

function App() {
  // Si esta carga sí funcionó, se limpia la marca de "ya recargué por un chunk roto" —
  // así un futuro redeploy real (mientras el usuario sigue con la pestaña abierta) puede
  // volver a disparar el auto-reload en vez de quedar bloqueado para siempre en esta pestaña.
  useEffect(() => { sessionStorage.removeItem('funcionlab_chunk_reload') }, [])

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <ChunkErrorBoundary>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/missions" element={<Missions />} />
                <Route path="/missions/:id" element={<MissionDetail />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/teacher-panel" element={<TeacherPanel />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/teacher-analytics" element={<TeacherAnalytics />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ChunkErrorBoundary>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
