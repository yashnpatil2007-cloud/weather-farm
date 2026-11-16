import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n'
import Card from '../components/Card'
import Button from '../components/Button'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, logout, language, changeLanguage } = useAuth()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)

  const selectLanguage = (code: LanguageCode) => {
    changeLanguage(code)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 mt-1">{t('settings.subtitle')}</p>
      </header>

      {/* Language */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-1">🌐 {t('settings.language')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('settings.languageSubtitle')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code as LanguageCode)}
              className={`rounded-xl border-2 px-4 py-3 text-left ${language === lang.code ? 'border-farm-600 bg-farm-50 text-farm-700' : 'border-gray-200 hover:border-farm-300'}`}
              aria-pressed={language === lang.code}
            >
              <div className="font-bold">{lang.nativeName}</div>
              <div className="text-xs text-gray-400">{lang.name}</div>
            </button>
          ))}
        </div>
        {saved && (
          <p className="mt-3 text-sm text-farm-700" role="status" aria-live="polite">{t('settings.saved')}</p>
        )}
      </Card>

      {/* Profile */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4">👤 {t('settings.profile')}</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">{t('settings.fullName')}</dt><dd className="font-medium">{user?.full_name}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">{t('settings.email')}</dt><dd className="font-medium">{user?.email}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">{t('settings.phone')}</dt><dd className="font-medium">{user?.phone || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">{t('settings.location')}</dt><dd className="font-medium">{user?.location || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">{t('settings.role')}</dt><dd className="font-medium capitalize">{t(user?.role === 'admin' ? 'settings.adminRole' : 'settings.farmerRole')}</dd></div>
        </dl>
      </Card>

      {/* Account */}
      <Card>
        <h2 className="text-lg font-bold text-gray-800 mb-4">🔒 {t('settings.security')}</h2>
        <Button
          variant="danger"
          onClick={() => {
            logout()
            navigate('/welcome')
          }}
        >
          {t('auth.logout')}
        </Button>
        {user?.role === 'admin' && (
          <Button variant="secondary" className="ml-2" onClick={() => navigate('/admin')}>
            🛠️ {t('nav.admin')}
          </Button>
        )}
      </Card>

      <p className="text-center text-xs text-gray-400">{t('appName')} · v1.0</p>
    </div>
  )
}
