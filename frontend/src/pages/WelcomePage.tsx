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
          <Button variant="white" size="lg" className="!bg-white !text-farm-800 hover:!bg-farm-50 shadow-lg text-lg font-bold" onClick={handleStart}>
            {t('welcome.getStarted')} →
          </Button>
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-farm-200">{t('tagline')}</footer>
    </div>
  )
}
