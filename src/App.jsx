import './App.css'
import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Layout from './Layout'

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
const MissionManagement = lazy(() => import('./pages/MissionManagement'))
const Diagnostic = lazy(() => import('./pages/Diagnostic'))
const Survey = lazy(() => import('./pages/Survey'))
const TeacherAnalytics = lazy(() => import('./pages/TeacherAnalytics'))

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
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
              <Route path="/mission-management" element={<MissionManagement />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route path="/survey" element={<Survey />} />
              <Route path="/teacher-analytics" element={<TeacherAnalytics />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
