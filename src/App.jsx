import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import Missions from './pages/Missions'
import MissionDetail from './pages/MissionDetail'
import Login from './pages/Login'
import Ranking from './pages/Ranking'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import TeacherPanel from './pages/TeacherPanel'
import UserManagement from './pages/UserManagement'
import MissionManagement from './pages/MissionManagement'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
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
            <Route path="/login" element={<Login />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
