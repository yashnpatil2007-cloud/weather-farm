import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from '../i18n'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'

const flags: Record<string, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  mr: '🇮🇳',
}

export default function LanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { changeLanguage, user } = useAuth()

  const select = (code: LanguageCode) => {
    setLanguage(code)
    changeLanguage(code)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-farm-600 to-farm-800 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="text-6xl mb-4" aria-hidden="true">🌍</div>
        <h1 className="text-3xl font-bold text-center">{t('language.title')}</h1>
        <p className="mt-3 text-farm-100 text-center max-w-md">{t('language.subtitle')}</p>

        <div className="mt-10 space-y-3 w-full max-w-md">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => select(lang.code as LanguageCode)}
              className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 rounded-2xl px-5 py-4 transition-colors text-left"
            >
              <span className="text-3xl" aria-hidden="true">{flags[lang.code]}</span>
              <div className="flex-1">
                <div className="font-bold text-lg">{lang.nativeName}</div>
                <div className="text-sm text-farm-100">{lang.name}</div>
              </div>
              <span className="text-xl" aria-hidden="true">→</span>
            </button>
          ))}
        </div>

        <div className="mt-8 w-full max-w-md">
          <button
            type="button"
            onClick={() => (user ? navigate('/') : navigate('/auth'))}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              {user ? t('nav.dashboard') : t('language.continue')} →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
