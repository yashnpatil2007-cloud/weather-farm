import { useTranslation } from 'react-i18next'
import type { WeatherSnapshot, Severity } from '../types'

export function weatherCodeToCondition(code: number | undefined | null): string {
  if (code === undefined || code === null) return 'unknown'
  if (code === 0) return 'clear'
  if (code === 1) return 'partly_cloudy'
  if (code === 2) return 'cloudy'
  if (code === 3) return 'overcast'
  if (code === 45 || code === 48) return 'fog'
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) return 'drizzle'
  if (code === 61 || code === 63 || code === 66 || code === 67) return 'rain'
  if (code === 65 || code === 80 || code === 81 || code === 82) return 'heavy_rain'
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunderstorm'
  return 'unknown'
}

export function useWeatherConditionLabel() {
  const { t } = useTranslation()
  const label = (snapshot?: WeatherSnapshot | null) => {
    if (!snapshot) return t('conditions.unknown')
    const key = weatherCodeToCondition(snapshot.current?.weather_code)
    return t(`conditions.${key}`)
  }
  const labelForCode = (code?: number | null) => t(`conditions.${weatherCodeToCondition(code)}`)
  return { label, labelForCode }
}

export const SEVERITY_ORDER: Severity[] = ['favorable', 'caution', 'warning', 'critical']

export function severityRank(s: Severity): number {
  return SEVERITY_ORDER.indexOf(s)
}

export function formatDate(iso: string, t: (key: string) => string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const monthName = t(`months.${d.getMonth() + 1}`)
  const day = d.getDate()
  return `${day} ${monthName}`
}

export function formatDayLong(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function acresToHa(acres: number): number {
  return acres * 0.404686
}

export function haToAcres(ha: number): number {
  return ha / 0.404686
}

export function round1(n: number | undefined | null): string {
  if (n === undefined || n === null) return '–'
  return String(Math.round(n * 10) / 10)
}
