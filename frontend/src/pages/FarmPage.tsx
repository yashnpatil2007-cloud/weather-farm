import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../context/StoreContext'
import { cropsApi, weatherApi, type GeocodeResult } from '../api'
import type { Crop, CropGrowthStage, Farm } from '../types'
import Card from '../components/Card'
import Button from '../components/Button'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import MapPicker from '../components/MapPicker'

export default function FarmPage() {
  const { t } = useTranslation()
  const {
    farms,
    selectedFarm,
    selectedField,
    selectFarm,
    addFarm,
    updateFarm,
    removeFarm,
    refreshFarms,
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
    setError('')
    setShowFarmModal(true)
  }

  const saveFarm = async () => {
    setBusy(true)
    setError('')
    try {
      if (editingFarmId !== null) {
        await updateFarm(editingFarmId, {
          name: farmName,
          location: farmLocation || farmSearch,
          lat: farmLat,
          lon: farmLon,
        })
      } else {
        await addFarm({
          name: farmName,
          location: farmLocation || farmSearch || 'My farm',
          lat: farmLat,
          lon: farmLon,
        })
      }
      setShowFarmModal(false)
    } catch {
      setError(t('errors.server'))
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
    setBusy(true)
    setError('')
    try {
      const payload = {
        name: fieldName,
        size_hectares: parseFloat(fieldArea) || 1,
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
    } catch {
      setError(t('errors.server'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('farm.title')}</h1>
          <p className="text-gray-500 mt-1">{t('farm.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openAddField} disabled={!selectedFarm}>+ {t('farm.addField')}</Button>
          <Button variant="secondary" onClick={openAddFarm}>+ {t('farm.addFarm')}</Button>
        </div>
      </header>

      {/* Farm selector */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('farm.farm')}>
        {farms.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={selectedFarm?.id === f.id}
            onClick={() => selectFarm(f.id)}
            className={`whitespace-nowrap rounded-xl border-2 px-4 py-2 font-medium ${selectedFarm?.id === f.id ? 'border-farm-600 bg-farm-50 text-farm-700' : 'border-gray-200 text-gray-600 hover:border-farm-300'}`}
          >
            🌾 {f.name}
          </button>
        ))}
      </div>

      {selectedFarm ? (
        <>
          {/* Farm card with map */}
          <Card>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-800">🌾 {selectedFarm.name}</h2>
                <p className="text-gray-500 text-sm inline-flex items-center gap-1">
                  <span aria-hidden="true">📍</span> {selectedFarm.location}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditFarm(selectedFarm)}>{t('farm.edit')}</Button>
                <Button variant="ghost" size="sm" onClick={() => { void removeFarm(selectedFarm.id) }} className="text-red-600 hover:bg-red-50">{t('farm.delete')}</Button>
              </div>
            </div>
            <MapPicker lat={selectedFarm.lat} lon={selectedFarm.lon} onChange={() => {}} interactive={false} height={220} />
          </Card>

          {/* Fields */}
          <h2 className="text-lg font-bold text-gray-800 mt-2">{t('farm.fields')} ({selectedFarm.fields.length})</h2>
          {selectedFarm.fields.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-4xl mb-2" aria-hidden="true">🌱</div>
              <p className="text-gray-500 mb-4">{t('farm.noFields')}</p>
              <Button onClick={openAddField}>+ {t('farm.addField')}</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedFarm.fields.map((f) => (
                <Card key={f.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800">🌾 {f.name}</h3>
                      {f.crop && (
                        <p className="text-sm text-farm-700 font-medium mt-1">
                          🌱 {f.crop.name}
                          {f.growth_stage && <span className="text-gray-500"> · {f.growth_stage.name}</span>}
                        </p>
                      )}
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>📐 {t('farm.area')}: {(f.size_hectares / 0.404686).toFixed(2)} {t('farm.labelUnits')}</p>
                        <p>🧱 {t('farm.soilType')}: {t(`soilTypes.${f.soil_type}`)}</p>
                        {f.lat && <p>📍 {f.lat.toFixed(3)}, {f.lon?.toFixed(3)}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={(e) => { e.stopPropagation(); openEditField(f.id) }} className="text-sm text-farm-700 underline">{t('farm.edit')}</button>
                      <button onClick={async (e) => { e.stopPropagation(); await removeField(f.id) }} className="text-sm text-red-500 underline">{t('farm.delete')}</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-10">
          <div className="text-5xl mb-3" aria-hidden="true">🌾</div>
          <p className="text-gray-500 mb-4">{t('dashboard.noField')}</p>
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
                      (p) => { setFarmLat(p.coords.latitude); setFarmLon(p.coords.longitude); },
                      () => setError(t('onboarding.locateError')),
                      { enableHighAccuracy: true, timeout: 15000 },
                    )
                  } else setError(t('onboarding.locateError'))
                }}
                aria-label={t('farm.detectLocation')}
              >📍</Button>
            </div>
            {farmResults.length > 0 && (
              <ul className="mt-2 border rounded-xl divide-y divide-gray-100 bg-white shadow-sm">
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
                      {r.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <MapPicker lat={farmLat} lon={farmLon} onChange={(la, lo) => { setFarmLat(la); setFarmLon(lo) }} height={260} />
          {farmSearch && !farmLocation && (
            <p className="text-sm text-farm-700">📍 {farmSearch}</p>
          )}
          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
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
              <input id="fl-area" type="number" inputMode="decimal" className="input" value={fieldArea} onChange={(e) => setFieldArea(e.target.value)} />
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
          {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowFieldModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveField} disabled={busy}>{busy ? <Spinner size="sm" /> : t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
