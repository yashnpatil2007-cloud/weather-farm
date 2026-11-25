import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { activitiesApi, analyticsApi, getErrorMessage, recommendationsApi } from '../api'
import { useStore } from '../context/StoreContext'
import type { Activity, Recommendation, Severity } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import { WeatherLineChart, WeatherBarChart } from '../components/WeatherChart'
import SeverityBadge from '../components/SeverityBadge'
import { PlusIcon, ChartBarIcon, DropletIcon, BellIcon, LightbulbIcon, SproutIcon } from '../components/Icons'
import { formatDate, parseLocalDate } from '../utils/format'
import { localizeCropName, localizeRecommendation } from '../utils/localizeContent'

type Period = '7d' | '30d' | '3m'

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '3m': 90 }
const EXPECTED_POINTS: Record<Period, number> = { '7d': 7, '30d': 30, '3m': 13 }
const ACTIVITY_TYPES = ['irrigation', 'sowing', 'fertilizer', 'pesticide', 'harvesting', 'other'] as const

interface WeatherTrend {
  date: string
  avg_temp?: number | null
  avg_humidity?: number | null
  avg_rainfall?: number | null
  max_rain_prob?: number | null
}

interface AlertSummary {
  date: string
  severity: Severity
  count: number
}

interface IrrigationRow {
  date: string
  irrigations?: number
  water_liters?: number
}

