import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Button from '../components/Button'
import { getErrorMessage } from '../api'
import Spinner from '../components/Spinner'
import { BrandLogo } from '../components/Icons'

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
      let loggedInUser
      if (mode === 'login') {
        loggedInUser = await login(email, password)
      } else {
        loggedInUser = await register({ full_name: fullName, email, password, phone: phone || undefined, location: userLocation || undefined })
      }
      const target = from === '/' && loggedInUser.role === 'admin' ? '/admin' : from
      navigate(target, { replace: true })
    } catch (err) {
      const isDuplicate = getErrorMessage(err, '')?.toLowerCase().includes('already')
      if (isDuplicate) setError(t('auth.alreadyRegistered'))
      else setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setLoading(false)
    }
  }

  const quickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setMode('login')
    setEmail(demoEmail)
    setPassword(demoPass)
    setError('')
    setLoading(true)
    try {
      const u = await login(demoEmail, demoPass)
      const target = from === '/' && u.role === 'admin' ? '/admin' : from
      navigate(target, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <BrandLogo className="h-12 w-12 mb-3" />
        <h1 className="font-display text-2xl md:text-3xl font-extrabold">
          {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccountTitle')}
        </h1>
        <p className="text-emerald-200/80 text-sm mt-1 text-center">{t('tagline')}</p>

        <form onSubmit={submit} className="mt-7 w-full max-w-md bg-white text-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          {mode === 'register' && (
            <div>
              <label className="label" htmlFor="fullName">{t('auth.fullName')}</label>
              <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
            </div>
          )}

          <div>
            <label className="label" htmlFor="email">{t('auth.email')}</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div>
            <label className="label" htmlFor="password">{t('auth.password')}</label>
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
                <label className="label" htmlFor="phone">{t('auth.phone')}</label>
                <input id="phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="userLocation">{t('auth.location')}</label>
                <input id="userLocation" className="input" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} />
              </div>
            </>
          )}

          {error && (
            <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Spinner size="sm" /> : mode === 'login' ? t('auth.loginSubmit') : t('auth.registerSubmit')}
          </Button>

          {mode === 'login' && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-2">
                Quick Demo Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin('demo@farm.com', 'demo123')}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-farm-50 hover:border-farm-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Farmer Demo
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => quickDemoLogin('admin@farm.com', 'admin123')}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-farm-50 hover:border-farm-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Admin Demo
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-4 text-emerald-100 text-sm">
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <button onClick={(e) => switchMode(mode === 'login' ? 'register' : 'login', e)} className="underline font-bold">
            {mode === 'login' ? t('auth.registerLink') : t('auth.loginLink')}
          </button>
        </p>

        <p className="mt-5 text-xs text-emerald-200/75 text-center max-w-md">{t('auth.demoHint')}</p>
      </div>
    </div>
  )
}
