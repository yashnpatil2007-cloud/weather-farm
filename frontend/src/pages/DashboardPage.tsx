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
import {
  WeatherGlyph,
  DropletIcon,
  RainIcon,
  WindIcon,
  MapPinIcon,
  SproutIcon,
  LightbulbIcon,
  CloudSunIcon,
  BellIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from '../components/Icons'
import { useWeatherConditionLabel, round1, parseLocalDate } from '../utils/format'
import { localizeAlert, localizeCropName, localizeRecommendation, localizeStageName } from '../utils/localizeContent'

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { selectedField, selectedFarm, loading: storeLoading } = useStore()
  const { label, labelForCode } = useWeatherConditionLabel()
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedWhy, setExpandedWhy] = useState<number | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const field = selectedField
  const farm = selectedFarm

  useEffect(() => {
    if (!field) return
    let active = true
    setLoading(true)
    setError('')
    recommendationsApi
      .generate(field.id)
      .then(async (r) => {
        if (!active) return
        setResult(r)
        if (r.weather) {
          setWeather(r.weather)
        } else {
          const w = await weatherApi.current(field.lat ?? farm?.lat ?? 0, field.lon ?? farm?.lon ?? 0, `${farm?.name || ''} / ${field.name}`)
          if (active) setWeather(w)
        }
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
  }, [field?.id, reloadTick])

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
        <Card className="text-center py-12 max-w-lg mx-auto">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-farm-50 text-farm-700 flex items-center justify-center">
            <SproutIcon size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.noField')}</h1>
          <p className="text-slate-500 mt-2 mb-6">{t('dashboard.setupCta')}</p>
          <Link to="/farm">
            <Button size="lg">{t('onboarding.title')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const localizedRecos = (result?.recommendations || []).map((r) => localizeRecommendation(r, t, i18n.language))
  const todayReco = localizedRecos[0]
  const cur = weather?.current
  const crop = field.crop

  // Live agronomic readiness checks computed from crop thresholds vs current weather
  const readiness = cur
    ? [
        {
          label: t('readiness.sprayingWindow'),
          ok: cur.wind_speed <= (crop?.wind_spray_limit ?? 20) && cur.rain_probability <= 60,
          detail: cur.wind_speed <= (crop?.wind_spray_limit ?? 20)
            ? `${round1(cur.wind_speed)} ≤ ${crop?.wind_spray_limit ?? 20} ${t('common.kmh')}`
            : `${round1(cur.wind_speed)} > ${crop?.wind_spray_limit ?? 20} ${t('common.kmh')}`,
        },
        {
          label: t('readiness.thermalStress'),
          ok: cur.temperature >= (crop?.frost_temp ?? 4) && cur.temperature <= (crop?.heat_stress_temp ?? 38),
          detail: `${round1(cur.temperature)}°C (${crop?.optimal_temp_min ?? 18}–${crop?.optimal_temp_max ?? 32}°C)`,
        },
        {
          label: t('readiness.diseaseRisk'),
          ok: cur.humidity <= (crop?.humidity_disease_threshold ?? 85),
          detail: cur.humidity <= (crop?.humidity_disease_threshold ?? 85)
            ? `${round1(cur.humidity)}% (OK)`
            : `${round1(cur.humidity)}% > ${crop?.humidity_disease_threshold ?? 85}%`,
        },
        {
          label: t('readiness.irrigationNeed'),
          ok: cur.rain_probability <= 70,
          detail: `${round1(cur.rain_probability)}%`,
        },
      ]
    : []

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-farm-700 font-semibold text-sm flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {t('dashboard.greeting')}, {user?.full_name?.split(' ')[0]}
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-0.5">{t('dashboard.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setReloadTick((x) => x + 1)} disabled={loading} className="border border-slate-200 bg-white">
            <RefreshIcon size={15} className={loading ? 'animate-spin' : ''} />
            <span>{t('common.refresh')}</span>
          </Button>
          <Link to="/history">
            <Button variant="secondary" size="sm" className="py-2 px-3.5 text-sm">+ Log Activity</Button>
          </Link>
        </div>
      </div>

      {/* Active Field Telemetry Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-2 font-bold text-slate-800">
            <SproutIcon size={17} className="text-farm-600" />
            {farm.name}
            <span className="text-slate-300 font-normal">·</span>
            <span className="text-slate-600 font-semibold">{field.name}</span>
          </span>
          {crop && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-farm-50 border border-farm-200 px-3 py-0.5 text-xs font-semibold text-farm-800">
              {localizeCropName(crop.name, t)}
              {field.growth_stage && <span className="text-farm-600 font-medium">· {localizeStageName(field.growth_stage.name, t)}</span>}
            </span>
          )}
          <span className="text-xs text-slate-500 font-medium">
            {(field.size_hectares / 0.404686).toFixed(1)} {t('farm.labelUnits')} · {t(`soilTypes.${field.soil_type}`)}
          </span>
        </div>
        <span className="text-xs text-slate-500 inline-flex items-center gap-1">
          <MapPinIcon size={14} className="text-slate-400" />
          {farm.location}
        </span>
      </div>

      {loading && !weather && (
        <div className="py-8"><Spinner size="lg" label={t('dashboard.loading')} /></div>
      )}

      {error && (
        <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Hero Weather Card */}
      {weather && cur && (
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white p-6 md:p-7 shadow-lg relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" aria-hidden="true" />
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-300/90">{t('dashboard.currentWeather')}</h2>
                <p className="text-xs text-slate-300/80 mt-0.5">{weather.location_label}</p>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/10">
                {weather.source === 'open-meteo' ? 'Live Open-Meteo' : weather.source === 'demo' ? 'Demo Scenario' : 'Offline Model'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 flex items-center gap-4">
                <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 shrink-0">
                  <WeatherGlyph code={cur.weather_code} size={56} />
                </div>
                <div>
                  <div className="text-5xl font-extrabold tabular-nums tracking-tight">
                    {round1(cur.temperature)}°C
                  </div>
                  <div className="text-emerald-100/90 font-medium mt-0.5">{label(weather)}</div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-200/80 mb-1">
                    <DropletIcon size={14} />
                    <span>{t('dashboard.humidityLabel')}</span>
                  </div>
                  <div className="text-xl font-bold tabular-nums">{round1(cur.humidity)}%</div>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-200/80 mb-1">
                    <RainIcon size={14} />
                    <span>{t('dashboard.rainProbLabel')}</span>
                  </div>
                  <div className="text-xl font-bold tabular-nums">{round1(cur.rain_probability)}%</div>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-200/80 mb-1">
                    <WindIcon size={14} />
                    <span>{t('dashboard.windLabel')}</span>
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {round1(cur.wind_speed)} <span className="text-xs font-normal text-slate-300">{t('common.kmh')}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3.5 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-200/80 mb-1">
                    <RainIcon size={14} />
                    <span>{t('dashboard.expectedRainLabel')}</span>
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {round1(cur.expected_rainfall)} <span className="text-xs font-normal text-slate-300">{t('common.mm')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Short-term Forecast Strip */}
            {weather.daily?.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80 mb-3">
                  {t('dashboard.forecast')}
                </div>
                <div className="grid grid-cols-5 gap-2 sm:gap-3" role="list">
                  {weather.daily.slice(0, 5).map((d, i) => {
                    const dayLabel =
                      i === 0 ? t('common.today') : parseLocalDate(d.date).toLocaleDateString(undefined, { weekday: 'short' })
                    return (
                      <div
                        key={d.date}
                        className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2 py-3 text-center hover:bg-white/15 transition-colors"
                        role="listitem"
                        title={labelForCode(d.weather_code)}
                      >
                        <span className="text-xs font-semibold text-emerald-100/90 truncate max-w-full">{dayLabel}</span>
                        <WeatherGlyph code={d.weather_code} size={28} />
                        <span className="text-sm font-bold tabular-nums">{round1(d.temp_max)}°</span>
                        <span className="text-[11px] text-sky-300 font-medium tabular-nums">{round1(d.rain_probability)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agronomic Readiness Indicators */}
      {readiness.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {readiness.map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border p-4 flex items-start gap-3 ${
                item.ok
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                {item.ok ? <CheckCircleIcon size={19} /> : <AlertTriangleIcon size={19} />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide opacity-75">{item.label}</div>
                <div className="text-sm font-semibold mt-0.5 truncate">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Today's Recommendations */}
      <Card className="border-l-4 border-l-farm-600">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-farm-50 text-farm-700">
              <LightbulbIcon size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('dashboard.todayRecommendation')}</h2>
          </div>
          {todayReco && <SeverityBadge severity={todayReco.severity} />}
        </div>

        {!result || localizedRecos.length === 0 ? (
          <div>
            {loading ? (
              <Spinner label={t('dashboard.loading')} />
            ) : (
              <p className="text-slate-600">{t('dashboard.noRecommendations')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {localizedRecos.map((r) => (
              <div key={r.id} className="border border-slate-200/80 bg-slate-50/50 rounded-xl p-4 hover:bg-white transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap min-w-0">
                  <div className="font-bold text-slate-900 text-base break-words">{r.title}</div>
                  <SeverityBadge severity={r.severity} size="sm" />
                </div>
                {r.action && <p className="mt-2 text-slate-700 text-sm leading-relaxed break-words">{r.action}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setExpandedWhy(expandedWhy === r.id ? null : r.id)}
                    className="text-farm-700 font-semibold text-xs uppercase tracking-wide hover:underline"
                    aria-expanded={expandedWhy === r.id}
                  >
                    {t('dashboard.why')}
                  </button>
                  <ListenButton
                    text={`${r.title}. ${r.action || ''}`}
                    variant="ghost"
                    label={t('common.listen')}
                    className="px-2.5 py-1 text-xs"
                  />
                </div>
                {expandedWhy === r.id && (
                  <div className="mt-3 bg-farm-50 border border-farm-200/70 rounded-xl p-3.5 text-sm text-farm-900 space-y-1.5" role="region" aria-label={t('advice.why')}>
                    {r.situation && <p><span className="font-semibold">Situation:</span> {r.situation}</p>}
                    {r.impact && <p><span className="font-semibold">Impact:</span> {r.impact}</p>}
                    {r.rule_code && <p className="text-slate-400 text-[11px] font-mono">Rule ID: {r.rule_code}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Important alerts preview */}
      {result && result.alerts.length > 0 && (
        <Card className="border-l-4 border-l-rose-500">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <BellIcon size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('dashboard.importantAlerts')}</h2>
          </div>
          <div className="space-y-2.5">
            {result.alerts.slice(0, 3).map((a) => {
              const locAlert = localizeAlert(
                { id: a.id, severity: a.severity as never, weather_condition: a.weather_condition, is_read: false, created_at: '' },
                t,
                i18n.language,
              )
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 bg-rose-50/70 border border-rose-200/70 rounded-xl px-4 py-3 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangleIcon size={16} className="text-rose-600 shrink-0" />
                    <span className="text-sm font-medium text-rose-900 break-words">{locAlert.weather_condition}</span>
                  </div>
                  <Link to="/alerts" className="text-xs font-bold text-farm-700 hover:underline shrink-0">
                    {t('dashboard.viewDetails')} →
                  </Link>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/advice" className="group rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center justify-between hover:border-farm-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <LightbulbIcon size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{t('advice.title')}</div>
              <div className="text-xs text-slate-500">Run live advice & weather stress scenarios</div>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-farm-700 font-bold">→</span>
        </Link>
        <Link to="/weather" className="group rounded-2xl bg-white border border-slate-200/80 p-4 flex items-center justify-between hover:border-farm-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <CloudSunIcon size={20} />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{t('weather.title')}</div>
              <div className="text-xs text-slate-500">Hourly charts, 7-day forecast & crop limits</div>
            </div>
          </div>
          <span className="text-slate-400 group-hover:text-farm-700 font-bold">→</span>
        </Link>
      </div>
    </div>
  )
}
