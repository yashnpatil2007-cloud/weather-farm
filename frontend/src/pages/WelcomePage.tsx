import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleStart = () => {
    if (user) navigate('/')
    else navigate('/language')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-farm-600 via-farm-700 to-farm-800 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="text-7xl mb-4" aria-hidden="true">🌾</div>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-2xl">
          {t('welcome.title')}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-farm-100 max-w-xl">{t('welcome.subtitle')}</p>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🌦️</span>
            <span className="font-medium">{t('welcome.features.weather')}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">💡</span>
            <span className="font-medium">{t('welcome.features.advice')}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🗣️</span>
            <span className="font-medium">{t('welcome.features.multilingual')}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">🔊</span>
            <span className="font-medium">{t('welcome.features.voice')}</span>
          </div>
        </div>

        <div className="mt-10">
          <button
            type="button"
            onClick={handleStart}
            className="py-4 px-8 rounded-xl font-bold text-lg shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: '#ffffff',
              color: '#15803d',
              border: 'none',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0fdf4'
              e.currentTarget.style.color = '#14532d'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.color = '#15803d'
            }}
          >
            <span style={{ color: '#15803d', fontWeight: 700, fontSize: '1.125rem' }}>
              {t('welcome.getStarted')} →
            </span>
          </button>
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-farm-200">{t('tagline')}</footer>
    </div>
  )
}
