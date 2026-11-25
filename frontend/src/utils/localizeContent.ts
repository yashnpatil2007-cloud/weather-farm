import type { TFunction } from 'i18next'
import type { Alert, Recommendation } from '../types'

function interpolate(template: string, vars: Record<string, string | number>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v))
  }
  return out
}

export function localizeCropName(name: string | undefined | null, t: TFunction): string {
  if (!name) return ''
  return t(`cropNames.${name}`, { defaultValue: name })
}

export function localizeStageName(name: string | undefined | null, t: TFunction): string {
  if (!name) return ''
  return t(`stageNames.${name}`, { defaultValue: name })
}

export function localizeTiming(timing: string | undefined | null, t: TFunction): string {
  if (!timing) return ''
  const keyMap: Record<string, string> = {
    'within the next 12 hours': 'timings.next12h',
    'next 12 hours': 'timings.next12h',
    today: 'timings.today',
    tomorrow: 'timings.tomorrow',
    'next few days': 'timings.nextFewDays',
    'next 24 hours': 'timings.next24h',
    'within 24 hours': 'timings.next24h',
    'within 48 hours': 'timings.within48h',
    'tonight / early morning': 'timings.tonightMorning',
  }
  const key = keyMap[timing.trim().toLowerCase()]
  return key ? t(key, { defaultValue: timing }) : timing
}

export function localizeRecommendation(rec: Recommendation, t: TFunction, lang: string): Recommendation {
  if (lang === 'en') return rec
  const code = rec.rule_code
  if (!code) return rec

  const baseKey = `rules.${code}`
  const titleTpl = t(`${baseKey}.title`, { defaultValue: '' })
  if (!titleTpl) return rec

  const factors = (rec.factors || {}) as Record<string, unknown>
  const vars: Record<string, string | number> = {
    temperature: factors.temperature !== undefined ? String(factors.temperature) : extractNum(rec.situation, /(-?\d+(?:\.\d+)?)\s*°?C/),
    humidity: factors.humidity !== undefined ? String(factors.humidity) : extractNum(rec.situation, /(\d+(?:\.\d+)?)\s*%/),
    rain_probability: factors.rain_probability !== undefined ? String(factors.rain_probability) : extractNum(rec.situation, /(\d+(?:\.\d+)?)\s*%/),
    expected_rainfall: factors.expected_rainfall !== undefined ? String(factors.expected_rainfall) : extractNum(rec.situation, /(\d+(?:\.\d+)?)\s*mm/),
    wind_speed: factors.wind_speed !== undefined ? String(factors.wind_speed) : extractNum(rec.situation, /(\d+(?:\.\d+)?)\s*km\/h/),
    crop_name: localizeCropName(
      typeof factors.crop_name === 'string' ? factors.crop_name : extractCropFromSituation(rec.situation),
      t,
    ) || t('common.cropFallback'),
  }

  const situationTpl = t(`${baseKey}.situation`, { defaultValue: rec.situation || '' })
  const impactTpl = t(`${baseKey}.impact`, { defaultValue: rec.impact || '' })
  const actionTpl = t(`${baseKey}.action`, { defaultValue: rec.action || '' })

  return {
    ...rec,
    title: interpolate(titleTpl, vars),
    situation: situationTpl ? interpolate(situationTpl, vars) : rec.situation,
    impact: impactTpl ? interpolate(impactTpl, vars) : rec.impact,
    action: actionTpl ? interpolate(actionTpl, vars) : rec.action,
  }
}

function extractNum(text: string | null | undefined, re: RegExp): string {
  if (!text) return '–'
  const m = text.match(re)
  return m ? m[1] : '–'
}

function extractCropFromSituation(text: string | null | undefined): string {
  if (!text) return ''
  const m = text.match(/for\s+([A-Za-z ]+)\.?$/)
  return m ? m[1].trim() : ''
}

