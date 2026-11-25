import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { cropsApi, getErrorMessage, weatherApi, type GeocodeResult } from '../api'
import type { Crop, CropGrowthStage, Farm } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import MapPicker from '../components/MapPicker'
import { MapPinIcon, PlusIcon, SproutIcon, CheckCircleIcon } from '../components/Icons'
import { localizeCropName, localizeStageName } from '../utils/localizeContent'

export default function FarmPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    farms,
    selectedFarm,
    selectedField,
    selectFarm,
    selectField,
    addFarm,
    updateFarm,
    removeFarm,
    addField,
    updateField,
    removeField,
  } = useStore()

  const [crops, setCrops] = useState<Crop[]>([])
  const [stages, setStages] = useState<CropGrowthStage[]>([])

  // Farm modal
  const [showFarmModal, setShowFarmModal] = useState(false)
  const [farmName, setFarmName] = useState('')
  const [farmLocation, setFarmLocation] = useState('')
  const [farmLat, setFarmLat] = useState(19.076)
  const [farmLon, setFarmLon] = useState(72.8777)
  const [farmSearch, setFarmSearch] = useState('')
  const [farmResults, setFarmResults] = useState<GeocodeResult[]>([])
  const [editingFarmId, setEditingFarmId] = useState<number | null>(null)

  // Field modal
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [fieldName, setFieldName] = useState('')
  const [fieldArea, setFieldArea] = useState('')
  const [soilType, setSoilType] = useState('Loam')
  const [cropId, setCropId] = useState<number | null>(null)
  const [stageId, setStageId] = useState<number | null>(null)
  const [fieldLat, setFieldLat] = useState<number | null>(null)
  const [fieldLon, setFieldLon] = useState<number | null>(null)
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)

  const [error, setError] = useState('')
  const [pageError, setPageError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    cropsApi.list().then(setCrops).catch(() => setCrops([]))
    cropsApi.growthStages().then(setStages).catch(() => setStages([]))
  }, [])

  const geocodeSearch = async (q: string) => {
    if (q.trim().length < 2) return
    try {
      const r = await weatherApi.geocode(q)
      setFarmResults(r)
    } catch {
      setFarmResults([])
    }
  }

  const openAddFarm = () => {
    setEditingFarmId(null)
    setFarmName('')
    setFarmLocation('')
    setFarmSearch('')
    setFarmLat(19.076)
    setFarmLon(72.8777)
    setFarmResults([])
    setError('')
    setShowFarmModal(true)
  }

  const openEditFarm = (farm: Farm) => {
    setEditingFarmId(farm.id)
    setFarmName(farm.name)
    setFarmLocation(farm.location)
    setFarmSearch(farm.location)
    setFarmLat(farm.lat)
    setFarmLon(farm.lon)
    setFarmResults([])
    setError('')
    setShowFarmModal(true)
  }

  const saveFarm = async () => {
    const trimmedName = farmName.trim()
    if (!trimmedName) {
      setError(t('errors.required'))
      return
    }
    setBusy(true)
    setError('')
    try {
      if (editingFarmId !== null) {
        await updateFarm(editingFarmId, {
          name: trimmedName,
          location: (farmLocation || farmSearch).trim() || 'My farm',
          lat: farmLat,
          lon: farmLon,
        })
      } else {
        await addFarm({
          name: trimmedName,
          location: (farmLocation || farmSearch).trim() || 'My farm',
          lat: farmLat,
          lon: farmLon,
        })
      }
      setShowFarmModal(false)
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setBusy(false)
    }
  }

  const openAddField = () => {
    setEditingFieldId(null)
    setFieldName('')
    setFieldArea('')
    setSoilType('Loam')
    setCropId(null)
    setStageId(null)
    setFieldLat(selectedFarm?.lat ?? null)
    setFieldLon(selectedFarm?.lon ?? null)
    setError('')
    setShowFieldModal(true)
  }

  const openEditField = (id: number) => {
    const field = (selectedFarm?.fields || []).find((x) => x.id === id)
    if (field) {
      setEditingFieldId(id)
      setFieldName(field.name || '')
      setFieldArea(String((field.size_hectares / 0.404686).toFixed(2)))
      setSoilType(field.soil_type || 'Loam')
      setCropId(field.crop?.id ?? null)
      setStageId(field.growth_stage?.id ?? null)
      setFieldLat(field.lat ?? selectedFarm?.lat ?? null)
      setFieldLon(field.lon ?? selectedFarm?.lon ?? null)
      setError('')
      setShowFieldModal(true)
    }
  }

  const saveField = async () => {
    if (!selectedFarm) return
    const trimmedName = fieldName.trim()
    const parsedArea = parseFloat(fieldArea)
    if (!trimmedName) {
      setError(t('errors.required'))
      return
    }
    if (fieldArea && (isNaN(parsedArea) || parsedArea <= 0)) {
      setError(t('errors.required'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = {
        name: trimmedName,
        size_hectares: parsedArea > 0 ? parsedArea : 1,
        soil_type: soilType,
        crop_id: cropId ?? undefined,
        growth_stage_id: stageId ?? undefined,
        lat: fieldLat ?? undefined,
        lon: fieldLon ?? undefined,
      }
      if (editingFieldId !== null) {
        await updateField(editingFieldId, payload)
      } else {
        await addField(selectedFarm.id, payload)
      }
      setShowFieldModal(false)
    } catch (err) {
      setError(getErrorMessage(err, t('errors.server')))
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteFarm = async (farm: Farm) => {
    if (!window.confirm(`Delete farm "${farm.name}" and all its fields?`)) return
    setPageError('')
    try {
      await removeFarm(farm.id)
    } catch (err) {
      setPageError(getErrorMessage(err, t('errors.server')))
    }
  }

  const handleDeleteField = async (id: number, name: string) => {
    if (!window.confirm(`Delete field "${name}"?`)) return
    setPageError('')
    try {
      await removeField(id)
    } catch (err) {
      setPageError(getErrorMessage(err, t('errors.server')))
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">{t('farm.title')}</h1>
          <p className="text-slate-500 mt-1 text-sm">{t('farm.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={openAddField} disabled={!selectedFarm} className="py-2.5 px-4 text-sm">
            <PlusIcon size={15} /> {t('farm.addField')}
          </Button>
          <Button size="sm" onClick={openAddFarm} className="py-2.5 px-4 text-sm">
            <PlusIcon size={15} /> {t('farm.addFarm')}
          </Button>
        </div>
      </header>

      {pageError && (
        <div role="alert" aria-live="assertive" className="bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-3 text-sm">
          {pageError}
        </div>
      )}

      {/* Farm selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('farm.farm')}>
        {farms.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={selectedFarm?.id === f.id}
            onClick={() => selectFarm(f.id)}
            className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition-all ${
              selectedFarm?.id === f.id
                ? 'border-farm-600 bg-farm-50 text-farm-800 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-farm-300'
            }`}
          >
            <SproutIcon size={15} className={selectedFarm?.id === f.id ? 'text-farm-600' : 'text-slate-400'} />
            {f.name}
            <span className="text-xs text-slate-400 font-normal">({f.fields.length})</span>
          </button>
        ))}
      </div>

      {selectedFarm ? (
        <>
          {/* Farm card with map */}
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedFarm.name}</h2>
                <p className="text-slate-500 text-sm inline-flex items-center gap-1.5 mt-0.5">
                  <MapPinIcon size={14} className="text-farm-600" />
                  {selectedFarm.location}
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-mono text-slate-400">{selectedFarm.lat.toFixed(3)}, {selectedFarm.lon.toFixed(3)}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditFarm(selectedFarm)}>{t('farm.edit')}</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteFarm(selectedFarm)} className="text-rose-600 hover:bg-rose-50">{t('farm.delete')}</Button>
              </div>
            </div>
            <MapPicker lat={selectedFarm.lat} lon={selectedFarm.lon} onChange={() => {}} interactive={false} height={220} />
          </Card>

          {/* Fields */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{t('farm.fields')} ({selectedFarm.fields.length})</h2>
            <span className="text-xs text-slate-500">Click any field card to make it active on your Dashboard</span>
          </div>
          {selectedFarm.fields.length === 0 ? (
            <Card className="text-center py-10">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-farm-50 text-farm-600 flex items-center justify-center">
                <SproutIcon size={24} />
              </div>
              <p className="text-slate-500 mb-4">{t('farm.noFields')}</p>
              <Button onClick={openAddField}>+ {t('farm.addField')}</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedFarm.fields.map((f) => {
                const isActive = selectedField?.id === f.id
                return (
                  <Card
                    key={f.id}
                    onClick={() => selectField(f.id)}
                    className={isActive ? 'ring-2 ring-farm-500 border-farm-500 bg-farm-50/20' : ''}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">{f.name}</h3>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-farm-100 text-farm-800 px-2.5 py-0.5 text-[11px] font-bold">
                              <CheckCircleIcon size={12} /> Active
                            </span>
                          )}
                        </div>
                        {f.crop && (
                          <p className="text-sm text-farm-700 font-semibold mt-1">
                            {localizeCropName(f.crop.name, t)}
                            {f.growth_stage && <span className="text-slate-500 font-normal"> · {localizeStageName(f.growth_stage.name, t)}</span>}
                          </p>
                        )}
                        <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium">
                            {(f.size_hectares / 0.404686).toFixed(2)} {t('farm.labelUnits')}
                          </span>
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium">
                            {t(`soilTypes.${f.soil_type}`)}
                          </span>
                          {f.lat && (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px]">
                              {f.lat.toFixed(2)}, {f.lon?.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditField(f.id) }}
                          className="text-xs font-semibold text-farm-700 hover:underline"
                        >
                          {t('farm.edit')}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteField(f.id, f.name) }}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          {t('farm.delete')}
                        </button>
                        {isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate('/') }}
                            className="mt-1 text-[11px] font-bold text-slate-600 hover:text-farm-700"
                          >
                            View advice →
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-10">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-farm-50 text-farm-600 flex items-center justify-center">
            <SproutIcon size={24} />
          </div>
          <p className="text-slate-500 mb-4">{t('dashboard.noField')}</p>
          <Button onClick={openAddFarm}>+ {t('farm.addFarm')}</Button>
        </Card>
      )}

      {/* Farm modal */}
      <Modal
        open={showFarmModal}
        onClose={() => setShowFarmModal(false)}
        title={editingFarmId !== null ? t('farm.editFarm') : t('farm.addFarm')}
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="fm-name">{t('farm.farmName')}</label>
            <input id="fm-name" className="input" value={farmName} onChange={(e) => setFarmName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="fm-loc">{t('farm.farmLocation')}</label>
            <div className="flex gap-2">
              <input
                id="fm-loc"
                className="input"
                value={farmSearch}
                onChange={(e) => { setFarmSearch(e.target.value); setFarmLocation(''); geocodeSearch(e.target.value) }}
                placeholder={t('onboarding.farmLocationPlaceholder')}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (p) => {
                        const la = p.coords.latitude
                        const lo = p.coords.longitude
                        setFarmLat(la)
                        setFarmLon(lo)
                        const coordLabel = `${la.toFixed(3)}, ${lo.toFixed(3)}`
                        if (!farmLocation) setFarmLocation(coordLabel)
                        if (!farmSearch) setFarmSearch(coordLabel)
                      },
                      () => setError(t('onboarding.locateError')),
                      { enableHighAccuracy: true, timeout: 15000 },
                    )
                  } else setError(t('onboarding.locateError'))
                }}
                aria-label={t('farm.detectLocation')}
              >
                <MapPinIcon size={18} />
              </Button>
            </div>
            {farmResults.length > 0 && (
              <ul className="mt-2 border rounded-xl divide-y divide-slate-100 bg-white shadow-sm">
                {farmResults.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => {
                        setFarmLat(r.latitude)
                        setFarmLon(r.longitude)
                        setFarmLocation(r.name)
                        setFarmSearch(r.name)
                        setFarmResults([])
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-farm-50 text-sm"
                    >
                      {r.name}{r.admin1 ? `, ${r.admin1}` : ''}{r.country ? ` · ${r.country}` : ''}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <MapPicker lat={farmLat} lon={farmLon} onChange={(la, lo) => { setFarmLat(la); setFarmLon(lo) }} height={240} />
          {error && <p role="alert" className="text-rose-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowFarmModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveFarm} disabled={busy}>{busy ? <Spinner size="sm" /> : t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Field modal */}
      <Modal
        open={showFieldModal}
        onClose={() => setShowFieldModal(false)}
        title={editingFieldId !== null ? t('farm.editField') : t('farm.addField')}
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="fl-name">{t('farm.fieldName')}</label>
            <input id="fl-name" className="input" value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="fl-area">{t('farm.fieldArea')} ({t('farm.labelUnits')})</label>
              <input id="fl-area" type="number" min="0.1" step="any" inputMode="decimal" className="input" value={fieldArea} onChange={(e) => setFieldArea(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="fl-soil">{t('farm.soilType')}</label>
              <select id="fl-soil" className="input" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                {['Loam', 'Clay', 'Sandy', 'Silty', 'Chalky', 'Peaty', 'Sandy Loam', 'Clay Loam', 'Other'].map((s) => (
                  <option key={s} value={s}>{t(`soilTypes.${s}`)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('farm.selectCrop')}</label>
            <select className="input" value={cropId ?? ''} onChange={(e) => setCropId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {crops.filter((c) => c.is_active).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('farm.selectStage')}</label>
            <select className="input" value={stageId ?? ''} onChange={(e) => setStageId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <MapPicker
            lat={fieldLat ?? selectedFarm?.lat ?? 19.076}
            lon={fieldLon ?? selectedFarm?.lon ?? 72.8777}
            onChange={(la, lo) => { setFieldLat(la); setFieldLon(lo) }}
            height={220}
          />
          {error && <p role="alert" className="text-rose-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowFieldModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveField} disabled={busy}>{busy ? <Spinner size="sm" /> : t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
