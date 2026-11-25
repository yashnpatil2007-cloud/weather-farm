import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { alertsApi } from '../api'
import {
  BrandLogo,
  HomeIcon,
  SproutIcon,
  CloudSunIcon,
  LightbulbIcon,
  BellIcon,
  ChartBarIcon,
  SettingsIcon,
  ShieldIcon,
  LogoutIcon,
  MapPinIcon,
} from './Icons'
import { localizeCropName } from '../utils/localizeContent'

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>

const mobileItems: { to: string; Icon: IconComp; labelKey: string }[] = [
  { to: '/', Icon: HomeIcon, labelKey: 'nav.home' },
  { to: '/farm', Icon: SproutIcon, labelKey: 'nav.farm' },
  { to: '/advice', Icon: LightbulbIcon, labelKey: 'nav.advice' },
  { to: '/alerts', Icon: BellIcon, labelKey: 'nav.alerts' },
]

const desktopItems: { to: string; Icon: IconComp; labelKey: string }[] = [
  { to: '/', Icon: HomeIcon, labelKey: 'nav.dashboard' },
  { to: '/farm', Icon: SproutIcon, labelKey: 'nav.farm' },
  { to: '/weather', Icon: CloudSunIcon, labelKey: 'nav.weather' },
  { to: '/advice', Icon: LightbulbIcon, labelKey: 'nav.advice' },
  { to: '/alerts', Icon: BellIcon, labelKey: 'nav.alerts' },
  { to: '/history', Icon: ChartBarIcon, labelKey: 'nav.history' },
  { to: '/settings', Icon: SettingsIcon, labelKey: 'nav.settings' },
]

export default function Layout({ isAdmin = false }: { isAdmin?: boolean }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { farms, selectedFarm, selectedField, selectFarm, selectField } = useStore()
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

  const showAdmin = isAdmin || user?.role === 'admin'
  const items = showAdmin
    ? [...desktopItems.slice(0, 6), { to: '/admin', Icon: ShieldIcon, labelKey: 'nav.admin' }, desktopItems[6]]
    : desktopItems

  const currentPage = items.find((i) => i.to === location.pathname)
  const showContextBar = farms.length > 0 && location.pathname !== '/admin'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-950 text-white flex-col overflow-hidden border-r border-emerald-800/60 shadow-xl z-30">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 min-w-0">
          <BrandLogo className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold text-sm leading-tight tracking-tight text-white">AgriPulse</div>
            <div className="text-[11px] text-emerald-200/80 leading-snug truncate" title={t('appName')}>
              {t('appName')}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label={t('nav.menu')}>
          {items.map((item) => {
            const Icon = item.Icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/15'
                      : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
                {item.to === '/alerts' && unread > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-sm">
                    {unread}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/15">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-emerald-500/30 ring-1 ring-emerald-400/40 flex items-center justify-center font-bold text-sm shrink-0">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-sm font-semibold truncate">{user?.full_name}</div>
                <div className="text-[11px] text-emerald-200/80 capitalize">
                  {t(user?.role === 'admin' ? 'settings.adminRole' : 'settings.farmerRole')}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/welcome')
              }}
              className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label={t('auth.logout')}
              title={t('auth.logout')}
            >
              <LogoutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-emerald-950 text-white shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 font-bold min-w-0">
            <BrandLogo className="h-8 w-8 shrink-0" />
            <span className="text-sm font-display truncate">{t('appName')}</span>
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 text-xl rounded-lg hover:bg-white/10"
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <nav className="px-3 pb-3 space-y-1 border-t border-white/10 pt-2" aria-label={t('nav.menu')}>
            {items.map((item) => {
              const Icon = item.Icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
                      isActive ? 'bg-white/15 text-white' : 'text-emerald-100/85'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{t(item.labelKey)}</span>
                  {item.to === '/alerts' && unread > 0 && (
                    <span className="ml-auto bg-rose-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </NavLink>
              )
            })}
            <button
              onClick={() => {
                setMenuOpen(false)
                logout()
                navigate('/welcome')
              }}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-emerald-100/85 w-full text-left"
            >
              <LogoutIcon size={18} />
              <span>{t('auth.logout')}</span>
            </button>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="md:pl-64 pb-24 md:pb-10 min-w-0">
        {/* Global Top Context Bar (Farm + Field Switcher) */}
        <div className="sticky top-0 z-20 hidden md:block bg-white/85 backdrop-blur-md border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span>{currentPage ? t(currentPage.labelKey) : t('appName')}</span>
              {selectedFarm && showContextBar && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <MapPinIcon size={14} className="text-farm-600" />
                    {selectedFarm.location}
                  </span>
                </>
              )}
            </div>

            {showContextBar && (
              <div className="flex items-center gap-2.5">
                <label className="sr-only" htmlFor="topbar-farm">{t('farm.farm')}</label>
                <select
                  id="topbar-farm"
                  value={selectedFarm?.id ?? ''}
                  onChange={(e) => selectFarm(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-farm-500 focus:outline-none"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                {(selectedFarm?.fields?.length ?? 0) > 0 && (
                  <>
                    <label className="sr-only" htmlFor="topbar-field">{t('farm.fields')}</label>
                    <select
                      id="topbar-field"
                      value={selectedField?.id ?? ''}
                      onChange={(e) => selectField(Number(e.target.value))}
                      className="rounded-lg border border-farm-200 bg-farm-50 px-3 py-1.5 text-xs font-semibold text-farm-800 focus:border-farm-500 focus:outline-none"
                    >
                      {selectedFarm?.fields.map((fl) => (
                        <option key={fl.id} value={fl.id}>
                          {fl.name}{fl.crop ? ` · ${localizeCropName(fl.crop.name, t)}` : ''}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Farm/Field Quick Switcher */}
        {showContextBar && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <select
              aria-label={t('farm.farm')}
              value={selectedFarm?.id ?? ''}
              onChange={(e) => selectFarm(Number(e.target.value))}
              className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {(selectedFarm?.fields?.length ?? 0) > 0 && (
              <select
                aria-label={t('farm.fields')}
                value={selectedField?.id ?? ''}
                onChange={(e) => selectField(Number(e.target.value))}
                className="flex-1 min-w-0 rounded-lg border border-farm-200 bg-farm-50 px-2.5 py-1.5 text-xs font-semibold text-farm-800"
              >
                {selectedFarm?.fields.map((fl) => (
                  <option key={fl.id} value={fl.id}>{fl.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="max-w-6xl mx-auto w-full px-4 md:px-8 pt-5 md:pt-7 min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200"
        aria-label={t('nav.menu')}
      >
        <div className="grid grid-cols-4">
          {mobileItems.map((item) => {
            const Icon = item.Icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-2 text-[11px] font-semibold transition-colors ${
                    isActive ? 'text-farm-700' : 'text-slate-500'
                  }`
                }
              >
                <span className="relative mb-0.5">
                  <Icon size={20} />
                  {item.to === '/alerts' && unread > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </span>
                {t(item.labelKey)}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
