import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-[#457B9D]">Calculus Quest</Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/">Dashboard</Link>
          <Link to="/missions">Misiones</Link>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
