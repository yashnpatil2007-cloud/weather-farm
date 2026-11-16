import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { recommendationsApi } from '../api'
import type { GenerateResponse, Severity } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import SeverityBadge from '../components/SeverityBadge'
import ListenButton from '../components/ListenButton'
import { severityRank } from '../utils/format'

const DEMO_SCENARIOS = [
  { key: '1_high_rain', label: '🌧️ Heavy rain' },
  { key: '2_high_wind', label: '💨 High wind' },
  { key: '3_high_temp', label: '🌡️ Heat wave' },
  { key: '4_low_rain', label: '🌞 Dry & hot' },
  { key: '5_frost', label: '❄️ Frost risk' },
]

export default function AdvicePage() {
  const { t } = useTranslation()
  const { selectedField, selectedFarm } = useStore()
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const field = selectedField
  const farm = selectedFarm

  const generate = async (scenario?: string) => {
    if (!field) return
    setLoading(true)
    setError('')
    try {
      const r = scenario ? await recommendationsApi.simulate(field.id, scenario) : await recommendationsApi.generate(field.id)
      setResult(r)
      setExpanded(null)
    } catch {
      setError(t('errors.server'))
    } finally {
      setLoading(false)
    }
  }

  if (!field || !farm) {
    return (
      <Card className="text-center py-12">
        <div className="text-5xl mb-3" aria-hidden="true">💡</div>
        <p className="text-gray-600">{t('dashboard.noField')}</p>
      </Card>
    )
  }

  const sortedRecos = [...(result?.recommendations || [])].sort(
    (a, b) => severityRank(b.severity as Severity) - severityRank(a.severity as Severity),
  )

  const speakAll = sortedRecos.map((r) => r.title).join('. ') + (sortedRecos.length ? '.' : '')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('advice.title')}</h1>
        <p className="text-gray-500 mt-1">{t('advice.subtitle')}</p>
      </header>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            🌾 {farm.name} · {field.name}
            {field.crop && <span className="text-farm-700 font-medium"> · {field.crop.name} ({field.growth_stage?.name})</span>}
          </div>
          <Button onClick={() => generate()} disabled={loading}>
            {loading ? <Spinner size="sm" /> : <><span aria-hidden="true">🔄</span>{t('advice.generate')}</>}
          </Button>
        </div>
      </Card>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Demo scenarios */}
      <Card>
        <p className="text-sm text-gray-500 mb-3">{t('advice.scenarioHint')}</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => generate(s.key)}
              disabled={loading}
              className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm font-medium hover:border-farm-400 hover:bg-farm-50 disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      {loading && !result && <Spinner size="lg" label={t('common.loading')} />}

      {result && sortedRecos.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-bold text-gray-800">{t('advice.today')}</h2>
            <ListenButton text={speakAll} label={t('common.listen')} />
          </div>

          <div className="space-y-4">
            {sortedRecos.map((r) => (
              <Card key={r.id} className={`border-l-4 ${r.severity === 'critical' ? 'border-l-red-500' : r.severity === 'warning' ? 'border-l-orange-400' : r.severity === 'caution' ? 'border-l-yellow-400' : 'border-l-green-500'}`}>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">{r.title}</h3>
                  <SeverityBadge severity={r.severity as Severity} />
                </div>
                {r.action && <p className="mt-2 text-gray-700">{r.action}</p>}

                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="text-farm-700 font-medium text-sm underline"
                    aria-expanded={expanded === r.id}
                  >
                    {t('advice.why')}
                  </button>
                  <ListenButton text={`${r.title}. ${r.action || ''} ${r.situation || ''}`} label={t('common.listen')} className="px-2 py-1 text-sm" />
                </div>

                {expanded === r.id && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1" role="region" aria-label={t('advice.why')}>
                    {r.situation && <p><strong>•</strong> {r.situation}</p>}
                    {r.impact && <p><strong>•</strong> {r.impact}</p>}
                    {r.rule_code && <p className="text-gray-400 text-xs">Rule: {r.rule_code}</p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {result && sortedRecos.length === 0 && (
        <Card>
          <p className="text-gray-600">{t('dashboard.noRecommendations')}</p>
        </Card>
      )}

      {!result && !loading && (
        <Card className="text-center py-8">
          <div className="text-4xl mb-2" aria-hidden="true">💡</div>
          <p className="text-gray-500">{t('advice.noAdvice')}</p>
        </Card>
      )}
    </div>
  )
}