export default function HistoryPage() {
  const { t, i18n } = useTranslation()
  const { farms, selectedField } = useStore()
  const [period, setPeriod] = useState<Period>('30d')
  const [overview, setOverview] = useState<Record<string, number>>({})
  const [weather, setWeather] = useState<WeatherTrend[]>([])
  const [alerts, setAlerts] = useState<AlertSummary[]>([])
  const [irrigation, setIrrigation] = useState<IrrigationRow[]>([])
  const [recos, setRecos] = useState<Recommendation[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Log activity modal
  const [showActModal, setShowActModal] = useState(false)
  const [actFieldId, setActFieldId] = useState<number | ''>('')
  const [actType, setActType] = useState<string>('irrigation')
  const [actDate, setActDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [actTime, setActTime] = useState('07:00')
  const [actAmount, setActAmount] = useState('')
  const [actNotes, setActNotes] = useState('')
  const [savingAct, setSavingAct] = useState(false)
  const [actError, setActError] = useState('')

  const allFields = farms.flatMap((f) => f.fields.map((fl) => ({ ...fl, farmName: f.name })))

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, w, a, irr, r, acts] = await Promise.all([
        analyticsApi.overview(period),
        analyticsApi.weather(period),
        analyticsApi.alerts(period),
        analyticsApi.irrigation(period),
        recommendationsApi.list(undefined, 100, PERIOD_DAYS[period]),
        activitiesApi.list(),
      ])
      setOverview(ov as Record<string, number>)
      setWeather(w as unknown as WeatherTrend[])
      setAlerts(a as unknown as AlertSummary[])
      setIrrigation(irr as unknown as IrrigationRow[])
      setRecos(r)
      setActivities(acts)
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  const openActivityModal = () => {
    setActFieldId(selectedField?.id ?? '')
    setActType('irrigation')
    setActDate(new Date().toISOString().slice(0, 10))
    setActTime('07:00')
    setActAmount('')
    setActNotes('')
    setActError('')
    setShowActModal(true)
  }

  const saveActivity = async () => {
    setSavingAct(true)
    setActError('')
    try {
      await activitiesApi.create({
        field_id: actFieldId === '' ? undefined : Number(actFieldId),
        activity_type: actType,
        activity_date: actDate,
        activity_time: actTime,
        amount: actAmount ? Number(actAmount) : undefined,
        notes: actNotes.trim() || undefined,
      })
      setShowActModal(false)
      await loadData()
    } catch (err) {
      setActError(getErrorMessage(err, t('errors.server')))
    } finally {
      setSavingAct(false)
    }
  }

  const deleteActivity = async (id: number) => {
    if (!window.confirm('Delete this activity log?')) return
    try {
      await activitiesApi.delete(id)
      setActivities((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const chartData = weather.map((d) => ({
    ...d,
    dayLabel: parseLocalDate(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    avg_temp: d.avg_temp ?? 0,
    avg_humidity: d.avg_humidity ?? 0,
    max_rain_prob: d.max_rain_prob ?? 0,
    avg_rainfall: d.avg_rainfall ?? 0,
  }))

  const irrigationChart = irrigation.map((r) => ({
    date: r.date,
    dayLabel: parseLocalDate(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    irrigations: r.irrigations ?? r.water_liters ?? 0,
  }))

  const alertChartData = alerts.reduce<Record<string, Record<string, number>>>((acc, a) => {
    const d = /^\d{4}-\d{2}-\d{2}/.test(a.date)
      ? a.date.slice(0, 10)
      : new Date(a.date).toISOString().split('T')[0]
    if (!acc[d]) acc[d] = {}
    acc[d][a.severity] = (acc[d][a.severity] || 0) + a.count
    return acc
  }, {})
  const alertChart = Object.entries(alertChartData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sev]) => ({
      date,
      dayLabel: parseLocalDate(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      critical: sev.critical || 0,
      warning: sev.warning || 0,
      caution: sev.caution || 0,
    }))

  const sortedRecos = [...recos]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => localizeRecommendation(r, t, i18n.language))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('history.title')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('history.subtitle')}</p>
        </div>
        <Button size="sm" onClick={openActivityModal} className="py-2.5 px-4 text-sm">
          <PlusIcon size={15} /> Log Activity
        </Button>
      </header>

      {/* Period selector */}
      <div className="flex gap-2" role="tablist" aria-label="period">
        {(['7d', '30d', '3m'] as Period[]).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={period === p}
            onClick={() => setPeriod(p)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              period === p
                ? 'border-farm-600 bg-farm-50 text-farm-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-farm-300'
            }`}
          >
            {t(`history.period.${p}`)}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-farm-50 text-farm-700"><LightbulbIcon size={20} /></div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{overview.recommendations_generated ?? recos.length}</div>
            <div className="text-xs text-slate-500">Recommendations</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><BellIcon size={20} /></div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{overview.alerts_received ?? 0}</div>
            <div className="text-xs text-slate-500">Alerts Received</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600"><DropletIcon size={20} /></div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{overview.activities_recorded ?? activities.length}</div>
            <div className="text-xs text-slate-500">Activities Logged</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600"><ChartBarIcon size={20} /></div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{overview.unread_alerts ?? 0}</div>
            <div className="text-xs text-slate-500">Unread Alerts</div>
          </div>
        </Card>
      </div>

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <>
          {/* Weather trends */}
          {chartData.length > 0 ? (
            <Card>
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t('history.weatherTitle')}</h2>
              {chartData.length < EXPECTED_POINTS[period] && (
                <p className="mb-4 bg-farm-50 text-farm-800 border border-farm-200 rounded-xl px-4 py-3 text-sm">
                  {t('history.limitedData')}
                </p>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('history.temperature')}</h3>
                  <WeatherLineChart data={chartData} xKey="dayLabel" yUnit="°" lines={[{ key: 'avg_temp', color: '#f97316', name: t('history.temperature') }]} height={210} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('history.humidity')}</h3>
                  <WeatherLineChart data={chartData} xKey="dayLabel" yUnit="%" lines={[{ key: 'avg_humidity', color: '#8b5cf6', name: t('history.humidity') }]} height={200} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('history.rainfall')}</h3>
                  <WeatherBarChart data={chartData} xKey="dayLabel" yUnit="mm" bars={[{ key: 'avg_rainfall', fill: '#3b82f6', name: t('history.rainfall') }]} height={200} />
                </div>
              </div>
            </Card>
          ) : (
            <Card><p className="text-slate-500">{t('history.noWeather')}</p></Card>
          )}

          {/* Irrigation & Alerts Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {irrigationChart.length > 0 && (
              <Card>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Irrigation Frequency</h2>
                <WeatherBarChart
                  data={irrigationChart}
                  xKey="dayLabel"
                  bars={[{ key: 'irrigations', fill: '#0ea5e9', name: 'Irrigations' }]}
                  height={210}
                />
              </Card>
            )}

            {alertChart.length > 0 && (
              <Card className={irrigationChart.length === 0 ? 'lg:col-span-2' : ''}>
                <h2 className="text-lg font-bold text-slate-900 mb-4">{t('history.alertsTitle')}</h2>
                <WeatherBarChart
                  data={alertChart}
                  xKey="dayLabel"
                  bars={[
                    { key: 'caution', fill: '#eab308', name: t('alerts.severity.caution') },
                    { key: 'warning', fill: '#f97316', name: t('alerts.severity.warning') },
                    { key: 'critical', fill: '#dc2626', name: t('alerts.severity.critical') },
                  ]}
                  height={210}
                />
              </Card>
            )}
          </div>

          {/* Field Activity Log */}
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <SproutIcon size={18} className="text-farm-600" />
                <h2 className="text-lg font-bold text-slate-900">Field Activity Log ({activities.length})</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={openActivityModal} className="text-farm-700">+ Log Activity</Button>
            </div>
            {activities.length === 0 ? (
              <p className="text-slate-500 text-sm">No farming activities logged yet. Record irrigation, sowing, fertilizer or spraying work.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.slice(0, 15).map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge bg-farm-50 text-farm-800 border border-farm-200 capitalize">
                          {t(`activityTypes.${act.activity_type}`, { defaultValue: act.activity_type })}
                        </span>
                        {act.field_name && <span className="text-sm font-semibold text-slate-800">{act.field_name}</span>}
                        {act.crop_name && <span className="text-xs text-slate-500">· {localizeCropName(act.crop_name, t)}</span>}
                        {act.amount != null && <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">{act.amount} units</span>}
                      </div>
                      {act.notes && <p className="text-xs text-slate-500 mt-1">{act.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{formatDate(act.activity_date, t)} · {String(act.activity_time).slice(0, 5)}</span>
                      <button onClick={() => deleteActivity(act.id)} className="text-rose-500 hover:underline font-medium">
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recommendation history */}
          <Card>
            <h2 className="text-lg font-bold text-slate-900 mb-4">{t('history.recommendationTitle')}</h2>
            {sortedRecos.length === 0 ? (
              <p className="text-slate-500 text-sm">{t('history.noRecommendations')}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sortedRecos.slice(0, 15).map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <span className="text-slate-900 font-semibold text-sm block truncate">{r.title}</span>
                      {r.field_name && <span className="text-xs text-slate-500">{r.field_name}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SeverityBadge severity={r.severity as Severity} size="sm" />
                      <span className="text-xs text-slate-400">{formatDate(r.created_at, t)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* Log Activity Modal */}
      <Modal open={showActModal} onClose={() => setShowActModal(false)} title="Log Farming Activity">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="act-type">Activity Type</label>
              <select id="act-type" className="input" value={actType} onChange={(e) => setActType(e.target.value)}>
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>{t(`activityTypes.${type}`, { defaultValue: type })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="act-field">Field</label>
              <select id="act-field" className="input" value={actFieldId} onChange={(e) => setActFieldId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">General / All fields</option>
                {allFields.map((fl) => (
                  <option key={fl.id} value={fl.id}>{fl.farmName} · {fl.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="act-date">Date</label>
              <input id="act-date" type="date" className="input" value={actDate} onChange={(e) => setActDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="act-time">Time</label>
              <input id="act-time" type="time" className="input" value={actTime} onChange={(e) => setActTime(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="act-amt">Amount (L / kg)</label>
              <input id="act-amt" type="number" min="0" step="any" className="input" placeholder="e.g. 20" value={actAmount} onChange={(e) => setActAmount(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="act-notes">Notes</label>
            <textarea id="act-notes" className="input" rows={2} placeholder="Optional observations..." value={actNotes} onChange={(e) => setActNotes(e.target.value)} />
          </div>
          {actError && <p role="alert" className="text-rose-600 text-sm">{actError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowActModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveActivity} disabled={savingAct}>{savingAct ? <Spinner size="sm" /> : t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
