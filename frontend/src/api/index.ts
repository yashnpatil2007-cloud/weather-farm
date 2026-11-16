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

const TOKEN_KEY = 'weatherfarm_token'

export const api = axios.create({
  baseURL: '/api',
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
  else localStorage.removeItem(TOKEN_KEY)
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
  return fallback
}

// Auth
export const authApi = {
  register: (data: { full_name: string; email: string; password: string; phone?: string; location?: string; preferred_language?: string }) =>
    api.post<TokenResponse>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) => api.post<TokenResponse>('/auth/login', data).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  updateLanguage: (preferred_language: string) =>
    api.patch<User>('/auth/me/language', { preferred_language }).then((r) => r.data),
}

// Crops & stages
export const cropsApi = {
  list: () => api.get<Crop[]>('/crops').then((r) => r.data),
  growthStages: () => api.get<CropGrowthStage[]>('/crops/growth-stages').then((r) => r.data),
}

// Farms & fields
export const farmsApi = {
  list: () => api.get<Farm[]>('/farms').then((r) => r.data),
  create: (data: { name: string; location: string; lat: number; lon: number; fields?: unknown[] }) =>
    api.post<Farm>('/farms', data).then((r) => r.data),
  update: (id: number, data: { name?: string; location?: string; lat?: number; lon?: number }) =>
    api.patch<Farm>(`/farms/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/farms/${id}`).then((r) => r.data),
  addField: (
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
    return api
      .post<Field>(`/farms/${farmId}/fields`, { ...data, size_hectares: acresToHa })
      .then((r) => r.data)
  },
  updateField: (
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
    return api.patch<Field>(`/fields/${id}`, payload).then((r) => r.data)
  },
  deleteField: (id: number) => api.delete(`/fields/${id}`).then((r) => r.data),
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
  geocode: (q: string) => api.get<GeocodeResult[]>(`/weather/geocode`, { params: { q } }).then((r) => r.data),
  current: (lat: number, lon: number, label?: string, scenario?: string) =>
    api.get<WeatherSnapshot>('/weather/current', { params: { lat, lon, label, scenario } }).then((r) => r.data),
}

// Recommendations
export const recommendationsApi = {
  generate: (fieldId: number) => api.post<GenerateResponse>(`/recommendations/generate/${fieldId}`).then((r) => r.data),
  simulate: (fieldId: number, scenario: string) =>
    api.post<GenerateResponse>(`/recommendations/simulate/${fieldId}`, null, { params: { scenario } }).then((r) => r.data),
  list: (fieldId?: number, limit = 30, days?: number) =>
    api.get<Recommendation[]>('/recommendations', {
      params: { field_id: fieldId, limit, ...(days !== undefined ? { days } : {}) },
    }).then((r) => r.data),
}

// Alerts
export const alertsApi = {
  list: (limit = 100) => api.get<Alert[]>('/alerts', { params: { limit } }).then((r) => r.data),
  unreadCount: () => api.get<{ count: number }>('/alerts/unread-count').then((r) => r.data.count),
  markRead: (id: number) => api.post<Alert>(`/alerts/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post<{ updated: number }>('/alerts/read-all').then((r) => r.data.updated),
}

// Activities
export const activitiesApi = {
  list: () => api.get<Activity[]>('/activities').then((r) => r.data),
  create: (data: Partial<ActivityCreateInput>) => api.post<Activity>('/activities', data).then((r) => r.data),
  update: (id: number, data: Partial<ActivityCreateInput>) => api.patch<Activity>(`/activities/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/activities/${id}`).then((r) => r.data),
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
  overview: (period = '30d') => api.get<Record<string, unknown>>('/analytics/overview', { params: { period } }).then((r) => r.data),
  weather: (period = '30d') => api.get<Record<string, unknown>[]>('/analytics/weather', { params: { period } }).then((r) => r.data),
  irrigation: (period = '30d') => api.get<Record<string, unknown>[]>('/analytics/irrigation', { params: { period } }).then((r) => r.data),
  alerts: (period = '30d') => api.get<Record<string, unknown>[]>('/analytics/alerts', { params: { period } }).then((r) => r.data),
}

// Admin
export const adminApi = {
  stats: () => api.get<Record<string, number>>('/admin/stats').then((r) => r.data),
  users: () => api.get<Record<string, unknown>[]>('/admin/users').then((r) => r.data),
  updateUser: (id: number, data: { is_active?: boolean; role?: string }) =>
    api.patch<Record<string, unknown>>(`/admin/users/${id}`, data).then((r) => r.data),
  farms: () => api.get<Record<string, unknown>[]>('/admin/farms').then((r) => r.data),
  crops: () => api.get<Crop[]>('/admin/crops').then((r) => r.data),
  createCrop: (data: Partial<Crop>) => api.post<Crop>('/admin/crops', data).then((r) => r.data),
  updateCrop: (id: number, data: Partial<Crop>) => api.patch<Crop>(`/admin/crops/${id}`, data).then((r) => r.data),
  deleteCrop: (id: number) => api.delete(`/admin/crops/${id}`).then((r) => r.data),
  rules: () => api.get<Rule[]>('/admin/rules').then((r) => r.data),
  createRule: (data: Partial<Rule>) => api.post<Rule>('/admin/rules', data).then((r) => r.data),
  updateRule: (id: number, data: Partial<Rule>) => api.patch<Rule>(`/admin/rules/${id}`, data).then((r) => r.data),
  deleteRule: (id: number) => api.delete(`/admin/rules/${id}`).then((r) => r.data),
}

export type SeverityOptions = Severity
