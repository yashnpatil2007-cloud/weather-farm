import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi, getErrorMessage } from '../../api'
import type { Crop, Rule, RuleCondition, Severity } from '../../types'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import SeverityBadge from '../../components/SeverityBadge'
import { PlusIcon, ShieldIcon, SproutIcon, ChartBarIcon } from '../../components/Icons'

type Tab = 'stats' | 'users' | 'farms' | 'crops' | 'rules'

interface AdminUser {
  id: number
  full_name: string
  email: string
  role: string
  is_active: boolean
  farm_count: number
  field_count: number
}

interface AdminFarm {
  id: number
  name: string
  location: string
  field_count: number
  created_at?: string
  user?: { id: number; full_name: string; email: string }
}

const CONDITION_FIELDS = ['temperature', 'humidity', 'rain_probability', 'expected_rainfall', 'wind_speed'] as const
const CONDITION_OPS: RuleCondition['op'][] = ['gt', 'gte', 'lt', 'lte', 'eq']

export default function AdminPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Record<string, number>>({})
  const [users, setUsers] = useState<AdminUser[]>([])
  const [farms, setFarms] = useState<AdminFarm[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Crop edit modal
  const [cropModal, setCropModal] = useState(false)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)
  const [cropForm, setCropForm] = useState<Partial<Crop>>({})

  // Rule modal
  const [ruleModal, setRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [ruleForm, setRuleForm] = useState<Partial<Rule>>({})

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [s, u, f, c, r] = await Promise.all([
        adminApi.stats(),
        adminApi.users(),
        adminApi.farms(),
        adminApi.crops(),
        adminApi.rules(),
      ])
      setStats(s)
      setUsers(u as unknown as AdminUser[])
      setFarms(f as unknown as AdminFarm[])
      setCrops(c)
      setRules(r)
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleUser = async (u: AdminUser, change: { is_active?: boolean; role?: string }) => {
    setError('')
    try {
      await adminApi.updateUser(u.id, change)
      loadAll()
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const openCropModal = (crop?: Crop) => {
    setError('')
    setEditingCrop(crop || null)
    setCropForm(
      crop || {
        name: '',
        category: 'Field crop',
        description: '',
        optimal_temp_min: 18,
        optimal_temp_max: 32,
        heat_stress_temp: 38,
        frost_temp: 4,
        wind_spray_limit: 20,
        humidity_disease_threshold: 85,
        is_active: true,
      },
    )
    setCropModal(true)
  }

  const saveCrop = async () => {
    if (!cropForm.name?.trim()) {
      setError(t('errors.required'))
      return
    }
    setError('')
    try {
      if (editingCrop) {
        await adminApi.updateCrop(editingCrop.id, { ...cropForm, name: cropForm.name.trim(), is_active: cropForm.is_active ?? true })
      } else {
        await adminApi.createCrop({ ...cropForm, name: cropForm.name.trim() })
      }
      setCropModal(false)
      loadAll()
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const deleteCrop = async (id: number) => {
    if (!window.confirm(t('admin.confirmDelete'))) return
    setError('')
    try {
      await adminApi.deleteCrop(id)
      loadAll()
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const openRuleModal = (rule?: Rule) => {
    setError('')
    setEditingRule(rule || null)
    setRuleForm(
      rule
        ? { ...rule, conditions: rule.conditions.map((c) => ({ ...c })) }
        : {
            code: '',
            name: '',
            description: '',
            category: 'irrigation',
            severity: 'warning',
            conditions: [{ field: 'rain_probability', op: 'gt', value: 70 }],
            situation: '',
            impact: '',
            action: '',
            crop_name: '',
            is_alert: true,
            is_default: false,
            alert_timing: 'today',
            enabled: true,
          },
    )
    setRuleModal(true)
  }

  const saveRule = async () => {
    if (!ruleForm.name?.trim() || (!editingRule && !ruleForm.code?.trim())) {
      setError(t('errors.required'))
      return
    }
    setError('')
    try {
      const payload: Partial<Rule> = {
        ...ruleForm,
        code: ruleForm.code?.trim(),
        name: ruleForm.name.trim(),
        crop_name: ruleForm.crop_name?.trim() || null,
      }
      if (editingRule) {
        await adminApi.updateRule(editingRule.id, payload)
      } else {
        await adminApi.createRule(payload)
      }
      setRuleModal(false)
      loadAll()
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const toggleRuleEnabled = async (rule: Rule) => {
    setError('')
    try {
      await adminApi.updateRule(rule.id, { enabled: !rule.enabled })
      loadAll()
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const deleteRule = async (id: number) => {
    if (!window.confirm('Delete this recommendation rule?')) return
    setError('')
    try {
      await adminApi.deleteRule(id)
      loadAll()
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    }
  }

  const updateCond = (idx: number, patch: Partial<RuleCondition>) => {
    const next = [...(ruleForm.conditions || [])]
    next[idx] = { ...next[idx], ...patch }
    setRuleForm({ ...ruleForm, conditions: next })
  }

  const statTranslationKey: Record<string, string> = {
    total_users: 'admin.stats.totalUsers',
    active_users: 'admin.stats.activeUsers',
    farms: 'admin.stats.farms',
    fields: 'admin.stats.fields',
    crops: 'admin.stats.crops',
    recommendations: 'admin.stats.recommendations',
    alerts: 'admin.stats.alerts',
    rules: 'admin.stats.rules',
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stats', label: t('admin.systemInfo') },
    { id: 'users', label: t('admin.users') },
    { id: 'farms', label: t('admin.farms') },
    { id: 'crops', label: t('admin.crops') },
    { id: 'rules', label: t('admin.rules') },
  ]

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-950 text-emerald-300 shadow-sm">
            <ShieldIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('admin.title')}</h1>
            <p className="text-slate-500 mt-0.5 text-sm">{t('admin.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {tabs.map((tabor) => (
          <button
            key={tabor.id}
            role="tab"
            aria-selected={tab === tabor.id}
            onClick={() => setTab(tabor.id)}
            className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              tab === tabor.id
                ? 'border-farm-600 bg-farm-50 text-farm-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-farm-300'
            }`}
          >
            {tabor.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <Card key={key} className="text-left p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {statTranslationKey[key] ? t(statTranslationKey[key]) : key}
                </span>
                <ChartBarIcon size={16} className="text-farm-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">{value}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <Card>
          {users.length === 0 ? (
            <p className="text-slate-500">{t('admin.noUsers')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3.5 flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{u.full_name}</div>
                    <div className="text-xs text-slate-500">{u.email} · {u.farm_count ?? 0} {t('admin.farms')} · {u.field_count ?? 0} {t('admin.fieldsCount')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {u.is_active ? t('admin.active') : 'Inactive'}
                    </span>
                    <span className="badge bg-slate-100 text-slate-700 capitalize">{u.role}</span>
                    <Button size="sm" variant="ghost" onClick={() => toggleUser(u, { is_active: !u.is_active })}>
                      {u.is_active ? t('admin.deactivate') : t('admin.activate')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleUser(u, { role: u.role === 'admin' ? 'farmer' : 'admin' })}>
                      {u.role === 'admin' ? t('admin.makeFarmer') : t('admin.makeAdmin')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'farms' && (
        <Card>
          {farms.length === 0 ? (
            <p className="text-slate-500">No farms registered.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {farms.map((f) => (
                <div key={f.id} className="py-3.5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-bold text-slate-900">{f.name}</div>
                    <div className="text-xs text-slate-500">
                      {f.location} {f.user ? `· Owner: ${f.user.full_name} (${f.user.email})` : ''}
                    </div>
                  </div>
                  <span className="badge bg-farm-50 text-farm-800 border border-farm-200">
                    {f.field_count ?? 0} {t('admin.fieldsCount')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'crops' && (
        <>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openCropModal()} className="py-2.5 px-4 text-sm">
              <PlusIcon size={15} /> {t('admin.addCrop')}
            </Button>
          </div>
          {crops.length === 0 ? (
            <Card><p className="text-slate-500">{t('admin.noCrops')}</p></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {crops.map((c) => (
                <Card key={c.id} className={c.is_active ? '' : 'opacity-60'}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-farm-50 text-farm-700 mt-0.5"><SproutIcon size={18} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">{c.name}</h3>
                        <p className="text-xs text-slate-500">{c.category}</p>
                        {c.description && <p className="text-xs text-slate-600 mt-1">{c.description}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button onClick={() => openCropModal(c)} className="text-xs font-semibold text-farm-700 hover:underline">{t('admin.editCrop')}</button>
                      <button onClick={() => deleteCrop(c.id)} className="text-xs font-semibold text-rose-600 hover:underline">{t('admin.delete')}</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                    <div>{t('admin.optimalMin')}: <b>{c.optimal_temp_min}°C</b></div>
                    <div>{t('admin.optimalMax')}: <b>{c.optimal_temp_max}°C</b></div>
                    <div>{t('admin.heatStress')}: <b>{c.heat_stress_temp}°C</b></div>
                    <div>{t('admin.frostTemp')}: <b>{c.frost_temp}°C</b></div>
                    <div>{t('admin.windLimit')}: <b>{c.wind_spray_limit} km/h</b></div>
                    <div>{t('admin.humidityDisease')}: <b>{c.humidity_disease_threshold}%</b></div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'rules' && (
        <>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openRuleModal()} className="py-2.5 px-4 text-sm">
              <PlusIcon size={15} /> {t('admin.addRule')}
            </Button>
          </div>
          <div className="space-y-3">
            {rules.length === 0 ? (
              <Card><p className="text-slate-500">{t('admin.noRules')}</p></Card>
            ) : (
              rules.map((r) => (
                <Card key={r.id} className={r.enabled ? '' : 'opacity-65'}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900">{r.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {r.code} · {r.category}{r.crop_name ? ` · Crop: ${r.crop_name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity={r.severity as Severity} size="sm" />
                      <button
                        onClick={() => toggleRuleEnabled(r)}
                        className={`badge cursor-pointer ${r.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}
                      >
                        {r.enabled ? t('admin.enabled') : 'Disabled'}
                      </button>
                      <button onClick={() => openRuleModal(r)} className="text-xs font-semibold text-farm-700 hover:underline px-1">
                        {t('common.edit')}
                      </button>
                      <button onClick={() => deleteRule(r.id)} className="text-xs font-semibold text-rose-600 hover:underline px-1">
                        {t('admin.delete')}
                      </button>
                    </div>
                  </div>
                  {r.description && <p className="text-sm text-slate-600 mt-1.5">{r.description}</p>}
                  {r.action && (
                    <div className="mt-2.5 bg-slate-50 rounded-xl p-3 text-xs text-slate-700">{r.action}</div>
                  )}
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {/* Crop modal */}
      <Modal
        open={cropModal}
        onClose={() => setCropModal(false)}
        title={editingCrop ? t('admin.editCrop') : t('admin.addCrop')}
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t('admin.cropName')}</label>
            <input className="input" value={cropForm.name || ''} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('admin.category')}</label>
            <input className="input" value={cropForm.category || ''} onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('admin.description')}</label>
            <textarea className="input" rows={2} value={cropForm.description || ''} onChange={(e) => setCropForm({ ...cropForm, description: e.target.value })} />
          </div>
          <p className="text-xs font-semibold text-slate-500">{t('admin.thresholds')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('admin.optimalMin')}</label><input type="number" className="input" value={cropForm.optimal_temp_min ?? ''} onChange={(e) => setCropForm({ ...cropForm, optimal_temp_min: Number(e.target.value) })} /></div>
            <div><label className="label">{t('admin.optimalMax')}</label><input type="number" className="input" value={cropForm.optimal_temp_max ?? ''} onChange={(e) => setCropForm({ ...cropForm, optimal_temp_max: Number(e.target.value) })} /></div>
            <div><label className="label">{t('admin.heatStress')}</label><input type="number" className="input" value={cropForm.heat_stress_temp ?? ''} onChange={(e) => setCropForm({ ...cropForm, heat_stress_temp: Number(e.target.value) })} /></div>
            <div><label className="label">{t('admin.frostTemp')}</label><input type="number" className="input" value={cropForm.frost_temp ?? ''} onChange={(e) => setCropForm({ ...cropForm, frost_temp: Number(e.target.value) })} /></div>
            <div><label className="label">{t('admin.windLimit')}</label><input type="number" className="input" value={cropForm.wind_spray_limit ?? ''} onChange={(e) => setCropForm({ ...cropForm, wind_spray_limit: Number(e.target.value) })} /></div>
            <div><label className="label">{t('admin.humidityDisease')}</label><input type="number" className="input" value={cropForm.humidity_disease_threshold ?? ''} onChange={(e) => setCropForm({ ...cropForm, humidity_disease_threshold: Number(e.target.value) })} /></div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={cropForm.is_active ?? true} onChange={(e) => setCropForm({ ...cropForm, is_active: e.target.checked })} />
            <span className="text-sm text-slate-700">{t('admin.enabled')}</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCropModal(false)}>{t('admin.cancel')}</Button>
            <Button onClick={saveCrop}>{t('admin.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Rule modal */}
      <Modal
        open={ruleModal}
        onClose={() => setRuleModal(false)}
        title={editingRule ? t('admin.editRule') : t('admin.addRule')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('admin.ruleCode')}</label>
              <input
                className="input font-mono text-sm"
                placeholder="e.g. heat_tomato"
                disabled={Boolean(editingRule)}
                value={ruleForm.code || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              />
            </div>
            <div>
              <label className="label">{t('admin.ruleCategory')}</label>
              <input className="input" value={ruleForm.category || ''} onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">{t('admin.ruleName')}</label>
            <input className="input" value={ruleForm.name || ''} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('admin.ruleSeverity')}</label>
              <select className="input" value={ruleForm.severity || 'warning'} onChange={(e) => setRuleForm({ ...ruleForm, severity: e.target.value as Severity })}>
                <option value="favorable">Favorable</option>
                <option value="caution">Caution</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="label">Restrict to Crop (optional)</label>
              <input className="input" placeholder="Any crop" value={ruleForm.crop_name || ''} onChange={(e) => setRuleForm({ ...ruleForm, crop_name: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">{t('admin.ruleConditions')}</label>
              <button
                type="button"
                onClick={() => setRuleForm({ ...ruleForm, conditions: [...(ruleForm.conditions || []), { field: 'temperature', op: 'gt', value: 35 }] })}
                className="text-xs font-semibold text-farm-700 hover:underline"
              >
                + Add condition
              </button>
            </div>
            <div className="space-y-2">
              {(ruleForm.conditions || []).map((cond, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <select className="input col-span-5 text-xs py-2" value={cond.field} onChange={(e) => updateCond(idx, { field: e.target.value })}>
                    {CONDITION_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <select className="input col-span-3 text-xs py-2" value={cond.op} onChange={(e) => updateCond(idx, { op: e.target.value as RuleCondition['op'] })}>
                    {CONDITION_OPS.map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input
                    type="number"
                    className="input col-span-3 text-xs py-2"
                    value={cond.value ?? ''}
                    onChange={(e) => updateCond(idx, { value: Number(e.target.value) })}
                  />
                  <button
                    type="button"
                    onClick={() => setRuleForm({ ...ruleForm, conditions: (ruleForm.conditions || []).filter((_, i) => i !== idx) })}
                    className="col-span-1 text-rose-500 font-bold text-sm"
                    aria-label="Remove condition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">{t('admin.ruleSituation')}</label>
            <input className="input" value={ruleForm.situation || ''} onChange={(e) => setRuleForm({ ...ruleForm, situation: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('admin.ruleImpact')}</label>
            <input className="input" value={ruleForm.impact || ''} onChange={(e) => setRuleForm({ ...ruleForm, impact: e.target.value })} />
          </div>
          <div>
            <label className="label">{t('admin.ruleAction')}</label>
            <textarea className="input" rows={2} value={ruleForm.action || ''} onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })} />
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={ruleForm.is_alert ?? false} onChange={(e) => setRuleForm({ ...ruleForm, is_alert: e.target.checked })} />
              Generate Alert
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={ruleForm.enabled ?? true} onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })} />
              {t('admin.enabled')}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRuleModal(false)}>{t('admin.cancel')}</Button>
            <Button onClick={saveRule}>{t('admin.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
