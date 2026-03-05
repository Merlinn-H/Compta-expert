import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  Globe,
  Leaf,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useT } from '../hooks/useT'
import type { Language } from '../types'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const { clearAuth, language, setLanguage, jurisdiction, setJurisdiction, user } = useAppStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: t('dashboard') },
    { to: '/transactions', icon: <ArrowLeftRight size={20} />, label: t('transactions') },
    { to: '/tax/quebec', icon: <span className="text-sm font-bold">🍁</span>, label: t('taxQuebec') },
    { to: '/tax/france', icon: <span className="text-sm font-bold">🇫🇷</span>, label: t('taxFrance') },
    { to: '/reports', icon: <BarChart2 size={20} />, label: t('reports') },
    { to: '/settings', icon: <Settings size={20} />, label: t('settings') },
  ]

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Leaf size={22} className="text-emerald-400" />
            <span className="font-bold text-lg">Compta Expert</span>
          </div>
          {user && (
            <p className="text-slate-400 text-xs mt-1 truncate">{user.email}</p>
          )}
        </div>

        {/* Jurisdiction switcher */}
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Juridiction</p>
          <div className="flex gap-1">
            {(['all', 'quebec', 'france'] as const).map((j) => (
              <button
                key={j}
                onClick={() => setJurisdiction(j)}
                className={`flex-1 py-1 px-1 text-xs rounded font-medium transition-colors ${
                  jurisdiction === j
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {j === 'all' ? t('all') : j === 'quebec' ? '🍁 QC' : '🇫🇷 FR'}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive(to)
                  ? 'bg-slate-700 text-white border-l-2 border-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {icon}
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-2 w-full text-xs text-slate-400 hover:text-white py-1 px-2 rounded hover:bg-slate-800 transition-colors"
          >
            <Globe size={14} />
            {language === 'fr' ? 'Switch to English' : 'Passer en français'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-xs text-slate-400 hover:text-red-400 py-1 px-2 rounded hover:bg-slate-800 transition-colors"
          >
            <LogOut size={14} />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
