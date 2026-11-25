import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { weatherApi } from '../api'
import type { WeatherSnapshot } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import { WeatherLineChart, WeatherBarChart, WeatherAreaChart } from '../components/WeatherChart'
import {
  WeatherGlyph,
  MapPinIcon,
  RefreshIcon,
  DropletIcon,
  RainIcon,
  WindIcon,
  ThermometerIcon,
  CloudSunIcon,
} from '../components/Icons'
import { useWeatherConditionLabel, round1, formatHourLabel, parseLocalDate } from '../utils/format'
import { localizeCropName } from '../utils/localizeContent'

export default function WeatherPage() {
  const { t } = useTranslation()
  const { selectedField, selectedFarm } = useStore()
  const { labelForCode } = useWeatherConditionLabel()
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const field = selectedField
  const farm = selectedFarm

  const load = useCallback(async () => {
    if (!field) return
    setLoading(true)
    setError('')
    try {
      const w = await weatherApi.current(
        field.lat ?? farm?.lat ?? 0,
        field.lon ?? farm?.lon ?? 0,
        `${farm?.name || ''} / ${field.name}`,
      )
      setWeather(w)
    } catch {
      setError(t('weather.unavailable'))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field?.id])

  useEffect(() => {
    load()
  }, [load])

  if (!field || !farm) {
    return (
      <Card className="text-center py-12">
        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
          <CloudSunIcon size={24} />
        </div>
        <p className="text-slate-600">{t('dashboard.noField')}</p>
      </Card>
    )
  }

  const hourlyData = (weather?.hourly || []).map((h) => ({
    ...h,
    timeLabel: formatHourLabel(h.time),
  }))

  const minAll = weather?.daily?.length ? Math.min(...weather.daily.map((d) => d.temp_min)) : 10
  const maxAll = weather?.daily?.length ? Math.max(...weather.daily.map((d) => d.temp_max)) : 40
  const span = Math.max(1, maxAll - minAll)
  const crop = field.crop
  const cur = weather?.current

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <header>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('weather.title')}</h1>
          <p className="text-slate-500 mt-1 inline-flex items-center gap-1.5 text-sm">
            <MapPinIcon size={15} className="text-farm-600" />
            {farm.location} · <span className="font-semibold text-slate-700">{field.name}</span>
          </p>
        </header>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading} className="py-2.5 px-4 text-sm">
          {loading ? <Spinner size="sm" /> : <><RefreshIcon size={15} />{t('weather.refresh')}</>}
        </Button>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {loading && !weather && <Spinner size="lg" />}

      {weather && cur && (
        <>
          {/* Current Weather Hero + KPI Grid */}
          <Card>
            <div className="flex items-center gap-5 flex-wrap pb-5 border-b border-slate-100">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                <WeatherGlyph code={cur.weather_code} size={56} />
              </div>
              <div>
                <div className="text-5xl font-extrabold text-slate-900 tabular-nums">{round1(cur.temperature)}°C</div>
                <div className="text-slate-500 font-medium mt-0.5">{labelForCode(cur.weather_code)}</div>
              </div>
              <div className="ml-auto text-right text-xs text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">{weather.location_label}</div>
                <span className="inline-block rounded-full bg-farm-50 text-farm-700 border border-farm-200 px-2.5 py-0.5 font-semibold">
                  {weather.source === 'demo' ? t('advice.scenario') : weather.source === 'mock' ? 'Simulated Offline' : 'Open-Meteo Live'}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1"><ThermometerIcon size={13} />{t('weather.temperature')}</div>
                <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">{round1(cur.temperature)}°C</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1"><DropletIcon size={13} />{t('weather.humidity')}</div>
                <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">{round1(cur.humidity)}%</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1"><RainIcon size={13} />{t('weather.rainProbability')}</div>
                <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">{round1(cur.rain_probability)}%</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1"><RainIcon size={13} />{t('weather.expectedRainfall')}</div>
                <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">{round1(cur.expected_rainfall)} {t('common.mm')}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1"><WindIcon size={13} />{t('weather.windSpeed')}</div>
                <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">{round1(cur.wind_speed)} {t('common.kmh')}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500">{t('weather.windDirection')}</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{cur.wind_direction}</div>
              </div>
            </div>
          </Card>

          {/* Crop Agronomic Threshold Comparison */}
          {crop && (
            <Card>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {localizeCropName(crop.name, t)} · {t('admin.thresholds')}
                </h2>
                <span className="text-xs text-slate-500">Live reading vs. agronomic limits</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="text-xs text-slate-500">Optimal Temperature</div>
                  <div className="font-bold text-slate-900 mt-0.5 tabular-nums">{crop.optimal_temp_min}°C – {crop.optimal_temp_max}°C</div>
                  <div className="text-xs mt-1 text-farm-700 font-medium">Now: {round1(cur.temperature)}°C</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="text-xs text-slate-500">Heat / Frost Limits</div>
                  <div className="font-bold text-slate-900 mt-0.5 tabular-nums">{crop.frost_temp}°C / {crop.heat_stress_temp}°C</div>
                  <div className="text-xs mt-1 text-slate-500">Frost min / Heat max</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="text-xs text-slate-500">Safe Spray Wind Limit</div>
                  <div className="font-bold text-slate-900 mt-0.5 tabular-nums">≤ {crop.wind_spray_limit} km/h</div>
                  <div className={`text-xs mt-1 font-medium ${cur.wind_speed > crop.wind_spray_limit ? 'text-amber-600' : 'text-farm-700'}`}>
                    Now: {round1(cur.wind_speed)} km/h
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <div className="text-xs text-slate-500">Fungal Disease Humidity</div>
                  <div className="font-bold text-slate-900 mt-0.5 tabular-nums">≥ {crop.humidity_disease_threshold}%</div>
                  <div className={`text-xs mt-1 font-medium ${cur.humidity > crop.humidity_disease_threshold ? 'text-amber-600' : 'text-farm-700'}`}>
                    Now: {round1(cur.humidity)}%
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 7-Day Forecast with Visual Range Bars */}
          {weather.daily?.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t('weather.forecast')}</h2>
              <div className="divide-y divide-slate-100">
                {weather.daily.map((d, i) => {
                  const leftPct = ((d.temp_min - minAll) / span) * 100
                  const widthPct = Math.max(8, ((d.temp_max - d.temp_min) / span) * 100)
                  return (
                    <div key={d.date} className="flex items-center gap-3 sm:gap-4 py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-16 text-sm font-semibold text-slate-700 shrink-0">
                        {i === 0 ? t('common.today') : parseLocalDate(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <WeatherGlyph code={d.weather_code} size={28} />
                      <div className="w-32 text-xs text-slate-500 hidden md:block truncate">{labelForCode(d.weather_code)}</div>
                      <div className="flex items-center gap-2.5 flex-1 min-w-[120px]">
                        <span className="text-xs font-semibold text-slate-500 w-9 text-right tabular-nums">{round1(d.temp_min)}°</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full relative overflow-hidden">
                          <div
                            className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-500"
                            style={{ left: `${leftPct}%`, width: `${Math.min(100 - leftPct, widthPct)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 w-9 tabular-nums">{round1(d.temp_max)}°</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full shrink-0 tabular-nums">
                        <RainIcon size={12} />
                        {round1(d.rain_probability)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Hourly Telemetry Charts */}
          <Card>
            <h2 className="text-lg font-bold text-slate-900 mb-4">{t('weather.charts.title')}</h2>
            {hourlyData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('weather.charts.temperature')} ({t('weather.charts.hourly')})
                  </h3>
                  <WeatherAreaChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="°"
                    series={[{ key: 'temperature', color: '#f97316', name: t('weather.temperature') }]}
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('weather.charts.rainProb')} ({t('weather.charts.hourly')})
                  </h3>
                  <WeatherBarChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="%"
                    bars={[{ key: 'rain_probability', fill: '#3b82f6', name: t('weather.rainProbability') }]}
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('weather.precipitation')} ({t('weather.charts.hourly')})
                  </h3>
                  <WeatherBarChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="mm"
                    bars={[{ key: 'precipitation', fill: '#0ea5e9', name: t('weather.precipitation') }]}
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('weather.charts.humidity')} ({t('weather.charts.hourly')})
                  </h3>
                  <WeatherLineChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="%"
                    lines={[{ key: 'humidity', color: '#8b5cf6', name: t('weather.humidity') }]}
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {t('weather.charts.wind')} ({t('weather.charts.hourly')})
                  </h3>
                  <WeatherBarChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="km/h"
                    bars={[{ key: 'wind_speed', fill: '#10b981', name: t('weather.windSpeed') }]}
                  />
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
