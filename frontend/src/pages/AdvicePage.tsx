import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { getErrorMessage, recommendationsApi } from '../api'
import type { GenerateResponse, Severity } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import SeverityBadge from '../components/SeverityBadge'
import ListenButton from '../components/ListenButton'
import {
  LightbulbIcon,
  RefreshIcon,
  SproutIcon,
  WeatherGlyph,
} from '../components/Icons'
import { severityRank, round1, useWeatherConditionLabel } from '../utils/format'
import { localizeCropName, localizeRecommendation, localizeStageName } from '../utils/localizeContent'

const DEMO_SCENARIOS = [
  { key: '1_high_rain', detail: '84% · 40 mm' },
  { key: '2_strong_wind', detail: '34 km/h' },
  { key: '3_extreme_heat', detail: '42°C' },
  { key: '4_low_rain_heat', detail: '36°C · 2 mm' },
  { key: '5_favorable', detail: '25°C' },
  { key: '6_frost', detail: '-1°C' },
]

export default function AdvicePage() {
  const { t, i18n } = useTranslation()
  const { label } = useWeatherConditionLabel()
  const { selectedField, selectedFarm } = useStore()
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const field = selectedField
  const farm = selectedFarm

  useEffect(() => {
    setResult(null)
    setActiveScenario(null)
    setError('')
    setExpanded(null)
  }, [field?.id])

  const generate = async (scenario?: string) => {
    if (!field) return
    setLoading(true)
    setError('')
    setActiveScenario(scenario || null)
    try {
      const r = scenario ? await recommendationsApi.simulate(field.id, scenario) : await recommendationsApi.generate(field.id)
      setResult(r)
      setExpanded(null)
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setLoading(false)
    }
  }

  if (!field || !farm) {
    return (
      <Card className="text-center py-12">
        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <LightbulbIcon size={24} />
        </div>
        <p className="text-slate-600">{t('dashboard.noField')}</p>
      </Card>
    )
  }

  const sortedRecos = [...(result?.recommendations || [])]
    .sort((a, b) => severityRank(b.severity as Severity) - severityRank(a.severity as Severity))
    .map((r) => localizeRecommendation(r, t, i18n.language))

  const speakAll = sortedRecos.map((r) => `${r.title}. ${r.action || ''}`).join(' ')

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('advice.title')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('advice.subtitle')}</p>
        </div>
        <Button onClick={() => generate()} disabled={loading} size="sm" className="py-2.5 px-4 text-sm">
          {loading && !activeScenario ? <Spinner size="sm" /> : <><RefreshIcon size={15} />{t('advice.generate')}</>}
        </Button>
      </header>

      {/* Active field context */}
      <Card className="py-3.5">
        <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
            <SproutIcon size={18} className="text-farm-600" />
            <span className="font-bold">{farm.name}</span>
            <span className="text-slate-300">·</span>
            <span>{field.name}</span>
            {field.crop && (
              <span className="rounded-full bg-farm-50 text-farm-800 border border-farm-200 px-2.5 py-0.5 text-xs font-semibold">
                {localizeCropName(field.crop.name, t)}{field.growth_stage ? ` · ${localizeStageName(field.growth_stage.name, t)}` : ''}
              </span>
            )}
          </div>
          {field.crop && (
            <div className="text-xs text-slate-500">
              Thresholds: Heat &gt;{field.crop.heat_stress_temp}°C · Frost &lt;{field.crop.frost_temp}°C · Wind &gt;{field.crop.wind_spray_limit} km/h
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Weather Stress Simulator */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('scenarios.simulatorTitle')}</h2>
            <p className="text-xs text-slate-500">{t('advice.scenarioHint')}</p>
          </div>
          {activeScenario && (
            <span className="badge bg-amber-100 text-amber-800 border border-amber-200">
              {t(`scenarios.${activeScenario}`)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {DEMO_SCENARIOS.map((s) => {
            const isSelected = activeScenario === s.key
            return (
              <button
                key={s.key}
                onClick={() => generate(s.key)}
                disabled={loading}
                className={`rounded-xl border p-3 text-left transition-all disabled:opacity-50 ${
                  isSelected
                    ? 'border-farm-600 bg-farm-50 ring-2 ring-farm-500/20'
                    : 'border-slate-200 hover:border-farm-400 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">{t(`scenarios.${s.key}`)}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{s.detail}</div>
              </button>
            )
          })}
        </div>
      </Card>

      {loading && !result && <Spinner size="lg" label={t('common.loading')} />}

      {/* Simulated/Live Weather Snapshot Banner */}
      {result?.weather?.current && (
        <div className="rounded-2xl bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WeatherGlyph code={result.weather.current.weather_code} size={36} />
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                {result.weather.source === 'demo' ? 'Simulated Input Snapshot' : 'Evaluated Weather Snapshot'}
              </div>
              <div className="text-sm font-bold">
                {round1(result.weather.current.temperature)}°C · {label(result.weather)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300 tabular-nums">
            <span>Humidity: <strong className="text-white">{round1(result.weather.current.humidity)}%</strong></span>
            <span>Rain prob: <strong className="text-white">{round1(result.weather.current.rain_probability)}%</strong></span>
            <span>Expected rain: <strong className="text-white">{round1(result.weather.current.expected_rainfall)} mm</strong></span>
            <span>Wind: <strong className="text-white">{round1(result.weather.current.wind_speed)} km/h</strong></span>
          </div>
        </div>
      )}

      {result && sortedRecos.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {t('advice.today')} <span className="text-sm font-normal text-slate-500">({sortedRecos.length})</span>
            </h2>
            <ListenButton text={speakAll} label={t('common.listen')} />
          </div>

          <div className="space-y-4">
            {sortedRecos.map((r) => (
              <Card
                key={r.id}
                className={`border-l-4 ${
                  r.severity === 'critical'
                    ? 'border-l-red-500'
                    : r.severity === 'warning'
                      ? 'border-l-orange-400'
                      : r.severity === 'caution'
                        ? 'border-l-yellow-400'
                        : 'border-l-green-500'
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{r.category}</span>
                    <h3 className="font-bold text-slate-900 text-lg">{r.title}</h3>
                  </div>
                  <SeverityBadge severity={r.severity as Severity} />
                </div>
                {r.action && <p className="mt-2 text-slate-700 text-sm leading-relaxed">{r.action}</p>}

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="text-farm-700 font-semibold text-xs uppercase tracking-wide hover:underline"
                    aria-expanded={expanded === r.id}
                  >
                    {t('advice.why')}
                  </button>
                  <ListenButton text={`${r.title}. ${r.action || ''} ${r.situation || ''}`} label={t('common.listen')} className="px-2.5 py-1 text-xs" />
                </div>

                {expanded === r.id && (
                  <div className="mt-3 bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 text-sm text-slate-700 space-y-1.5" role="region" aria-label={t('advice.why')}>
                    {r.situation && <p><span className="font-semibold text-slate-900">Situation:</span> {r.situation}</p>}
                    {r.impact && <p><span className="font-semibold text-slate-900">Impact:</span> {r.impact}</p>}
                    {r.rule_code && <p className="text-slate-400 text-[11px] font-mono">Rule: {r.rule_code}</p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {result && sortedRecos.length === 0 && (
        <Card>
          <p className="text-slate-600">{t('dashboard.noRecommendations')}</p>
        </Card>
      )}

      {!result && !loading && (
        <Card className="text-center py-10">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-farm-50 text-farm-700 flex items-center justify-center">
            <LightbulbIcon size={24} />
          </div>
          <p className="text-slate-500 text-sm">{t('advice.noAdvice')}</p>
        </Card>
      )}
    </div>
  )
}