export function localizeAlert(alert: Alert, t: TFunction, lang: string): Alert {
  if (lang === 'en') return alert

  const cond = alert.weather_condition || ''
  const msg = alert.message || ''
  const timing = localizeTiming(alert.expected_timing, t)

  // 1. Offline DEMO_ALERTS: "Upcoming Rainfall in 48h"
  if (/upcoming rainfall in 48h/i.test(cond)) {
    return {
      ...alert,
      weather_condition: t('alertMessages.upcomingRain48h.condition', { defaultValue: cond }),
      message: t('alertMessages.upcomingRain48h.message', { defaultValue: msg }),
      recommended_action: t('alertMessages.upcomingRain48h.action', { defaultValue: alert.recommended_action || '' }),
      expected_timing: timing,
    }
  }

  // 2. Rain probability is {X}%
  const rainProbMatch = cond.match(/rain probability is\s+(\d+(?:\.\d+)?)%/i)
  if (rainProbMatch) {
    const pct = rainProbMatch[1]
    return {
      ...alert,
      weather_condition: interpolate(t('rules.irr_postpone_rain.situation'), { rain_probability: pct }),
      message: t('rules.irr_postpone_rain.title'),
      recommended_action: t('rules.irr_postpone_rain.action'),
      expected_timing: timing,
    }
  }

  // 3. Expected rainfall is {X} mm / Heavy rainfall of {X} mm
  const heavyRainMatch = cond.match(/(?:expected rainfall is|heavy rainfall of)\s+(\d+(?:\.\d+)?)\s*mm/i)
  if (heavyRainMatch) {
    const mm = heavyRainMatch[1]
    return {
      ...alert,
      weather_condition: interpolate(t('rules.check_drainage.situation'), { expected_rainfall: mm }),
      message: t('rules.check_drainage.title'),
      recommended_action: /check your field conditions/i.test(alert.recommended_action || '')
        ? t('alertMessages.demoAction')
        : t('rules.check_drainage.action'),
      expected_timing: timing,
    }
  }

  // 4. Wind speed is {X} km/h
  const windMatch = cond.match(/wind speed is\s+(\d+(?:\.\d+)?)\s*km\/h/i)
  if (windMatch) {
    const kmh = windMatch[1]
    const isSpray = /safe limit for spraying/i.test(cond) || /postpone pesticide/i.test(alert.recommended_action || '')
    return {
      ...alert,
      weather_condition: interpolate(t(isSpray ? 'rules.pause_spraying.situation' : 'rules.wind_general.situation'), { wind_speed: kmh }),
      message: t(isSpray ? 'rules.pause_spraying.title' : 'rules.wind_general.title'),
      recommended_action: /check your field conditions/i.test(alert.recommended_action || '')
        ? t('alertMessages.demoAction')
        : t(isSpray ? 'rules.pause_spraying.action' : 'rules.wind_general.action'),
      expected_timing: timing,
    }
  }

  // 5. Frost risk temperature
  const frostMatch = cond.match(/temperature is\s+(-?\d+(?:\.\d+)?)°?C\s*[—-]\s*frost risk(?:\s+for\s+(.+?))?\.?$/i)
  if (frostMatch) {
    const temp = frostMatch[1]
    const crop = localizeCropName(frostMatch[2], t) || t('common.cropFallback')
    return {
      ...alert,
      weather_condition: interpolate(t('rules.frost_warning.situation'), { temperature: temp, crop_name: crop }),
      message: t('rules.frost_warning.title'),
      recommended_action: t('rules.frost_warning.action'),
      expected_timing: timing,
    }
  }

  // 6. Heat stress / Temperature is {X}°C
  const tempMatch = cond.match(/temperature is\s+(-?\d+(?:\.\d+)?)°?C/i)
  if (tempMatch) {
    const temp = tempMatch[1]
    const crop = localizeCropName(extractCropFromSituation(cond), t) || t('common.cropFallback')
    const isDemo = /demo weather alert/i.test(msg)
    return {
      ...alert,
      weather_condition: isDemo
        ? interpolate(t('alertMessages.demoTempCondition'), { temperature: temp })
        : interpolate(t('rules.heat_stress_warning.situation'), { temperature: temp, crop_name: crop }),
      message: isDemo ? t('alertMessages.demoTitle') : t('rules.heat_stress_warning.title'),
      recommended_action: /check your field conditions/i.test(alert.recommended_action || '')
        ? t('alertMessages.demoAction')
        : t('rules.heat_stress_warning.action'),
      expected_timing: timing,
    }
  }

  return {
    ...alert,
    expected_timing: timing,
  }
}
