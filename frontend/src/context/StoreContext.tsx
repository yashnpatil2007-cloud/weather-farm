import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { farmsApi } from '../api'
import { useAuth } from './AuthContext'
import type { Farm, Field } from '../types'

interface StoreContextType {
  farms: Farm[]
  selectedFarm: Farm | null
  selectedField: Field | null
  activeField: Field | undefined
  loading: boolean
  refreshFarms: () => Promise<void>
  selectFarm: (id: number) => void
  selectField: (id: number) => void
  addFarm: (data: { name: string; location: string; lat: number; lon: number }) => Promise<Farm>
  updateFarm: (id: number, data: { name?: string; location?: string; lat?: number; lon?: number }) => Promise<Farm>
  removeFarm: (id: number) => Promise<void>
  addField: (farmId: number, data: Parameters<typeof farmsApi.addField>[1]) => Promise<Field>
  updateField: (id: number, data: Parameters<typeof farmsApi.updateField>[1]) => Promise<Field>
  removeField: (id: number) => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshFarms = async () => {
    setLoading(true)
    try {
      const data = await farmsApi.list()
      setFarms(data)
    } catch {
      setFarms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    setSelectedFarmId(null)
    setSelectedFieldId(null)
    if (!user) {
      setFarms([])
      setLoading(false)
      return
    }
    refreshFarms()
  }, [user?.id, authLoading])

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || farms[0] || null
  const activeField =
    (selectedFarm?.fields ?? []).find((f) => f.id === selectedFieldId) || (selectedFarm?.fields ?? [])[0] || undefined

  const selectFarm = (id: number) => {
    setSelectedFarmId(id)
    setSelectedFieldId(null)
  }

  const selectField = (id: number) => setSelectedFieldId(id)

  const addFarm = async (data: { name: string; location: string; lat: number; lon: number }) => {
    const farm = await farmsApi.create(data)
    setFarms((prev) => [...prev, farm])
    setSelectedFarmId(farm.id)
    return farm
  }

  const updateFarm = async (id: number, data: { name?: string; location?: string; lat?: number; lon?: number }) => {
    const farm = await farmsApi.update(id, data)
    setFarms((prev) => prev.map((f) => (f.id === id ? farm : f)))
    return farm
  }

  const removeFarm = async (id: number) => {
    await farmsApi.delete(id)
    setFarms((prev) => prev.filter((f) => f.id !== id))
    if (selectedFarmId === id) setSelectedFarmId(null)
  }

  const addField = async (farmId: number, data: Parameters<typeof farmsApi.addField>[1]) => {
    const field = await farmsApi.addField(farmId, data)
    setFarms((prev) =>
      prev.map((f) => (f.id === farmId ? { ...f, fields: [...f.fields, field] } : f)),
    )
    setSelectedFieldId(field.id)
    return field
  }

  const updateField = async (id: number, data: Parameters<typeof farmsApi.updateField>[1]) => {
    const field = await farmsApi.updateField(id, data)
    setFarms((prev) =>
      prev.map((f) =>
        f.id === field.farm_id
          ? { ...f, fields: f.fields.map((fl) => (fl.id === id ? field : fl)) }
          : f,
      ),
    )
    return field
  }

  const removeField = async (id: number) => {
    await farmsApi.deleteField(id)
    setFarms((prev) =>
      prev.map((f) => ({ ...f, fields: f.fields.filter((fl) => fl.id !== id) })),
    )
    if (selectedFieldId === id) setSelectedFieldId(null)
  }

  return (
    <StoreContext.Provider
      value={{
        farms,
        selectedFarm,
        selectedField: activeField || null,
        activeField,
        loading,
        refreshFarms,
        selectFarm,
        selectField,
        addFarm,
        updateFarm,
        removeFarm,
        addField,
        updateField,
        removeField,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
