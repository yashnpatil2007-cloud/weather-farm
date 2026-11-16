import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { getErrorMessage } from '../api'
import Spinner from '../components/Spinner'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [userLocation, setUserLocation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from || '/'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError(t('errors.invalidEmail'))
      return
    }
    if (!password || password.length < 6) {
      setError(t('errors.passwordTooShort'))
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register({ full_name: fullName, email, password, phone: phone || undefined, location: userLocation || undefined })
      }
      navigate(from, { replace: true })
    } catch (err) {
      const isDuplicate = getErrorMessage(err, '')?.toLowerCase().includes('already')
      if (isDuplicate) setError(t('auth.alreadyRegistered'))
      else setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m: Mode, e: React.MouseEvent) => {
    e.preventDefault()
    setMode(m)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-farm-600 to-farm-800 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="text-5xl mb-3" aria-hidden="true">🌾</div>
        <h1 className="text-2xl font-bold">
          {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccountTitle')}
        </h1>
        <p className="text-farm-100 text-sm mt-1">{t('tagline')}</p>

        <form onSubmit={submit} className="mt-8 w-full max-w-md bg-white text-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">
                {t('auth.fullName')}
              </label>
              <input
                id="fullName"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                  {t('auth.phone')}
                </label>
                <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="userLocation">
                  {t('auth.location')}
                </label>
                <input
                  id="userLocation"
                  className="input"
                  value={userLocation}
                  onChange={(e) => setUserLocation(e.target.value)}
                />
              </div>
            </>
          )}

          {error && (
            <div role="alert" aria-live="assertive" className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Spinner size="sm" /> : mode === 'login' ? t('auth.loginSubmit') : t('auth.registerSubmit')}
          </Button>
        </form>

        <p className="mt-4 text-farm-100 text-sm">
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <button onClick={(e) => switchMode(mode === 'login' ? 'register' : 'login', e)} className="underline font-semibold">
            {mode === 'login' ? t('auth.registerLink') : t('auth.loginLink')}
          </button>
        </p>

        <p className="mt-6 text-xs text-farm-200 text-center max-w-md">{t('auth.demoHint')}</p>
      </div>
    </div>
  )
}
