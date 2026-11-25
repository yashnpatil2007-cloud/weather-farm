import type {
  User,
  Crop,
  CropGrowthStage,
  Farm,
  Field,
  WeatherSnapshot,
  Recommendation,
  Alert,
  Activity,
  Rule,
} from '../types'

export const DEMO_CROPS: Crop[] = [
  { id: 1, name: 'Paddy Rice', category: 'Cereal', description: 'Staple cereal grown in flooded fields.', is_active: true, optimal_temp_min: 22, optimal_temp_max: 35, heat_stress_temp: 38, frost_temp: 10, wind_spray_limit: 20, humidity_disease_threshold: 85 },
  { id: 2, name: 'Maize', category: 'Cereal', description: 'Versatile cereal grown for grain and fodder.', is_active: true, optimal_temp_min: 18, optimal_temp_max: 32, heat_stress_temp: 38, frost_temp: 5, wind_spray_limit: 20, humidity_disease_threshold: 85 },
  { id: 3, name: 'Wheat', category: 'Cereal', description: 'Cool-season cereal grain.', is_active: true, optimal_temp_min: 15, optimal_temp_max: 27, heat_stress_temp: 35, frost_temp: 0, wind_spray_limit: 22, humidity_disease_threshold: 85 },
  { id: 4, name: 'Tomato', category: 'Vegetable', description: 'Warm-season fruit vegetable.', is_active: true, optimal_temp_min: 18, optimal_temp_max: 30, heat_stress_temp: 36, frost_temp: 10, wind_spray_limit: 18, humidity_disease_threshold: 80 },
  { id: 5, name: 'Potato', category: 'Root crop', description: 'Tuber crop grown in loose, well-drained soil.', is_active: true, optimal_temp_min: 15, optimal_temp_max: 26, heat_stress_temp: 32, frost_temp: 5, wind_spray_limit: 20, humidity_disease_threshold: 85 },
  { id: 6, name: 'Sugarcane', category: 'Cash crop', description: 'Tall perennial grass grown for sugar.', is_active: true, optimal_temp_min: 25, optimal_temp_max: 38, heat_stress_temp: 42, frost_temp: 0, wind_spray_limit: 25, humidity_disease_threshold: 85 },
  { id: 7, name: 'Soybean', category: 'Pulse', description: 'Legume grown for edible oil and protein.', is_active: true, optimal_temp_min: 20, optimal_temp_max: 32, heat_stress_temp: 38, frost_temp: 5, wind_spray_limit: 20, humidity_disease_threshold: 85 },
  { id: 8, name: 'Chili Pepper', category: 'Spice', description: 'Warm-season spice crop.', is_active: true, optimal_temp_min: 20, optimal_temp_max: 32, heat_stress_temp: 36, frost_temp: 10, wind_spray_limit: 18, humidity_disease_threshold: 75 },
  { id: 9, name: 'Onion', category: 'Vegetable', description: 'Bulb crop for long, cool growth periods.', is_active: true, optimal_temp_min: 15, optimal_temp_max: 28, heat_stress_temp: 35, frost_temp: 5, wind_spray_limit: 25, humidity_disease_threshold: 80 },
]

export const DEMO_STAGES: CropGrowthStage[] = [
  { id: 1, name: 'Germination', description: 'Seedlings are just emerging.', sort_order: 1 },
  { id: 2, name: 'Seedling', description: 'Young plants establishing after emergence.', sort_order: 2 },
  { id: 3, name: 'Vegetative growth', description: 'Plants growing leaves and stems.', sort_order: 3 },
  { id: 4, name: 'Flowering', description: 'Plants in bloom; pollination period.', sort_order: 4 },
  { id: 5, name: 'Fruiting / grain filling', description: 'Yields are forming and filling.', sort_order: 5 },
  { id: 6, name: 'Maturity', description: 'Crops close to harvest readiness.', sort_order: 6 },
  { id: 7, name: 'Harvesting', description: 'Crops are harvested.', sort_order: 7 },
  { id: 8, name: 'Fallow', description: 'Land resting between crop cycles.', sort_order: 8 },
]

