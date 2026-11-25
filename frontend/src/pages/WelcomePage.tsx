import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { BrandLogo, CloudSunIcon, LightbulbIcon, BellIcon, SproutIcon } from '../components/Icons'

export default function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStart = () => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/')
    else navigate('/language')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white flex flex-col relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" aria-hidden="true" />

      <header className="relative z-10 max-w-5xl mx-auto w-full px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-10 w-10" />
          <div>
            <div className="font-display font-bold text-base leading-tight">AgriPulse</div>
            <div className="text-xs text-emerald-200/80">WBFAS Decision Support</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="text-sm font-semibold text-emerald-100 hover:text-white border border-white/20 rounded-xl px-4 py-2 hover:bg-white/10 transition-colors"
        >
          {t('auth.login')}
        </button>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1 text-xs font-semibold text-emerald-200 mb-5">
          <SproutIcon size={14} /> Precision Agrometeorology Platform
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight max-w-2xl tracking-tight">
          {t('welcome.title')}
        </h1>
        <p className="mt-4 text-base md:text-lg text-emerald-100/90 max-w-xl leading-relaxed">{t('welcome.subtitle')}</p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl text-left">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0"><CloudSunIcon size={20} /></div>
            <span className="font-semibold text-sm">{t('welcome.features.weather')}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0"><LightbulbIcon size={20} /></div>
            <span className="font-semibold text-sm">{t('welcome.features.advice')}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 shrink-0"><SproutIcon size={20} /></div>
            <span className="font-semibold text-sm">{t('welcome.features.multilingual')}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 shrink-0"><BellIcon size={20} /></div>
            <span className="font-semibold text-sm">{t('welcome.features.voice')}</span>
          </div>
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={handleStart}
            className="py-4 px-9 rounded-2xl font-bold text-lg shadow-xl shadow-black/25 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#ffffff', color: '#065f46' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ecfdf5'
              e.currentTarget.style.color = '#064e3b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.color = '#065f46'
            }}
          >
            <span>{t('welcome.getStarted')} →</span>
          </button>
        </div>
      </div>

      <footer className="relative z-10 py-4 text-center text-xs text-emerald-200/75">{t('tagline')}</footer>
    </div>
  )
}
