import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { alertsApi } from '../api'
import type { Alert, Severity } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import ListenButton from '../components/ListenButton'
import Spinner from '../components/Spinner'
import { formatDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'

export default function AlertsPage() {
  const { t } = useTranslation()
  const { language } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await alertsApi.list()
      setAlerts(data)
    } catch {
      setError(t('errors.server'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markRead = async (id: number) => {
    await alertsApi.markRead(id)
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)))
  }

  const markAllRead = async () => {
    await alertsApi.markAllRead()
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
  }

  const unread = alerts.filter((a) => !a.is_read).length
  const sorted = [...alerts].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Critical alert text for TTS / live region
  const criticals = sorted.filter((a) => a.severity === 'critical')

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('alerts.title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('alerts.subtitle')} {unread > 0 && <span className="font-semibold text-farm-700">({unread} {t('alerts.unread')})</span>}
          </p>
        </div>
        {unread > 0 && <Button variant="secondary" onClick={markAllRead}>{t('alerts.markAllRead')}</Button>}
      </header>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Live region for screen readers on critical alerts */}
      {criticals.length > 0 ? (
        <div aria-live="assertive" role="status" className="sr-only">
          {criticals.map((a) => `${a.severity}. ${a.weather_condition}. ${a.recommended_action || ''}`).join('. ')}
        </div>
      ) : null}

      {loading ? (
        <Spinner size="lg" />
      ) : sorted.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-5xl mb-3" aria-hidden="true">✅</div>
          <p className="text-gray-600">{t('alerts.noAlerts')}</p>
          {/* Replay hidden since no alerts; provided TTS "Listen" example with friendly message */}
          <div className="mt-4 flex justify-center">
            <ListenButton text={t('alerts.noAlerts')} label={t('alerts.replay')} />
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => {
            const border =
              a.severity === 'critical'
                ? 'border-l-red-500'
                : a.severity === 'warning'
                  ? 'border-l-orange-400'
                  : a.severity === 'caution'
                    ? 'border-l-yellow-400'
                    : 'border-l-green-500'
            return (
              <Card
                key={a.id}
                className={`border-l-4 ${border} ${a.is_read ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {!a.is_read && <span className="h-2.5 w-2.5 rounded-full bg-farm-600" aria-label={t('alerts.unread')} />}
                    <span className="text-3xl" aria-hidden="true">
                      {a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟠' : a.severity === 'caution' ? '🟡' : '🟢'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-base">{a.weather_condition}</h3>
                    {a.message && <p className="text-gray-600 text-sm mt-1">{a.message}</p>}
                    {a.recommended_action && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm">
                        <span className="font-semibold text-gray-700">{t('alerts.suggestedAction')}: </span>
                        <span className="text-gray-600">{a.recommended_action}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>{formatDate(a.created_at, t)}</span>
                      {a.field_name && <span>· {a.field_name}</span>}
                      {a.expected_timing && <span>· {t('alerts.expectedTiming')}: {a.expected_timing}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                  <ListenButton
                    text={`${a.weather_condition}. ${a.recommended_action || ''}`}
                    label={t('alerts.listen')}
                    className="px-3 py-1.5 text-sm"
                  />
                  {!a.is_read && (
                    <button onClick={() => markRead(a.id)} className="text-gray-500 text-sm underline hover:text-gray-700">
                      {t('alerts.markRead')}
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