export const DEMO_USERS: Record<string, { user: User; pass: string }> = {
  'admin@farm.com': {
    pass: 'admin123',
    user: {
      id: 1,
      full_name: 'System Administrator',
      email: 'admin@farm.com',
      phone: '+91 98765 43210',
      location: 'Agricultural Tech Command Center',
      preferred_language: 'en',
      role: 'admin',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
  },
  'demo@farm.com': {
    pass: 'demo123',
    user: {
      id: 2,
      full_name: 'Demo Farmer',
      email: 'demo@farm.com',
      phone: '+91 98765 12345',
      location: 'Central Agricultural Valley',
      preferred_language: 'en',
      role: 'farmer',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
  },
}

export const DEMO_FIELDS: Field[] = [
  {
    id: 1,
    farm_id: 1,
    name: 'North Tomato Plot',
    size_hectares: 2.5,
    soil_type: 'Loam',
    lat: 18.6714,
    lon: 73.889,
    crop: DEMO_CROPS[3], // Tomato
    growth_stage: DEMO_STAGES[3], // Flowering
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    farm_id: 1,
    name: 'East Wheat Parcel',
    size_hectares: 4.0,
    soil_type: 'Clay Loam',
    lat: 18.673,
    lon: 73.891,
    crop: DEMO_CROPS[2], // Wheat
    growth_stage: DEMO_STAGES[2], // Vegetative growth
    created_at: '2026-01-01T00:00:00.000Z',
  },
]

export const DEMO_FARMS: Farm[] = [
  {
    id: 1,
    user_id: 2,
    name: 'Green Valley Sunrise Farm',
    location: 'Pune / Alandi District, Maharashtra',
    lat: 18.6714,
    lon: 73.889,
    created_at: '2026-01-01T00:00:00.000Z',
    fields: DEMO_FIELDS,
  },
]

function isoHour(offsetHours: number): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + offsetHours)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`
}

function isoDay(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const DEMO_WEATHER: WeatherSnapshot = {
  lat: 18.6714,
  lon: 73.889,
  location_label: 'Green Valley Sunrise Farm',
  source: 'Open-Meteo Live Forecast Engine',
  fetched_at: new Date().toISOString(),
  current: {
    temperature: 28.5,
    humidity: 54,
    rain_probability: 15,
    expected_rainfall: 0,
    precipitation: 0,
    wind_speed: 11.2,
    wind_direction: 'NW',
    weather_condition: 'Partly Cloudy',
    weather_code: 2,
  },
  hourly: Array.from({ length: 24 }).map((_, i) => ({
    time: isoHour(i),
    temperature: Math.round(22 + 8 * Math.sin((i / 24) * Math.PI)),
    humidity: Math.round(60 - 20 * Math.sin((i / 24) * Math.PI)),
    rain_probability: i >= 14 && i <= 17 ? 25 : 10,
    precipitation: 0,
    wind_speed: 10 + (i % 5),
  })),
  daily: [
    { date: isoDay(0), weather_condition: 'Sunny', weather_code: 1, temp_max: 30, temp_min: 19, rain_probability: 10, precipitation: 0, wind_speed: 12 },
    { date: isoDay(1), weather_condition: 'Partly Cloudy', weather_code: 2, temp_max: 29, temp_min: 18, rain_probability: 15, precipitation: 0, wind_speed: 11 },
    { date: isoDay(2), weather_condition: 'Light Rain', weather_code: 61, temp_max: 27, temp_min: 19, rain_probability: 65, precipitation: 4.2, wind_speed: 16 },
    { date: isoDay(3), weather_condition: 'Overcast', weather_code: 3, temp_max: 28, temp_min: 18, rain_probability: 30, precipitation: 0.5, wind_speed: 14 },
    { date: isoDay(4), weather_condition: 'Clear Sky', weather_code: 0, temp_max: 31, temp_min: 17, rain_probability: 5, precipitation: 0, wind_speed: 10 },
  ],
}

export const DEMO_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 101,
    field_id: 1,
    field_name: 'North Tomato Plot',
    severity: 'favorable',
    category: 'irrigation',
    title: 'Optimal Irrigation Window Today',
    situation: 'Moderate temperature (28.5°C) and low rain probability (15%) today.',
    impact: 'Soil moisture uptake is high during flowering stage. Drip irrigation will maximize fruit set.',
    action: 'Apply normal irrigation schedule in early morning or late afternoon.',
    rule_code: 'irr_normal_flowering',
    created_at: new Date().toISOString(),
  },
  {
    id: 102,
    field_id: 2,
    field_name: 'East Wheat Parcel',
    severity: 'favorable',
    category: 'spraying',
    title: 'Safe Spraying Conditions',
    situation: 'Wind speed is 11.2 km/h, well below the 22 km/h drift limit.',
    impact: 'Foliar nutrition or protective sprays will deposit uniformly without chemical drift.',
    action: 'Proceed with planned micronutrient or protection spraying if needed before midday.',
    rule_code: 'spray_calm_wind',
    created_at: new Date().toISOString(),
  },
  {
    id: 103,
    field_id: 1,
    field_name: 'North Tomato Plot',
    severity: 'caution',
    category: 'drainage',
    title: 'Rain Expected in 48 Hours',
    situation: '65% rain probability forecasted for Day 3.',
    impact: 'Excess standing water can induce root rot in flowering tomato plants.',
    action: 'Inspect field ridges and drainage furrows to ensure smooth runoff.',
    rule_code: 'rain_prep_48h',
    created_at: new Date().toISOString(),
  },
]

export const DEMO_ALERTS: Alert[] = [
  {
    id: 201,
    field_id: 1,
    field_name: 'North Tomato Plot',
    severity: 'caution',
    weather_condition: 'Upcoming Rainfall in 48h',
    expected_timing: 'Within 48 hours',
    recommended_action: 'Check drainage channels and avoid heavy chemical spraying before rain.',
    message: 'Rainfall expected in 48 hours. Ensure furrows are clean to prevent waterlogging.',
    is_read: false,
    created_at: new Date().toISOString(),
  },
]

export const DEMO_ACTIVITIES: Activity[] = [
  {
    id: 301,
    field_id: 1,
    field_name: 'North Tomato Plot',
    crop_id: 4,
    crop_name: 'Tomato',
    activity_type: 'Irrigation',
    activity_date: new Date().toISOString().split('T')[0],
    activity_time: '07:30',
    amount: 1500,
    notes: 'Morning drip cycle completed.',
    created_at: new Date().toISOString(),
  },
  {
    id: 302,
    field_id: 2,
    field_name: 'East Wheat Parcel',
    crop_id: 3,
    crop_name: 'Wheat',
    activity_type: 'Fertilizer Application',
    activity_date: new Date().toISOString().split('T')[0],
    activity_time: '09:00',
    amount: 50,
    notes: 'Applied urea top dressing.',
    created_at: new Date().toISOString(),
  },
]

export const DEMO_RULES: Rule[] = [
  {
    id: 1,
    code: 'irr_postpone_rain',
    name: 'Postpone irrigation — rain expected',
    description: 'Rain probability above 70%: delay irrigation.',
    category: 'irrigation',
    severity: 'warning',
    conditions: [{ field: 'rain_probability', op: 'gt', value: 70 }],
    situation: 'Rain probability is {rain_probability}%.',
    impact: 'Heavy rainfall is likely within the next 12 hours.',
    action: 'Postpone irrigation to avoid unnecessary water use.',
    is_alert: true,
    is_default: false,
    enabled: true,
  },
]

function pastIsoDay(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function mondayOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Deterministic 90-day historical weather series so 7d, 30d, and 3m analytics work in demo mode
const DEMO_90_DAYS = Array.from({ length: 90 }).map((_, idx) => {
  const daysAgo = 89 - idx
  const date = pastIsoDay(daysAgo)
  const seasonal = 23 + 4.5 * Math.sin((idx / 90) * Math.PI)
  const wave = Math.sin(idx * 0.7) * 2.1 + Math.cos(idx * 0.35) * 1.4
  const avg_temp = Math.round((seasonal + wave) * 10) / 10
  const avg_humidity = Math.round(Math.min(92, Math.max(38, 62 - wave * 4 + Math.sin(idx * 0.4) * 10)) * 10) / 10
  const wetSpike = idx % 7 === 2 || idx % 11 === 5
  const avg_rainfall = wetSpike ? Math.round((4.5 + (idx % 5) * 3.2) * 10) / 10 : Math.round(((idx % 3) * 0.4) * 10) / 10
  const max_rain_prob = wetSpike ? Math.min(95, 65 + (idx % 4) * 7) : 10 + (idx % 5) * 5
  return { date, avg_temp, avg_humidity, avg_rainfall, max_rain_prob }
})

export function getDemoWeatherTrends(period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const slice = DEMO_90_DAYS.slice(-days)
  if (period !== '3m') return slice

  // Aggregate into ISO-week buckets just like backend analytics_service._aggregate_weekly
  const buckets: Array<{ date: string; temps: number[]; hums: number[]; rains: number[]; probs: number[] }> = []
  for (const row of slice) {
    const weekStart = mondayOfWeek(row.date)
    let b = buckets[buckets.length - 1]
    if (!b || b.date !== weekStart) {
      b = { date: weekStart, temps: [], hums: [], rains: [], probs: [] }
      buckets.push(b)
    }
    b.temps.push(row.avg_temp)
    b.hums.push(row.avg_humidity)
    b.rains.push(row.avg_rainfall)
    b.probs.push(row.max_rain_prob)
  }
  return buckets.map((b) => ({
    date: b.date,
    avg_temp: Math.round((b.temps.reduce((s, v) => s + v, 0) / b.temps.length) * 10) / 10,
    avg_humidity: Math.round((b.hums.reduce((s, v) => s + v, 0) / b.hums.length) * 10) / 10,
    avg_rainfall: Math.round((b.rains.reduce((s, v) => s + v, 0) / b.rains.length) * 10) / 10,
    max_rain_prob: Math.max(...b.probs),
  }))
}

export function getDemoIrrigationHistory(period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const out: Array<{ date: string; irrigations: number }> = []
  for (let d = days - 1; d >= 0; d -= 4) {
    out.push({ date: pastIsoDay(d), irrigations: d % 8 === 0 ? 2 : 1 })
  }
  return out
}

const DEMO_HISTORICAL_ALERTS: Array<{ daysAgo: number; severity: 'caution' | 'warning' | 'critical'; count: number }> = [
  { daysAgo: 2, severity: 'caution', count: 1 },
  { daysAgo: 5, severity: 'warning', count: 1 },
  { daysAgo: 12, severity: 'caution', count: 2 },
  { daysAgo: 19, severity: 'critical', count: 1 },
  { daysAgo: 26, severity: 'warning', count: 1 },
  { daysAgo: 38, severity: 'caution', count: 2 },
  { daysAgo: 51, severity: 'warning', count: 1 },
  { daysAgo: 64, severity: 'critical', count: 1 },
  { daysAgo: 78, severity: 'caution', count: 1 },
]

export function getDemoAlertHistory(period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  return DEMO_HISTORICAL_ALERTS
    .filter((a) => a.daysAgo <= days)
    .map((a) => ({ date: pastIsoDay(a.daysAgo), severity: a.severity, count: a.count }))
}

export function getDemoRecommendationsHistory(days?: number): Recommendation[] {
  const extra: Recommendation[] = [
    { id: 104, field_id: 1, field_name: 'North Tomato Plot', severity: 'warning', category: 'irrigation', title: 'Postpone irrigation — rain expected', situation: 'Rain probability is 78%.', impact: 'Heavy rainfall is likely within the next 12 hours.', action: 'Postpone irrigation to avoid unnecessary water use and potential waterlogging.', rule_code: 'irr_postpone_rain', factors: { rain_probability: 78 }, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 105, field_id: 2, field_name: 'East Wheat Parcel', severity: 'warning', category: 'spraying', title: 'Windy — postpone pesticide spraying', situation: 'Wind speed is 28 km/h, above the safe limit for spraying.', impact: 'Spraying in wind drifts onto neighbouring areas and reduces effectiveness.', action: 'Postpone pesticide or foliar spraying until the wind drops below the safe limit.', rule_code: 'pause_spraying', factors: { wind_speed: 28 }, created_at: new Date(Date.now() - 11 * 86400000).toISOString() },
    { id: 106, field_id: 1, field_name: 'North Tomato Plot', severity: 'critical', category: 'heat_stress', title: 'Heat stress — protect the crop', situation: 'Temperature is 39°C, above the heat-stress threshold for Tomato.', impact: 'High heat can scorch leaves, abort flowers and cut yields.', action: 'Provide shade or mulch, irrigate during the cooler hours, and check for wilting.', rule_code: 'heat_stress_warning', factors: { temperature: 39, crop_name: 'Tomato' }, created_at: new Date(Date.now() - 21 * 86400000).toISOString() },
    { id: 107, field_id: 1, field_name: 'North Tomato Plot', severity: 'caution', category: 'disease', title: 'High humidity — watch for disease', situation: 'Humidity is 88% — very high for Tomato.', impact: 'Prolonged high humidity favours fungal diseases such as blight and mildew.', action: 'Monitor the crop daily and improve air circulation between rows.', rule_code: 'disease_risk_humidity', factors: { humidity: 88, crop_name: 'Tomato' }, created_at: new Date(Date.now() - 42 * 86400000).toISOString() },
    { id: 108, field_id: 2, field_name: 'East Wheat Parcel', severity: 'favorable', category: 'general', title: 'Favorable conditions for planned work', situation: 'Current weather is mild and favourable for most farm work.', impact: 'No weather-related risk is currently detected for Wheat.', action: 'Proceed with planned activities as scheduled, but always double-check the sky before you start.', rule_code: 'favorable_conditions', factors: { crop_name: 'Wheat' }, created_at: new Date(Date.now() - 68 * 86400000).toISOString() },
  ]
  const all = [...DEMO_RECOMMENDATIONS, ...extra]
  if (!days) return all
  const cutoff = Date.now() - days * 86400000
  return all.filter((r) => new Date(r.created_at).getTime() >= cutoff)
}
