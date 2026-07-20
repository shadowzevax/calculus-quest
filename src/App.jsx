import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import Dashboard from './pages/Dashboard'
import Missions from './pages/Missions'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/missions" element={<Missions />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
