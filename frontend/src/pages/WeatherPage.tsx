import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { weatherApi } from '../api'
import type { WeatherSnapshot } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import { WeatherLineChart, WeatherBarChart, WeatherAreaChart } from '../components/WeatherChart'
import { weatherIcon } from '../utils/weatherIcon'
import { useWeatherConditionLabel, round1 } from '../utils/format'

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
        <div className="text-5xl mb-3" aria-hidden="true">🌦️</div>
        <p className="text-gray-600">{t('dashboard.noField')}</p>
      </Card>
    )
  }

  const hourlyData = (weather?.hourly || []).map((h) => ({
    ...h,
    timeLabel: new Date(h.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  }))

  const dailyData = (weather?.daily || []).map((d, i) => ({
    ...d,
    dayLabel: i === 0 ? t('common.today') : new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('weather.title')}</h1>
          <p className="text-gray-500 mt-1 inline-flex items-center gap-1">
            <span aria-hidden="true">📍</span> {farm.location} · {field.name}
          </p>
        </header>
        <Button variant="secondary" onClick={load} disabled={loading}>
          {loading ? <Spinner size="sm" /> : <><span aria-hidden="true">🔄</span>{t('weather.refresh')}</>}
        </Button>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading && !weather && <Spinner size="lg" />}

      {weather && (
        <>
          {/* Current */}
          <Card>
            <div className="flex items-center gap-5 flex-wrap">
              <span className="text-5xl" aria-hidden="true">{weatherIcon('', weather.current?.weather_code)}</span>
              <div>
                <div className="text-5xl font-bold">{round1(weather.current?.temperature)}°C</div>
                <div className="text-gray-500">{labelForCode(weather.current?.weather_code)}</div>
              </div>
              <div className="ml-auto text-right text-sm text-gray-500">
                <div>{t('weather.location')}: {weather.location_label}</div>
                <div>{weather.source === 'demo' ? t('advice.scenario') : 'Open-Meteo'}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-500">{t('weather.temperature')}</div>
                <div className="text-xl font-bold">{round1(weather.current?.temperature)}°C</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-500">{t('weather.humidity')}</div>
                <div className="text-xl font-bold">{round1(weather.current?.humidity)}%</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-500">{t('weather.rainProbability')}</div>
                <div className="text-xl font-bold">{round1(weather.current?.rain_probability)}%</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-500">{t('weather.expectedRainfall')}</div>
                <div className="text-xl font-bold">{round1(weather.current?.expected_rainfall)} {t('common.mm')}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-500">{t('weather.windSpeed')}</div>
                <div className="text-xl font-bold">{round1(weather.current?.wind_speed)} {t('common.kmh')}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-sm text-gray-500">{t('weather.windDirection')}</div>
                <div className="text-xl font-bold">{weather.current?.wind_direction}</div>
              </div>
            </div>
          </Card>

          {/* Forecast daily cards */}
          {weather.daily?.length > 0 && (
            <Card>
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('weather.forecast')}</h2>
              <div className="space-y-3">
                {weather.daily.map((d, i) => (
                  <div key={d.date} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50">
                    <div className="w-16 text-sm font-medium text-gray-600">
                      {i === 0 ? t('common.today') : new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <span className="text-2xl" aria-hidden="true">{weatherIcon('', d.weather_code)}</span>
                    <div className="flex-1 text-sm text-gray-500 hidden sm:block">{labelForCode(d.weather_code)}</div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-800 font-semibold">{round1(d.temp_min)}°</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-gray-800 font-semibold">{round1(d.temp_max)}°</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-farm-700 w-14">
                      <span aria-hidden="true">🌧️</span>{round1(d.rain_probability)}%
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Charts */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('weather.charts.title')}</h2>
            {hourlyData.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('weather.charts.temperature')} ({t('weather.charts.hourly')})</h3>
                  <WeatherLineChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="°"
                    lines={[{ key: 'temperature', color: '#f97316', name: t('weather.temperature') }]}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('weather.charts.rainProb')} ({t('weather.charts.hourly')})</h3>
                  <WeatherBarChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="%"
                    bars={[{ key: 'rain_probability', fill: '#3b82f6', name: t('weather.rainProbability') }]}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('weather.precipitation')} ({t('weather.charts.hourly')})</h3>
                  <WeatherBarChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="mm"
                    bars={[{ key: 'precipitation', fill: '#0ea5e9', name: t('weather.precipitation') }]}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('weather.charts.humidity')} ({t('weather.charts.hourly')})</h3>
                  <WeatherLineChart
                    data={hourlyData}
                    xKey="timeLabel"
                    yUnit="%"
                    lines={[{ key: 'humidity', color: '#8b5cf6', name: t('weather.humidity') }]}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('weather.charts.wind')} ({t('weather.charts.hourly')})</h3>
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
