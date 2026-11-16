import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { recommendationsApi, weatherApi } from '../api'
import type { WeatherSnapshot, GenerateResponse } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import SeverityBadge from '../components/SeverityBadge'
import ListenButton from '../components/ListenButton'
import { weatherIcon } from '../utils/weatherIcon'
import { useWeatherConditionLabel, round1 } from '../utils/format'

function Stat({ icon, value, unit, label, ariaLabel }: { icon: string; value: string; unit?: string; label: string; ariaLabel?: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0" role="group" aria-label={ariaLabel || label}>
      <span className="text-3xl shrink-0" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight break-words">
          {value}{unit && <span className="text-sm font-normal text-gray-500"> {unit}</span>}
        </div>
        <div className="text-xs text-gray-500 leading-snug">{label}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { selectedField, selectedFarm, loading: storeLoading } = useStore()
  const { label } = useWeatherConditionLabel()
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedWhy, setExpandedWhy] = useState<number | null>(null)

  const field = selectedField
  const farm = selectedFarm

  useEffect(() => {
    if (!field) return
    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      weatherApi.current(field.lat ?? farm?.lat ?? 0, field.lon ?? farm?.lon ?? 0, `${farm?.name || ''} / ${field.name}`),
      recommendationsApi.generate(field.id),
    ])
      .then(([w, r]) => {
        if (!active) return
        setWeather(w)
        setResult(r)
      })
      .catch(() => {
        if (active) setError(t('weather.unavailable'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field?.id])

  if (storeLoading) {
    return (
      <div className="py-10">
        <Spinner size="lg" label={t('dashboard.loading')} />
      </div>
    )
  }

  if (!field || !farm) {
    return (
      <div className="py-10">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4" aria-hidden="true">🌾</div>
          <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.noField')}</h1>
          <p className="text-gray-500 mt-2 mb-6">{t('dashboard.setupCta')}</p>
          <Link to="/farm">
            <Button size="lg">{t('onboarding.title')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const todayReco = result?.recommendations?.[0]

  return (
    <div className="space-y-6 w-full min-w-0">
      <header>
        <p className="text-farm-700 font-semibold break-words">{t('dashboard.greeting')}, {user?.full_name?.split(' ')[0]} 👋</p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">{t('dashboard.title')}</h1>
      </header>

      {/* Farm context */}
      <Card>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm min-w-0">
          <span className="inline-flex items-center gap-2 font-semibold text-gray-700 break-words">
            <span aria-hidden="true">🌾</span> {farm.name}
          </span>
          <span className="text-gray-500 break-words">{field.name}</span>
          {field.crop && (
            <span className="inline-flex items-center gap-1 text-farm-700 font-medium break-words">
              <span aria-hidden="true">🌱</span> {field.crop.name}
              {field.growth_stage && <span className="text-gray-500 break-words">· {field.growth_stage.name}</span>}
            </span>
          )}
          <span className="text-gray-400 inline-flex items-center gap-1 break-words">
            <span aria-hidden="true">📍</span> {farm.location}
          </span>
        </div>
      </Card>

      {loading && !weather && (
        <div className="py-8"><Spinner size="lg" label={t('dashboard.loading')} /></div>
      )}

      {error && (
        <div role="alert" aria-live="assertive" className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {weather && (
        <Card>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.currentWeather')}</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl" aria-hidden="true">{weatherIcon('', weather.current?.weather_code)}</span>
            <div>
              <div className="text-4xl font-bold">{round1(weather.current?.temperature)}°C</div>
              <div className="text-gray-500">{label({ current: weather.current } as WeatherSnapshot)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat icon="💧" value={round1(weather.current?.humidity)} unit="%" label={t('dashboard.humidityLabel')} ariaLabel={`${t('dashboard.humidityLabel')} ${round1(weather.current?.humidity)}%`} />
            <Stat icon="🌧️" value={round1(weather.current?.rain_probability)} unit="%" label={t('dashboard.rainProbLabel')} ariaLabel={`${t('dashboard.rainProbLabel')} ${round1(weather.current?.rain_probability)}%`} />
            <Stat icon="💨" value={round1(weather.current?.wind_speed)} unit={t('common.kmh')} label={t('dashboard.windLabel')} ariaLabel={`${t('dashboard.windLabel')} ${round1(weather.current?.wind_speed)} ${t('common.kmh')}`} />
            <Stat icon="🌊" value={round1(weather.current?.expected_rainfall)} unit={t('common.mm')} label={t('dashboard.expectedRainLabel')} ariaLabel={`${t('dashboard.expectedRainLabel')} ${round1(weather.current?.expected_rainfall)} ${t('common.mm')}`} />
          </div>

          {weather.daily?.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="text-sm font-semibold text-gray-600 mb-3">{t('dashboard.forecast')}</div>
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-1" role="list">
                {weather.daily.slice(0, 5).map((d, i) => {
                  const dayLabel =
                    i === 0 ? t('common.today') : new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })
                  return (
                    <div
                      key={d.date}
                      className="flex-1 min-w-[4rem] max-w-[6rem] flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-3 text-center"
                      role="listitem"
                    >
                      <span className="text-xs text-gray-500 truncate max-w-full" title={dayLabel}>{dayLabel}</span>
                      <span className="text-2xl" aria-hidden="true">{weatherIcon('', d.weather_code)}</span>
                      <span className="text-sm font-semibold whitespace-nowrap">{round1(d.temp_max)}°</span>
                      <span className="text-xs text-blue-600 whitespace-nowrap">🌧️ {round1(d.rain_probability)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Today's recommendation */}
      <Card className="border-l-4 border-l-farm-600">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-bold text-gray-800">{t('dashboard.todayRecommendation')}</h2>
          {todayReco && <SeverityBadge severity={todayReco.severity} />}
        </div>

        {!result || result.recommendations.length === 0 ? (
          <div>
            {loading ? (
              <Spinner label={t('dashboard.loading')} />
            ) : (
              <p className="text-gray-600">{t('dashboard.noRecommendations')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {result.recommendations.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap min-w-0">
                  <div className="font-semibold text-gray-800 text-lg break-words">{r.title}</div>
                </div>
                {r.action && <p className="mt-2 text-gray-700 break-words">{r.action}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setExpandedWhy(expandedWhy === r.id ? null : r.id)}
                    className="text-farm-700 font-medium text-sm underline"
                    aria-expanded={expandedWhy === r.id}
                  >
                    {t('dashboard.why')}
                  </button>
                  <ListenButton
                    text={`${r.title}. ${r.action || ''}`}
                    variant="ghost"
                    label={t('common.listen')}
                    className="px-2 py-1 text-sm"
                  />
                </div>
                {expandedWhy === r.id && (
                  <div className="mt-3 bg-farm-50 rounded-lg p-3 text-sm text-farm-800 space-y-1" role="region" aria-label={t('advice.why')}>
                    {r.situation && <p><strong>•</strong> {r.situation}</p>}
                    {r.impact && <p><strong>•</strong> {r.impact}</p>}
                    {r.rule_code && <p className="text-gray-400 text-xs">{r.rule_code}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Important alerts preview */}
      {result && result.alerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <h2 className="text-lg font-bold text-gray-800 mb-3">{t('dashboard.importantAlerts')}</h2>
          <div className="space-y-3">
            {result.alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span aria-hidden="true">🔔</span>
                  <span className="text-sm font-medium text-red-800 break-words">{a.weather_condition}</span>
                </div>
                <Link to="/alerts" className="text-sm text-farm-700 font-medium underline shrink-0">{t('advice.generate')}</Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3 justify-center">
        <Link to="/advice"><Button variant="secondary">💡 {t('advice.title')}</Button></Link>
        <Link to="/weather"><Button variant="secondary">🌦 {t('weather.title')}</Button></Link>
      </div>
    </div>
  )
}
