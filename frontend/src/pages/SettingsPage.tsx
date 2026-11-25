import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n'
import Card from '../components/Card'
import Button from '../components/Button'
import { ShieldIcon } from '../components/Icons'

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
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('settings.title')}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t('settings.subtitle')}</p>
      </header>

      {/* Language */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 mb-1">{t('settings.language')}</h2>
        <p className="text-sm text-slate-500 mb-4">{t('settings.languageSubtitle')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code as LanguageCode)}
              className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                language === lang.code ? 'border-farm-600 bg-farm-50 text-farm-800' : 'border-slate-200 hover:border-farm-300'
              }`}
              aria-pressed={language === lang.code}
            >
              <div className="font-bold">{lang.nativeName}</div>
              <div className="text-xs text-slate-400">{lang.name}</div>
            </button>
          ))}
        </div>
        {saved && (
          <p className="mt-3 text-sm text-farm-700 font-medium" role="status" aria-live="polite">{t('settings.saved')}</p>
        )}
      </Card>

      {/* Profile */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 mb-4">{t('settings.profile')}</h2>
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="py-2.5 flex justify-between"><dt className="text-slate-500">{t('settings.fullName')}</dt><dd className="font-semibold text-slate-900">{user?.full_name}</dd></div>
          <div className="py-2.5 flex justify-between"><dt className="text-slate-500">{t('settings.email')}</dt><dd className="font-semibold text-slate-900">{user?.email}</dd></div>
          <div className="py-2.5 flex justify-between"><dt className="text-slate-500">{t('settings.phone')}</dt><dd className="font-semibold text-slate-900">{user?.phone || '—'}</dd></div>
          <div className="py-2.5 flex justify-between"><dt className="text-slate-500">{t('settings.location')}</dt><dd className="font-semibold text-slate-900">{user?.location || '—'}</dd></div>
          <div className="py-2.5 flex justify-between"><dt className="text-slate-500">{t('settings.role')}</dt><dd className="font-semibold text-slate-900 capitalize">{t(user?.role === 'admin' ? 'settings.adminRole' : 'settings.farmerRole')}</dd></div>
        </dl>
      </Card>

      {/* Account */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 mb-4">{t('settings.security')}</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              logout()
              navigate('/welcome')
            }}
          >
            {t('auth.logout')}
          </Button>
          {user?.role === 'admin' && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin')}>
              <ShieldIcon size={16} /> {t('nav.admin')}
            </Button>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400">AgriPulse · {t('appName')} · v1.0</p>
    </div>
  )
}
