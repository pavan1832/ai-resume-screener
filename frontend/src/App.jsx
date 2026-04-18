import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Users, Star, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import Candidates from './pages/Candidates'
import Shortlisted from './pages/Shortlisted'

const nav = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/jobs',        label: 'Jobs',         icon: Briefcase },
  { to: '/candidates',  label: 'Candidates',   icon: Users },
  { to: '/shortlisted', label: 'Shortlisted',  icon: Star },
]

export default function App() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-gray-900 flex flex-col
        transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-white">
              <span className="text-teal-400">Recruit</span>AI
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5">AI Resume Screener</p>
          </div>
          <button className="lg:hidden text-gray-400" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors
                 border-l-2 ${isActive
                   ? 'bg-gray-800 text-white border-teal-400 font-semibold'
                   : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-[11px] text-gray-600">Powered by Sentence Transformers</p>
          <p className="text-[11px] text-gray-600">all-MiniLM-L6-v2 + spaCy</p>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="text-gray-600">
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-900">
            <span className="text-teal-600">Recruit</span>AI
          </span>
        </header>

        <main className="flex-1 p-5 lg:p-7 max-w-6xl w-full mx-auto">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/jobs"        element={<Jobs />} />
            <Route path="/candidates"  element={<Candidates />} />
            <Route path="/shortlisted" element={<Shortlisted />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
