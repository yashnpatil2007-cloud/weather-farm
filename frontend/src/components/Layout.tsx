import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { alertsApi } from '../api'

const mobileItems = [
  { to: '/', icon: '🏠', labelKey: 'nav.home' },
  { to: '/farm', icon: '🌾', labelKey: 'nav.farm' },
  { to: '/advice', icon: '💡', labelKey: 'nav.advice' },
  { to: '/alerts', icon: '🔔', labelKey: 'nav.alerts' },
]

const desktopItems = [
  { to: '/', icon: '🏠', labelKey: 'nav.dashboard' },
  { to: '/farm', icon: '🌾', labelKey: 'nav.farm' },
  { to: '/weather', icon: '🌦', labelKey: 'nav.weather' },
  { to: '/advice', icon: '💡', labelKey: 'nav.advice' },
  { to: '/alerts', icon: '🔔', labelKey: 'nav.alerts' },
  { to: '/history', icon: '📊', labelKey: 'nav.history' },
  { to: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
]

export default function Layout({ isAdmin = false }: { isAdmin?: boolean }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const c = await alertsApi.unreadCount()
        setUnread(c)
      } catch {
        /* ignore */
      }
    }
    load()
  }, [location.pathname])

  const items = isAdmin
    ? [...desktopItems.slice(0, 5), { to: '/admin', icon: '🛠️', labelKey: 'nav.admin' }, desktopItems[6]]
    : desktopItems

  const currentPage = items.find((i) => i.to === location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-farm-700 text-white flex-col">
        <div className="flex items-center gap-3 px-5 py-6 min-w-0">
          <span className="text-3xl shrink-0" aria-hidden="true">🌾</span>
          <div className="min-w-0">
            <div className="font-bold leading-tight break-words">{t('appName')}</div>
            <div className="text-xs text-farm-200 leading-snug break-words">{t('tagline')}</div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1" aria-label={t('nav.menu')}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                  isActive ? 'bg-farm-800 text-white' : 'text-farm-100 hover:bg-farm-800/60'
                }`
              }
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
              {item.to === '/alerts' && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-farm-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-farm-800 flex items-center justify-center font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">{user?.full_name}</div>
                <div className="text-xs text-farm-200 capitalize">{t(user?.role === 'admin' ? 'settings.adminRole' : 'settings.farmerRole')}</div>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/welcome')
              }}
              className="text-farm-200 hover:text-white text-xl"
              aria-label={t('auth.logout')}
              title={t('auth.logout')}
            >
              <span aria-hidden="true">⏻</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-farm-700 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="text-2xl" aria-hidden="true">🌾</span>
            <span className="text-sm truncate max-w-[200px]">{t('appName')}</span>
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 text-2xl"
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <nav className="px-3 pb-3 space-y-1" aria-label={t('nav.menu')}>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium ${
                    isActive ? 'bg-farm-800 text-white' : 'text-farm-100'
                  }`
                }
              >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span>{t(item.labelKey)}</span>
                {item.to === '/alerts' && unread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false)
                logout()
                navigate('/welcome')
              }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-farm-100 w-full text-left"
            >
              <span className="text-xl" aria-hidden="true">⏻</span>
              <span>{t('auth.logout')}</span>
            </button>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="md:pl-64 pb-20 md:pb-8 min-w-0">
        <div className="max-w-5xl mx-auto w-full px-4 md:px-8 min-w-0 overflow-x-hidden">
          <div className="md:hidden pt-2 pb-2 text-sm text-gray-600">
            {currentPage ? `${t('nav.home')} › ${t(currentPage.labelKey)}` : ''}
          </div>
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200"
        aria-label={t('nav.menu')}
      >
        <div className="grid grid-cols-4">
          {mobileItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
                  isActive ? 'text-farm-700' : 'text-gray-500'
                }`
              }
            >
              <span className="text-2xl relative" aria-hidden="true">
                {item.icon}
                {item.to === '/alerts' && unread > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
