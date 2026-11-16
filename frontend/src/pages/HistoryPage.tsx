import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { analyticsApi, recommendationsApi } from '../api'
import type { Recommendation, Severity } from '../types'
import Card from '../components/Card'
import Spinner from '../components/Spinner'
import { WeatherLineChart, WeatherBarChart } from '../components/WeatherChart'
import SeverityBadge from '../components/SeverityBadge'
import { formatDate, severityRank } from '../utils/format'

type Period = '7d' | '30d' | '3m'

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '3m': 90 }
const EXPECTED_POINTS: Record<Period, number> = { '7d': 7, '30d': 30, '3m': 13 }

interface WeatherTrend {
  date: string
  avg_temp?: number | null
  avg_humidity?: number | null
  avg_rainfall?: number | null
  max_rain_prob?: number | null
}

interface AlertSummary {
  date: string
  severity: Severity
  count: number
}

export default function HistoryPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<Period>('30d')
  const [weather, setWeather] = useState<WeatherTrend[]>([])
  const [alerts, setAlerts] = useState<AlertSummary[]>([])
  const [recos, setRecos] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      analyticsApi.weather(period),
      analyticsApi.alerts(period),
      recommendationsApi.list(undefined, 100, PERIOD_DAYS[period]),
    ])
      .then(([w, a, r]) => {
        if (!active) return
        setWeather(w as unknown as WeatherTrend[])
        setAlerts(a as unknown as AlertSummary[])
        setRecos(r)
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [period])

  const chartData = weather.map((d) => ({
    ...d,
    dayLabel: new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    avg_temp: d.avg_temp ?? 0,
    avg_humidity: d.avg_humidity ?? 0,
    max_rain_prob: d.max_rain_prob ?? 0,
    avg_rainfall: d.avg_rainfall ?? 0,
  }))

  // Aggregate alerts by day+severity into separate series
  const alertChartData = alerts.reduce<Record<string, Record<string, number>>>((acc, a) => {
    const d = new Date(a.date).toISOString().split('T')[0]
    if (!acc[d]) acc[d] = {}
    acc[d][a.severity] = (acc[d][a.severity] || 0) + a.count
    return acc
  }, {})
  const alertChart = Object.entries(alertChartData).map(([date, sev]) => ({
    date,
    critical: sev.critical || 0,
    warning: sev.warning || 0,
    caution: sev.caution || 0,
  }))

  const sortedRecos = [...recos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('history.title')}</h1>
        <p className="text-gray-500 mt-1">{t('history.subtitle')}</p>
      </header>

      {/* Period selector */}
      <div className="flex gap-2" role="tablist" aria-label="period">
        {(['7d', '30d', '3m'] as Period[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`rounded-xl border-2 px-4 py-2 text-sm font-medium ${period === p ? 'border-farm-600 bg-farm-50 text-farm-700' : 'border-gray-200 text-gray-600'}`}
          >
            {t(`history.period.${p}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <>
          {/* Weather trends */}
          {chartData.length > 0 ? (
            <Card>
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('history.weatherTitle')}</h2>
              {chartData.length < EXPECTED_POINTS[period] && (
                <p className="mb-4 bg-farm-50 text-farm-800 border border-farm-200 rounded-xl px-4 py-3 text-sm">
                  {t('history.limitedData')}
                </p>
              )}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('history.temperature')}</h3>
                  <WeatherLineChart data={chartData} xKey="dayLabel" yUnit="°" lines={[{ key: 'avg_temp', color: '#f97316', name: t('history.temperature') }]} height={200} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('history.humidity')}</h3>
                  <WeatherLineChart data={chartData} xKey="dayLabel" yUnit="%" lines={[{ key: 'avg_humidity', color: '#8b5cf6', name: t('history.humidity') }]} height={200} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('history.rainfall')}</h3>
                  <WeatherBarChart data={chartData} xKey="dayLabel" yUnit="mm" bars={[{ key: 'avg_rainfall', fill: '#3b82f6', name: t('history.rainfall') }]} height={200} />
                </div>
              </div>
            </Card>
          ) : (
            <Card><p className="text-gray-500">{t('history.noWeather')}</p></Card>
          )}

          {/* Alerts over time */}
          {alertChart.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('history.alertsTitle')}</h2>
              <WeatherBarChart
                data={alertChart}
                xKey="date"
                bars={[
                  { key: 'caution', fill: '#eab308', name: t('alerts.severity.caution') },
                  { key: 'warning', fill: '#f97316', name: t('alerts.severity.warning') },
                  { key: 'critical', fill: '#dc2626', name: t('alerts.severity.critical') },
                ]}
                height={220}
              />
            </Card>
          )}

          {/* Recommendation history */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('history.recommendationTitle')}</h2>
            {sortedRecos.length === 0 ? (
              <p className="text-gray-500">{t('history.noRecommendations')}</p>
            ) : (
              <ul className="space-y-3">
                {sortedRecos.slice(0, 15).map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden="true">
                        {r.severity === 'critical' ? '🔴' : r.severity === 'warning' ? '🟠' : r.severity === 'caution' ? '🟡' : '🟢'}
                      </span>
                      <div>
                        <span className="text-gray-800 font-medium">{r.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SeverityBadge severity={r.severity as Severity} size="sm" />
                      <span className="text-xs text-gray-400">{formatDate(r.created_at, t)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
