import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { alertsApi, getErrorMessage } from '../api'
import type { Alert } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import ListenButton from '../components/ListenButton'
import Spinner from '../components/Spinner'
import SeverityBadge from '../components/SeverityBadge'
import { AlertTriangleIcon, CheckCircleIcon } from '../components/Icons'
import { formatDate } from '../utils/format'
import { localizeAlert } from '../utils/localizeContent'

export default function AlertsPage() {
  const { t, i18n } = useTranslation()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await alertsApi.list()
      setAlerts(data)
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const markRead = async (id: number) => {
    try {
      await alertsApi.markRead(id)
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)))
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const markAllRead = async () => {
    try {
      await alertsApi.markAllRead()
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const unread = alerts.filter((a) => !a.is_read).length
  const sorted = [...alerts]
    .sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .map((a) => localizeAlert(a, t, i18n.language))

  const criticals = sorted.filter((a) => a.severity === 'critical')

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('alerts.title')}</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {t('alerts.subtitle')}{' '}
            {unread > 0 && <span className="font-bold text-farm-700">({unread} {t('alerts.unread')})</span>}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead} className="py-2 px-4 text-sm">
            {t('alerts.markAllRead')}
          </Button>
        )}
      </header>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {criticals.length > 0 ? (
        <div aria-live="assertive" role="status" className="sr-only">
          {criticals.map((a) => `${a.severity}. ${a.weather_condition}. ${a.recommended_action || ''}`).join('. ')}
        </div>
      ) : null}

      {loading ? (
        <Spinner size="lg" />
      ) : sorted.length === 0 ? (
        <Card className="text-center py-12">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircleIcon size={26} />
          </div>
          <p className="text-slate-600">{t('alerts.noAlerts')}</p>
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
            const iconColor =
              a.severity === 'critical'
                ? 'bg-rose-50 text-rose-600'
                : a.severity === 'warning'
                  ? 'bg-orange-50 text-orange-600'
                  : 'bg-amber-50 text-amber-600'
            return (
              <Card key={a.id} className={`border-l-4 ${border} ${a.is_read ? 'opacity-70' : ''}`}>
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 ${iconColor}`}>
                    <AlertTriangleIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {!a.is_read && <span className="h-2.5 w-2.5 rounded-full bg-farm-600 shrink-0" aria-label={t('alerts.unread')} />}
                        <h3 className="font-bold text-slate-900 text-base">{a.weather_condition}</h3>
                      </div>
                      <SeverityBadge severity={a.severity} size="sm" />
                    </div>
                    {a.message && <p className="text-slate-600 text-sm mt-1">{a.message}</p>}
                    {a.recommended_action && (
                      <div className="mt-2.5 bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-sm">
                        <span className="font-semibold text-slate-800">{t('alerts.suggestedAction')}: </span>
                        <span className="text-slate-600">{a.recommended_action}</span>
                      </div>
                    )}
                    <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span>{formatDate(a.created_at, t)}</span>
                      {a.field_name && <span>· {a.field_name}</span>}
                      {a.expected_timing && <span>· {t('alerts.expectedTiming')}: {a.expected_timing}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <ListenButton
                    text={`${a.weather_condition}. ${a.message ? a.message + '. ' : ''}${a.recommended_action || ''}`}
                    label={t('alerts.listen')}
                    className="px-3 py-1.5 text-xs"
                  />
                  {!a.is_read && (
                    <button onClick={() => markRead(a.id)} className="text-slate-500 text-xs font-semibold underline hover:text-slate-800">
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
