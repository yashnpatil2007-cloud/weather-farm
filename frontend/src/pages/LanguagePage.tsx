import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, setLanguage, type LanguageCode } from '../i18n'
import { useAuth } from '../context/AuthContext'
import { BrandLogo, CheckCircleIcon } from '../components/Icons'

const codesBadge: Record<string, string> = {
  en: 'EN',
  hi: 'हि',
  mr: 'म',
}

export default function LanguagePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { changeLanguage, language, user } = useAuth()

  const select = (code: LanguageCode) => {
    setLanguage(code)
    changeLanguage(code)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <BrandLogo className="h-12 w-12 mb-4" />
        <h1 className="font-display text-3xl font-extrabold text-center">{t('language.title')}</h1>
        <p className="mt-3 text-emerald-100/85 text-center max-w-md text-sm">{t('language.subtitle')}</p>

        <div className="mt-9 space-y-3 w-full max-w-md">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = language === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => select(lang.code as LanguageCode)}
                className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 transition-all text-left border ${
                  active
                    ? 'bg-white/20 border-emerald-300 shadow-lg'
                    : 'bg-white/10 border-white/10 hover:bg-white/15'
                }`}
                aria-pressed={active}
              >
                <span className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-sm shrink-0">
                  {codesBadge[lang.code]}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-lg">{lang.nativeName}</div>
                  <div className="text-xs text-emerald-100/80">{lang.name}</div>
                </div>
                {active ? <CheckCircleIcon size={22} className="text-emerald-300" /> : <span className="text-lg opacity-60">→</span>}
              </button>
            )
          })}
        </div>

        <div className="mt-8 w-full max-w-md">
          <button
            type="button"
            onClick={() => (user ? navigate(user.role === 'admin' ? '/admin' : '/') : navigate('/auth'))}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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
            <span>{user ? t('nav.dashboard') : t('language.continue')} →</span>
          </button>
        </div>
      </div>
    </div>
  )
}
