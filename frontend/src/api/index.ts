import axios from 'axios'
import type {
  TokenResponse,
  User,
  Farm,
  Field,
  Crop,
  CropGrowthStage,
  WeatherSnapshot,
  Recommendation,
  GenerateResponse,
  Alert,
  Activity,
  Rule,
  Severity,
} from '../types'
import {
  DEMO_USERS,
  DEMO_CROPS,
  DEMO_STAGES,
  DEMO_FARMS,
  DEMO_WEATHER,
  DEMO_RECOMMENDATIONS,
  DEMO_ALERTS,
  DEMO_ACTIVITIES,
  DEMO_RULES,
} from './mockData'

const TOKEN_KEY = 'weatherfarm_token'
const DEMO_USER_KEY = 'weatherfarm_demo_user'
const DEMO_FARMS_KEY = 'weatherfarm_demo_farms'
const DEMO_ALERTS_KEY = 'weatherfarm_demo_alerts'
const DEMO_ACTIVITIES_KEY = 'weatherfarm_demo_activities'

export const api = axios.create({
  baseURL: (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(DEMO_USER_KEY)
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    return fallback
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function isRealBackendError(err: unknown): boolean {
  if (getToken()?.startsWith('demo-token-')) return false
  if (!axios.isAxiosError(err) || !err.response) return false
  const data = err.response.data
  return Boolean(data && typeof data === 'object' && 'detail' in data)
}

function shouldUseMockFallback(err: unknown): boolean {
  return !isRealBackendError(err)
}

// Local storage helpers for demo mode
function getSavedDemoUser(): User | null {
  const raw = localStorage.getItem(DEMO_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function getSavedFarms(): Farm[] {
  const raw = localStorage.getItem(DEMO_FARMS_KEY)
  if (!raw) {
    localStorage.setItem(DEMO_FARMS_KEY, JSON.stringify(DEMO_FARMS))
    return DEMO_FARMS
  }
  try {
    return JSON.parse(raw) as Farm[]
  } catch {
    return DEMO_FARMS
  }
}

function saveFarms(farms: Farm[]) {
  localStorage.setItem(DEMO_FARMS_KEY, JSON.stringify(farms))
}

function getSavedAlerts(): Alert[] {
  const raw = localStorage.getItem(DEMO_ALERTS_KEY)
  if (!raw) {
    localStorage.setItem(DEMO_ALERTS_KEY, JSON.stringify(DEMO_ALERTS))
    return DEMO_ALERTS
  }
  try {
    return JSON.parse(raw) as Alert[]
  } catch {
    return DEMO_ALERTS
  }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(DEMO_ALERTS_KEY, JSON.stringify(alerts))
}

function getSavedActivities(): Activity[] {
  const raw = localStorage.getItem(DEMO_ACTIVITIES_KEY)
  if (!raw) {
    localStorage.setItem(DEMO_ACTIVITIES_KEY, JSON.stringify(DEMO_ACTIVITIES))
    return DEMO_ACTIVITIES
  }
  try {
    return JSON.parse(raw) as Activity[]
  } catch {
    return DEMO_ACTIVITIES
  }
}

function saveActivities(acts: Activity[]) {
  localStorage.setItem(DEMO_ACTIVITIES_KEY, JSON.stringify(acts))
}

// Auth API with graceful mock fallback
export const authApi = {
  register: async (data: { full_name: string; email: string; password: string; phone?: string; location?: string; preferred_language?: string }) => {
    try {
      const res = await api.post<TokenResponse>('/auth/register', data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      // Mock fallback for offline / static deployments
      const newUser: User = {
        id: Math.floor(Math.random() * 9000) + 1000,
        full_name: data.full_name || 'Farmer',
        email: data.email,
        phone: data.phone || null,
        location: data.location || 'Local Farm',
        preferred_language: data.preferred_language || 'en',
        role: 'farmer',
        is_active: true,
        created_at: new Date().toISOString(),
      }
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(newUser))
      return {
        access_token: 'demo-token-' + Date.now(),
        token_type: 'bearer',
        user: newUser,
      }
    }
  },

  login: async (data: { email: string; password: string }) => {
    try {
      const res = await api.post<TokenResponse>('/auth/login', data)
      return res.data
    } catch (err) {
      if (isRealBackendError(err)) throw err
      const emailLower = data.email.trim().toLowerCase()
      const demoAccount = DEMO_USERS[emailLower]

      if (demoAccount && demoAccount.pass === data.password) {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoAccount.user))
        return {
          access_token: 'demo-token-' + Date.now(),
          token_type: 'bearer',
          user: demoAccount.user,
        }
      }

      // If credentials don't match known demo, rethrow real API error
      throw err
    }
  },

  me: async () => {
    try {
      const res = await api.get<User>('/auth/me')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const demoUser = getSavedDemoUser()
      if (demoUser) return demoUser
      throw err
    }
  },

  updateLanguage: async (preferred_language: string) => {
    try {
      const res = await api.patch<User>('/auth/me/language', { preferred_language })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const demoUser = getSavedDemoUser()
      if (demoUser) {
        demoUser.preferred_language = preferred_language
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser))
        return demoUser
      }
      throw new Error('Not logged in')
    }
  },
}

// Crops & stages
export const cropsApi = {
  list: async () => {
    try {
      const res = await api.get<Crop[]>('/crops')
      return res.data
    } catch {
      return DEMO_CROPS
    }
  },
  growthStages: async () => {
    try {
      const res = await api.get<CropGrowthStage[]>('/crops/growth-stages')
      return res.data
    } catch {
      return DEMO_STAGES
    }
  },
}

// Farms & fields
export const farmsApi = {
  list: async () => {
    try {
      const res = await api.get<Farm[]>('/farms')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return getSavedFarms()
    }
  },
  create: async (data: { name: string; location: string; lat: number; lon: number; fields?: unknown[] }) => {
    try {
      const res = await api.post<Farm>('/farms', data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const farms = getSavedFarms()
      const newFarm: Farm = {
        id: Date.now(),
        user_id: getSavedDemoUser()?.id || 2,
        name: data.name,
        location: data.location,
        lat: data.lat,
        lon: data.lon,
        created_at: new Date().toISOString(),
        fields: [],
      }
      farms.push(newFarm)
      saveFarms(farms)
      return newFarm
    }
  },
  update: async (id: number, data: { name?: string; location?: string; lat?: number; lon?: number }) => {
    try {
      const res = await api.patch<Farm>(`/farms/${id}`, data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const farms = getSavedFarms()
      const idx = farms.findIndex((f) => f.id === id)
      if (idx !== -1) {
        farms[idx] = { ...farms[idx], ...data }
        saveFarms(farms)
        return farms[idx]
      }
      throw new Error('Farm not found')
    }
  },
  delete: async (id: number) => {
    try {
      const res = await api.delete(`/farms/${id}`)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const farms = getSavedFarms().filter((f) => f.id !== id)
      saveFarms(farms)
      return { ok: true }
    }
  },
  addField: async (
    farmId: number,
    data: {
      name: string
      size_hectares: number
      soil_type: string
      lat?: number
      lon?: number
      crop_id?: number
      growth_stage_id?: number
    },
  ) => {
    const acresToHa = data.size_hectares * 0.404686
    try {
      const res = await api.post<Field>(`/farms/${farmId}/fields`, { ...data, size_hectares: acresToHa })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const farms = getSavedFarms()
      const farm = farms.find((f) => f.id === farmId)
      const crop = DEMO_CROPS.find((c) => c.id === data.crop_id) || null
      const growthStage = DEMO_STAGES.find((s) => s.id === data.growth_stage_id) || null
      const newField: Field = {
        id: Date.now(),
        farm_id: farmId,
        name: data.name,
        size_hectares: acresToHa,
        soil_type: data.soil_type,
        lat: data.lat ?? farm?.lat ?? 18.67,
        lon: data.lon ?? farm?.lon ?? 73.88,
        crop,
        growth_stage: growthStage,
        created_at: new Date().toISOString(),
      }
      if (farm) {
        farm.fields = farm.fields || []
        farm.fields.push(newField)
        saveFarms(farms)
      }
      return newField
    }
  },
  updateField: async (
    id: number,
    data: Partial<{
      name: string
      size_hectares: number
      soil_type: string
      lat: number
      lon: number
      crop_id: number
      growth_stage_id: number
    }>,
  ) => {
    const payload = { ...data }
    if (payload.size_hectares !== undefined) payload.size_hectares = payload.size_hectares * 0.404686
    try {
      const res = await api.patch<Field>(`/fields/${id}`, payload)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const farms = getSavedFarms()
      for (const farm of farms) {
        const fieldIdx = (farm.fields || []).findIndex((f) => f.id === id)
        if (fieldIdx !== -1) {
          const field = farm.fields[fieldIdx]
          const crop = data.crop_id ? DEMO_CROPS.find((c) => c.id === data.crop_id) || field.crop : field.crop
          const growthStage = data.growth_stage_id
            ? DEMO_STAGES.find((s) => s.id === data.growth_stage_id) || field.growth_stage
            : field.growth_stage
          farm.fields[fieldIdx] = { ...field, ...payload, crop, growth_stage: growthStage }
          saveFarms(farms)
          return farm.fields[fieldIdx]
        }
      }
      throw new Error('Field not found')
    }
  },
  deleteField: async (id: number) => {
    try {
      const res = await api.delete(`/fields/${id}`)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const farms = getSavedFarms()
      for (const farm of farms) {
        if (farm.fields) {
          farm.fields = farm.fields.filter((f) => f.id !== id)
        }
      }
      saveFarms(farms)
      return { ok: true }
    }
  },
}

// Weather
export interface GeocodeResult {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export const weatherApi = {
  geocode: async (q: string) => {
    try {
      const res = await api.get<GeocodeResult[]>(`/weather/geocode`, { params: { q } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return [
        { name: q, latitude: 18.6714, longitude: 73.889, country: 'India', admin1: 'Maharashtra' },
        { name: 'Pune', latitude: 18.5204, longitude: 73.8567, country: 'India', admin1: 'Maharashtra' },
        { name: 'Nagpur', latitude: 21.1458, longitude: 79.0882, country: 'India', admin1: 'Maharashtra' },
      ]
    }
  },
  current: async (lat: number, lon: number, label?: string, scenario?: string) => {
    try {
      const res = await api.get<WeatherSnapshot>('/weather/current', { params: { lat, lon, label, scenario } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return {
        ...DEMO_WEATHER,
        lat: lat || DEMO_WEATHER.lat,
        lon: lon || DEMO_WEATHER.lon,
        location_label: label || DEMO_WEATHER.location_label,
      }
    }
  },
}

// Recommendations
export const recommendationsApi = {
  generate: async (_fieldId: number): Promise<GenerateResponse> => {
    try {
      const res = await api.post<GenerateResponse>(`/recommendations/generate/${_fieldId}`)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return {
        weather: DEMO_WEATHER,
        recommendations: DEMO_RECOMMENDATIONS,
        alerts: DEMO_ALERTS.map((a) => ({ id: a.id, severity: a.severity, weather_condition: a.weather_condition })),
        rule_matches: DEMO_RECOMMENDATIONS.length,
      }
    }
  },
  simulate: async (_fieldId: number, scenario: string): Promise<GenerateResponse> => {
    try {
      const res = await api.post<GenerateResponse>(`/recommendations/simulate/${_fieldId}`, null, { params: { scenario } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const nowIso = new Date().toISOString()
      const scenarios: Record<string, { temp: number; hum: number; prob: number; rain: number; wind: number; cond: string; code: number; rec: Recommendation }> = {
        '1_high_rain': {
          temp: 26, hum: 82, prob: 84, rain: 40, wind: 12, cond: 'Moderate rain', code: 63,
          rec: { id: 901, field_id: _fieldId, severity: 'critical', category: 'drainage', title: 'Heavy rainfall — check drainage', situation: 'Expected rainfall is 40 mm within the next 12 hours.', impact: 'Excess water can waterlog the roots and damage the crop.', action: 'Check field drainage, clear blocked channels and do not irrigate.', rule_code: 'check_drainage', factors: { expected_rainfall: 40 }, created_at: nowIso },
        },
        '2_strong_wind': {
          temp: 22, hum: 60, prob: 20, rain: 2, wind: 34, cond: 'Windy', code: 2,
          rec: { id: 902, field_id: _fieldId, severity: 'warning', category: 'spraying', title: 'Windy — postpone pesticide spraying', situation: 'Wind speed is 34 km/h, above the safe limit for spraying.', impact: 'Spraying in wind drifts onto neighbouring areas and reduces effectiveness.', action: 'Postpone pesticide or foliar spraying until the wind drops below the safe limit.', rule_code: 'pause_spraying', factors: { wind_speed: 34 }, created_at: nowIso },
        },
        '3_extreme_heat': {
          temp: 42, hum: 35, prob: 5, rain: 0, wind: 10, cond: 'Clear sky', code: 0,
          rec: { id: 903, field_id: _fieldId, severity: 'critical', category: 'heat_stress', title: 'Heat stress — protect the crop', situation: 'Temperature is 42°C, above the heat-stress threshold for Tomato.', impact: 'High heat can scorch leaves, abort flowers and cut yields.', action: 'Provide shade or mulch, irrigate during the cooler hours, and check for wilting.', rule_code: 'heat_stress_warning', factors: { temperature: 42 }, created_at: nowIso },
        },
        '4_low_rain_heat': {
          temp: 36, hum: 40, prob: 10, rain: 2, wind: 8, cond: 'Mainly clear', code: 1,
          rec: { id: 904, field_id: _fieldId, severity: 'caution', category: 'irrigation', title: 'Dry and hot — keep watch on soil moisture', situation: 'Rainfall is low (2 mm) while temperature is 36°C.', impact: 'Soil moisture depletes quickly and the crop may face moisture stress.', action: 'Monitor soil moisture and plan irrigation if the soil is drying faster than normal.', rule_code: 'monitor_irrigation', factors: { expected_rainfall: 2, temperature: 36 }, created_at: nowIso },
        },
        '5_favorable': {
          temp: 25, hum: 60, prob: 20, rain: 4, wind: 10, cond: 'Partly cloudy', code: 2,
          rec: { id: 905, field_id: _fieldId, severity: 'favorable', category: 'general', title: 'Favorable conditions for planned work', situation: 'Current weather is mild and favourable for most farm work.', impact: 'No weather-related risk is currently detected for the crop.', action: 'Proceed with planned activities as scheduled, but always double-check the sky before you start.', rule_code: 'favorable_conditions', factors: { temperature: 25 }, created_at: nowIso },
        },
        '6_frost': {
          temp: -1, hum: 75, prob: 10, rain: 0, wind: 8, cond: 'Overcast', code: 3,
          rec: { id: 906, field_id: _fieldId, severity: 'warning', category: 'frost', title: 'Frost risk', situation: 'Temperature is -1°C — frost risk for the crop.', impact: 'Frost can damage young plants and flowers.', action: 'Delay sowing, cover sensitive plants, or use irrigation-based frost protection.', rule_code: 'frost_warning', factors: { temperature: -1 }, created_at: nowIso },
        },
      }
      const s = scenarios[scenario] || scenarios['5_favorable']
      return {
        weather: {
          ...DEMO_WEATHER,
          source: 'demo',
          current: {
            ...DEMO_WEATHER.current,
            temperature: s.temp,
            humidity: s.hum,
            rain_probability: s.prob,
            expected_rainfall: s.rain,
            wind_speed: s.wind,
            weather_condition: s.cond,
            weather_code: s.code,
          },
        },
        recommendations: [s.rec],
        alerts: s.rec.severity === 'warning' || s.rec.severity === 'critical'
          ? [{ id: s.rec.id, severity: s.rec.severity, weather_condition: s.rec.situation || s.rec.title }]
          : [],
        rule_matches: 1,
      }
    }
  },
  list: async (_fieldId?: number, _limit = 30, _days?: number) => {
    try {
      const res = await api.get<Recommendation[]>('/recommendations', {
        params: { field_id: _fieldId, limit: _limit, ...(_days !== undefined ? { days: _days } : {}) },
      })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return DEMO_RECOMMENDATIONS
    }
  },
}

// Alerts
export const alertsApi = {
  list: async (_limit = 100) => {
    try {
      const res = await api.get<Alert[]>('/alerts', { params: { limit: _limit } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return getSavedAlerts()
    }
  },
  unreadCount: async () => {
    try {
      const res = await api.get<{ count: number }>('/alerts/unread-count')
      return res.data.count
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return getSavedAlerts().filter((a) => !a.is_read).length
    }
  },
  markRead: async (id: number) => {
    try {
      const res = await api.post<Alert>(`/alerts/${id}/read`)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const alerts = getSavedAlerts()
      const alert = alerts.find((a) => a.id === id)
      if (alert) {
        alert.is_read = true
        saveAlerts(alerts)
        return alert
      }
      throw new Error('Alert not found')
    }
  },
  markAllRead: async () => {
    try {
      const res = await api.post<{ updated: number }>('/alerts/read-all')
      return res.data.updated
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const alerts = getSavedAlerts()
      alerts.forEach((a) => (a.is_read = true))
      saveAlerts(alerts)
      return alerts.length
    }
  },
}

// Activities
export const activitiesApi = {
  list: async () => {
    try {
      const res = await api.get<Activity[]>('/activities')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return getSavedActivities()
    }
  },
  create: async (data: Partial<ActivityCreateInput>) => {
    try {
      const res = await api.post<Activity>('/activities', data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const acts = getSavedActivities()
      const newAct: Activity = {
        id: Date.now(),
        field_id: data.field_id,
        crop_id: data.crop_id,
        activity_type: data.activity_type || 'General',
        activity_date: data.activity_date || new Date().toISOString().split('T')[0],
        activity_time: data.activity_time || '10:00',
        amount: data.amount,
        notes: data.notes,
        created_at: new Date().toISOString(),
      }
      acts.push(newAct)
      saveActivities(acts)
      return newAct
    }
  },
  update: async (id: number, data: Partial<ActivityCreateInput>) => {
    try {
      const res = await api.patch<Activity>(`/activities/${id}`, data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const acts = getSavedActivities()
      const idx = acts.findIndex((a) => a.id === id)
      if (idx !== -1) {
        acts[idx] = { ...acts[idx], ...data }
        saveActivities(acts)
        return acts[idx]
      }
      throw new Error('Activity not found')
    }
  },
  delete: async (id: number) => {
    try {
      const res = await api.delete(`/activities/${id}`)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const acts = getSavedActivities().filter((a) => a.id !== id)
      saveActivities(acts)
      return { ok: true }
    }
  },
}

export interface ActivityCreateInput {
  field_id?: number
  crop_id?: number
  activity_type: string
  activity_date?: string
  activity_time?: string
  amount?: number
  notes?: string
}

// Analytics
export const analyticsApi = {
  overview: async (period = '30d') => {
    try {
      const res = await api.get<Record<string, unknown>>('/analytics/overview', { params: { period } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return {
        recommendations_generated: DEMO_RECOMMENDATIONS.length,
        alerts_received: DEMO_ALERTS.length,
        unread_alerts: DEMO_ALERTS.filter((a) => !a.is_read).length,
        activities_recorded: DEMO_ACTIVITIES.length,
      }
    }
  },
  weather: async (period = '30d') => {
    try {
      const res = await api.get<Record<string, unknown>[]>('/analytics/weather', { params: { period } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return DEMO_WEATHER.daily.map((d) => ({
        date: d.date,
        avg_temp: Math.round(((d.temp_max + d.temp_min) / 2) * 10) / 10,
        avg_humidity: 58,
        avg_rainfall: d.precipitation,
        max_rain_prob: d.rain_probability,
      }))
    }
  },
  irrigation: async (period = '30d') => {
    try {
      const res = await api.get<Record<string, unknown>[]>('/analytics/irrigation', { params: { period } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return [
        { date: '2026-11-12', irrigations: 1 },
        { date: '2026-11-14', irrigations: 2 },
        { date: '2026-11-16', irrigations: 1 },
      ]
    }
  },
  alerts: async (period = '30d') => {
    try {
      const res = await api.get<Record<string, unknown>[]>('/analytics/alerts', { params: { period } })
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return DEMO_ALERTS.map((a) => ({
        date: a.created_at.slice(0, 10),
        severity: a.severity,
        count: 1,
      }))
    }
  },
}

// Admin
export const adminApi = {
  stats: async () => {
    try {
      const res = await api.get<Record<string, number>>('/admin/stats')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return {
        total_users: Object.keys(DEMO_USERS).length,
        active_users: Object.keys(DEMO_USERS).length,
        farms: DEMO_FARMS.length,
        fields: DEMO_FARMS.reduce((s, f) => s + f.fields.length, 0),
        crops: DEMO_CROPS.length,
        recommendations: DEMO_RECOMMENDATIONS.length,
        alerts: DEMO_ALERTS.length,
        rules: DEMO_RULES.length,
      }
    }
  },
  users: async () => {
    try {
      const res = await api.get<Record<string, unknown>[]>('/admin/users')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return Object.values(DEMO_USERS).map((d) => ({ ...d.user, farm_count: 1, field_count: 2 }))
    }
  },
  updateUser: async (id: number, data: { is_active?: boolean; role?: string }) => {
    try {
      const res = await api.patch<Record<string, unknown>>(`/admin/users/${id}`, data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return { id, ...data }
    }
  },
  farms: async () => {
    try {
      const res = await api.get<Record<string, unknown>[]>('/admin/farms')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return getSavedFarms()
    }
  },
  crops: async () => {
    try {
      const res = await api.get<Crop[]>('/admin/crops')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return DEMO_CROPS
    }
  },
  createCrop: async (data: Partial<Crop>) => {
    try {
      const res = await api.post<Crop>('/admin/crops', data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const newCrop: Crop = {
        id: Date.now(),
        name: data.name || 'New Crop',
        category: data.category || 'General',
        description: data.description || null,
        is_active: data.is_active ?? true,
        optimal_temp_min: data.optimal_temp_min ?? 15,
        optimal_temp_max: data.optimal_temp_max ?? 30,
        heat_stress_temp: data.heat_stress_temp ?? 38,
        frost_temp: data.frost_temp ?? 5,
        wind_spray_limit: data.wind_spray_limit ?? 20,
        humidity_disease_threshold: data.humidity_disease_threshold ?? 80,
      }
      return newCrop
    }
  },
  updateCrop: async (id: number, data: Partial<Crop>) => {
    try {
      const res = await api.patch<Crop>(`/admin/crops/${id}`, data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const crop = DEMO_CROPS.find((c) => c.id === id) || DEMO_CROPS[0]
      return { ...crop, ...data }
    }
  },
  deleteCrop: async (id: number) => {
    try {
      const res = await api.delete(`/admin/crops/${id}`)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return { ok: true }
    }
  },
  rules: async () => {
    try {
      const res = await api.get<Rule[]>('/admin/rules')
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return DEMO_RULES
    }
  },
  createRule: async (data: Partial<Rule>) => {
    try {
      const res = await api.post<Rule>('/admin/rules', data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const newRule: Rule = {
        id: Date.now(),
        code: data.code || 'custom_rule',
        name: data.name || 'Custom Rule',
        category: data.category || 'general',
        severity: data.severity || 'warning',
        conditions: data.conditions || [],
        is_alert: data.is_alert ?? true,
        is_default: false,
        enabled: true,
      }
      return newRule
    }
  },
  updateRule: async (id: number, data: Partial<Rule>) => {
    try {
      const res = await api.patch<Rule>(`/admin/rules/${id}`, data)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      const rule = DEMO_RULES.find((r) => r.id === id) || DEMO_RULES[0]
      return { ...rule, ...data }
    }
  },
  deleteRule: async (id: number) => {
    try {
      const res = await api.delete(`/admin/rules/${id}`)
      return res.data
    } catch (err) {
      if (!shouldUseMockFallback(err)) throw err
      return { ok: true }
    }
  },
}

export type SeverityOptions = Severity
