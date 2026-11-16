import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../components/Button'
import Card from '../components/Card'
import { useStore } from '../context/StoreContext'
import { cropsApi, weatherApi, type GeocodeResult } from '../api'
import type { Crop, CropGrowthStage } from '../types'
import Spinner from '../components/Spinner'

export default function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addFarm, addField, refreshFarms } = useStore()
  const [step, setStep] = useState(1)
  const totalSteps = 4

  // Farm fields
  const [farmName, setFarmName] = useState('')
  const [farmLocation, setFarmLocation] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [locateError, setLocateError] = useState('')
  const [locating, setLocating] = useState(false)

  // Field fields
  const [fieldName, setFieldName] = useState('')
  const [fieldArea, setFieldArea] = useState('')
  const [soilType, setSoilType] = useState('Loam')
  const [crops, setCrops] = useState<Crop[]>([])
  const [stages, setStages] = useState<CropGrowthStage[]>([])
  const [cropId, setCropId] = useState<number | null>(null)
  const [stageId, setStageId] = useState<number | null>(null)
  const [cropSearch, setCropSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    cropsApi.list().then(setCrops).catch(() => setCrops([]))
    cropsApi.growthStages().then(setStages).catch(() => setStages([]))
  }, [])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (search.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await weatherApi.geocode(search)
        setResults(r)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const useMyLocation = () => {
    setLocating(true)
    setLocateError('')
    if (!('geolocation' in navigator)) {
      setLocateError(t('onboarding.locateError'))
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude
        const lo = pos.coords.longitude
        setLat(la)
        setLon(lo)
        setLocating(false)
        try {
          const r = await weatherApi.geocode(`${lo.toFixed(4)},${la.toFixed(4)}`)
          if (r.length) {
            setFarmLocation(r[0].name)
            setFarmName(r[0].name)
          } else {
            setFarmLocation(`${la.toFixed(3)}, ${lo.toFixed(3)}`)
          }
        } catch {
          setFarmLocation(`${la.toFixed(3)}, ${lo.toFixed(3)}`)
        }
      },
      () => {
        setLocateError(t('onboarding.locateError'))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const pickResult = (r: GeocodeResult) => {
    setLat(r.latitude)
    setLon(r.longitude)
    setFarmLocation(r.name)
    if (!farmName) setFarmName(r.name)
    setResults([])
    setSearch(r.name)
  }

  const canGoNext = () => {
    if (step === 1) return lat !== null && lon !== null && farmName.trim().length > 0
    if (step === 2) return fieldName.trim().length > 0 && cropId !== null && stageId !== null
    return true
  }

  const handleNext = async () => {
    if (step === 1) {
      // create farm
      setSaving(true)
      try {
        const farm = await addFarm({
          name: farmName,
          location: farmLocation || search || 'My farm',
          lat: lat!,
          lon: lon!,
        })
        setFarmIdForStep(farm.id)
        setStep(2)
      } catch {
        /* keep user on step */
      } finally {
        setSaving(false)
      }
    } else if (step === 2) {
      // save field now
      setSaving(true)
      try {
        await plantField()
        setStep(3)
      } catch {
        /* keep user on step */
      } finally {
        setSaving(false)
      }
    } else if (step === 3) {
      setStep(4)
    } else {
      await refreshFarms()
      navigate('/', { replace: true })
    }
  }

  // track farm id for field creation
  const farmIdRef = useRef<number | null>(null)
  const setFarmIdForStep = (id: number) => {
    farmIdRef.current = id
  }

  const plantField = async () => {
    if (!farmIdRef.current || cropId === null || stageId === null) return null
    try {
      const field = await addField(farmIdRef.current, {
        name: fieldName || 'Main field',
        size_hectares: parseFloat(fieldArea) || 1,
        soil_type: soilType,
        lat: lat ?? undefined,
        lon: lon ?? undefined,
        crop_id: cropId,
        growth_stage_id: stageId,
      })
      return field
    } catch {
      return null
    }
  }

  const cropsFiltered = cropSearch
    ? crops.filter((c) => c.name.toLowerCase().includes(cropSearch.toLowerCase()))
    : crops

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2" aria-hidden="true">🌾</div>
          <h1 className="text-2xl font-bold text-gray-800">{t('onboarding.title')}</h1>
          <p className="text-gray-500 mt-1">{t('onboarding.subtitle')}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-1 mb-8" aria-label={`${t('onboarding.step')} ${step} ${t('onboarding.of')} ${totalSteps}`}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 max-w-16 rounded-full transition-colors ${i + 1 <= step ? 'bg-farm-600' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mb-6">
          {t('onboarding.step')} {step} {t('onboarding.of')} {totalSteps}
        </p>

        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="label" htmlFor="farmName">{t('onboarding.farmName')}</label>
                <input
                  id="farmName"
                  className="input"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder={t('onboarding.farmNamePlaceholder')}
                />
              </div>

              <div>
                <label className="label" htmlFor="farmLocation">{t('onboarding.farmLocation')}</label>
                <div className="flex gap-2">
                  <input
                    id="farmLocation"
                    className="input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('onboarding.farmLocationPlaceholder')}
                    aria-label={t('onboarding.farmLocation')}
                  />
                  <Button
                    variant="secondary"
                    onClick={useMyLocation}
                    disabled={locating}
                    aria-label={t('onboarding.detectLocation')}
                  >
                    {locating ? '…' : '📍'}
                  </Button>
                </div>
                {searching && <p className="text-sm text-gray-500 mt-1">{t('common.loading')}</p>}
                {results.length > 0 && (
                  <ul className="mt-2 border border-gray-200 rounded-xl divide-y divide-gray-100 bg-white shadow-sm">
                    {results.map((r, i) => (
                      <li key={i}>
                        <button onClick={() => pickResult(r)} className="w-full text-left px-4 py-3 hover:bg-farm-50 text-sm">
                          {r.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {locateError && (
                  <p role="alert" className="text-red-600 text-sm mt-2">{locateError}</p>
                )}
                {lat !== null && lon !== null && (
                  <p className="text-sm text-farm-700 mt-2 flex items-center gap-2">
                    <span aria-hidden="true">📍</span>
                    {farmLocation} <span className="text-gray-400">({lat.toFixed(3)}, {lon.toFixed(3)})</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="label" htmlFor="fieldName">{t('onboarding.fieldName')}</label>
                <input
                  id="fieldName"
                  className="input"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder={t('onboarding.fieldNamePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="fieldArea">{t('onboarding.fieldArea')}</label>
                  <input
                    id="fieldArea"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    className="input"
                    value={fieldArea}
                    onChange={(e) => setFieldArea(e.target.value)}
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="soilType">{t('onboarding.soilType')}</label>
                  <select
                    id="soilType"
                    className="input"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                  >
                    {['Loam', 'Clay', 'Sandy', 'Silty', 'Chalky', 'Peaty', 'Sandy Loam', 'Clay Loam', 'Other'].map((s) => (
                      <option key={s} value={s}>{t(`soilTypes.${s}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="cropSearch">{t('onboarding.crop')}</label>
                <input
                  id="cropSearch"
                  className="input"
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  placeholder={t('onboarding.searchCrop')}
                />
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                  {cropsFiltered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCropId(c.id)}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-medium ${cropId === c.id ? 'border-farm-600 bg-farm-50 text-farm-700' : 'border-gray-200 hover:border-farm-300'}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{t('onboarding.growthStage')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {stages.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStageId(s.id)}
                      className={`rounded-xl border-2 px-3 py-2 text-sm font-medium ${stageId === s.id ? 'border-farm-600 bg-farm-50 text-farm-700' : 'border-gray-200 hover:border-farm-300'}`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {!(cropId !== null && stageId !== null) && (
                <p className="text-sm text-gray-500">{t('errors.required')}</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="text-6xl" aria-hidden="true">✅</div>
              <h2 className="text-xl font-bold text-gray-800">You're all set up!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                We'll now pull live local weather for your farm and turn it into simple daily guidance.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4 py-4">
              <div className="text-6xl" aria-hidden="true">🌦️</div>
              <h2 className="text-xl font-bold text-gray-800">Loading your daily guidance…</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                This may take a moment on the first load.
              </p>
              <Spinner />
            </div>
          )}
        </Card>

        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>← {t('onboarding.back')}</Button>
          ) : <div />}
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext() || saving}
            >
              {saving ? <Spinner size="sm" /> : `${t('onboarding.next')} →`}
            </Button>
          ) : (
            <Button onClick={handleNext}>{t('onboarding.finish')} →</Button>
          )}
        </div>
      </div>
    </div>
  )
}
