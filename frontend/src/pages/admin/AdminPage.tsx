import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminApi } from '../../api'
import type { Crop, Rule, Severity } from '../../types'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import SeverityBadge from '../../components/SeverityBadge'

type Tab = 'stats' | 'users' | 'crops' | 'rules'

interface AdminUser {
  id: number
  full_name: string
  email: string
  role: string
  is_active: boolean
  farm_count: number
  field_count: number
}

export default function AdminPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Record<string, number>>({})
  const [users, setUsers] = useState<AdminUser[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)

  // Crop edit modal
  const [cropModal, setCropModal] = useState(false)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)
  const [cropForm, setCropForm] = useState<Partial<Crop>>({})

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, u, c, r] = await Promise.all([
        adminApi.stats(),
        adminApi.users(),
        adminApi.crops(),
        adminApi.rules(),
      ])
      setStats(s)
      setUsers(u as unknown as AdminUser[])
      setCrops(c)
      setRules(r)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const toggleUser = async (u: AdminUser, change: { is_active?: boolean; role?: string }) => {
    await adminApi.updateUser(u.id, change)
    loadAll()
  }

  const openCropModal = (crop?: Crop) => {
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
    if (editingCrop) {
      await adminApi.updateCrop(editingCrop.id, { ...cropForm, is_active: cropForm.is_active ?? true })
    } else {
      await adminApi.createCrop(cropForm)
    }
    setCropModal(false)
    loadAll()
  }

  const deleteCrop = async (id: number) => {
    if (!window.confirm(t('admin.confirmDelete'))) return
    await adminApi.deleteCrop(id)
    loadAll()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stats', label: t('admin.systemInfo') },
    { id: 'users', label: t('admin.users') },
    { id: 'crops', label: t('admin.crops') },
    { id: 'rules', label: t('admin.rules') },
  ]

  if (loading) return <Spinner size="lg" />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('admin.title')}</h1>
        <p className="text-gray-500 mt-1">{t('admin.subtitle')}</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {tabs.map((tabor) => (
          <button
            key={tabor.id}
            role="tab"
            aria-selected={tab === tabor.id}
            onClick={() => setTab(tabor.id)}
            className={`whitespace-nowrap rounded-xl border-2 px-4 py-2 text-sm font-medium ${tab === tabor.id ? 'border-farm-600 bg-farm-50 text-farm-700' : 'border-gray-200 text-gray-600'}`}
          >
            {tabor.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <Card key={key} className="text-center">
              <div className="text-3xl font-bold text-farm-700">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{t(`admin.stats.${key}`) || key}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <Card>
          {users.length === 0 ? (
            <p className="text-gray-500">{t('admin.noUsers')}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 flex-wrap gap-2">
                  <div>
                    <div className="font-medium text-gray-800">{u.full_name}</div>
                    <div className="text-sm text-gray-500">{u.email} · {u.farm_count} {t('admin.farms')} · {u.field_count} {t('admin.fieldsCount')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.is_active ? t('admin.active') : 'Inactive'}
                    </span>
                    <span className="badge bg-gray-100 text-gray-700 capitalize">{u.role}</span>
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

      {tab === 'crops' && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openCropModal()}>+ {t('admin.addCrop')}</Button>
          </div>
          {crops.length === 0 ? (
            <Card><p className="text-gray-500">{t('admin.noCrops')}</p></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {crops.map((c) => (
                <Card key={c.id} className={c.is_active ? '' : 'opacity-60'}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">🌱 {c.name}</h3>
                      <p className="text-sm text-gray-500">{c.category}</p>
                      {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => openCropModal(c)} className="text-sm text-farm-700 underline">{t('admin.editCrop')}</button>
                      <button onClick={() => deleteCrop(c.id)} className="text-sm text-red-500 underline">{t('admin.delete')}</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
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
        <div className="space-y-3">
          {rules.length === 0 ? (
            <Card><p className="text-gray-500">{t('admin.noRules')}</p></Card>
          ) : (
            rules.map((r) => (
              <Card key={r.id} className={r.enabled ? '' : 'opacity-60'}>
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{r.name}</h3>
                    <p className="text-xs text-gray-400">{r.code} · {r.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={r.severity as Severity} size="sm" />
                    <span className={`badge ${r.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {r.enabled ? t('admin.enabled') : 'Disabled'}
                    </span>
                  </div>
                </div>
                {r.description && <p className="text-sm text-gray-600 mt-1">{r.description}</p>}
                {r.action && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{r.action}</div>
                )}
              </Card>
            ))
          )}
        </div>
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
          <p className="text-xs font-semibold text-gray-500">{t('admin.thresholds')}</p>
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
            <span className="text-sm text-gray-700">{t('admin.enabled')}</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCropModal(false)}>{t('admin.cancel')}</Button>
            <Button onClick={saveCrop}>{t('admin.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
