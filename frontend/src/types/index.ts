export interface User {
  id: number
  full_name: string
  email: string
  phone?: string | null
  location?: string | null
  preferred_language?: string
  role: 'farmer' | 'admin'
  is_active: boolean
  created_at: string | object
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Crop {
  id: number
  name: string
  category: string
  description?: string | null
  is_active: boolean
  optimal_temp_min: number
  optimal_temp_max: number
  heat_stress_temp: number
  frost_temp: number
  wind_spray_limit: number
  humidity_disease_threshold: number
}

export interface CropGrowthStage {
  id: number
  name: string
  description?: string | null
  sort_order: number
}

export interface Field {
  id: number
  farm_id: number
  name: string
  size_hectares: number
  soil_type: string
  lat?: number | null
  lon?: number | null
  crop?: Crop | null
  growth_stage?: CropGrowthStage | null
  created_at: string | object
}

export interface Farm {
  id: number
  user_id: number
  name: string
  location: string
  lat: number
  lon: number
  created_at: string | object
  fields: Field[]
}

export interface CurrentReading {
  temperature: number
  humidity: number
  rain_probability: number
  expected_rainfall: number
  precipitation: number
  wind_speed: number
  wind_direction: string
  weather_condition: string
  weather_code?: number | null
}

export interface HourlyPoint {
  time: string
  temperature: number
  humidity: number
  rain_probability: number
  precipitation: number
  wind_speed: number
}

export interface DailyPoint {
  date: string
  weather_condition: string
  weather_code?: number | null
  temp_max: number
  temp_min: number
  rain_probability: number
  precipitation: number
  wind_speed: number
}

export interface WeatherSnapshot {
  lat: number
  lon: number
  location_label: string
  source: string
  fetched_at: string
  current: CurrentReading
  hourly: HourlyPoint[]
  daily: DailyPoint[]
}

export type Severity = 'favorable' | 'caution' | 'warning' | 'critical'

export interface Recommendation {
  id: number
  field_id?: number | null
  field_name?: string | null
  severity: Severity
  category: string
  title: string
  situation?: string | null
  impact?: string | null
  action?: string | null
  rule_code?: string | null
  factors?: Record<string, unknown> | null
  created_at: string
}

export interface GenerateResponse {
  weather?: WeatherSnapshot | null
  recommendations: Recommendation[]
  alerts: { id: number; severity: string; weather_condition: string }[]
  rule_matches: number
}

export interface Alert {
  id: number
  field_id?: number | null
  field_name?: string | null
  severity: Severity
  weather_condition: string
  expected_timing?: string | null
  recommended_action?: string | null
  message?: string | null
  is_read: boolean
  created_at: string
}

export interface Activity {
  id: number
  field_id?: number | null
  field_name?: string | null
  crop_id?: number | null
  crop_name?: string | null
  activity_type: string
  activity_date: string
  activity_time: string
  amount?: number | null
  notes?: string | null
  created_at: string
}

export interface Rule {
  id: number
  code: string
  name: string
  description?: string | null
  category: string
  severity: Severity
  conditions: RuleCondition[]
  situation?: string | null
  impact?: string | null
  action?: string | null
  crop_name?: string | null
  is_alert: boolean
  is_default: boolean
  alert_timing?: string | null
  enabled: boolean
  created_at?: string | null
}

export interface RuleCondition {
  field: string
  op: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  value?: number | null
  value_path?: string | null
}
