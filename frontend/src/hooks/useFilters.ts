// Contexto global de filtros con presets de fecha
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import type { GlobalFilterValues, Clinic, Doctor } from '../types/api'
import { fetchClinics, fetchDoctors, fetchSpecialties } from '../services/api'

// Presets de fecha disponibles
export type DatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_3_months'
  | 'custom'

// Calcula las fechas según el preset seleccionado
function getDateRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { from: fmt(today), to: fmt(today) }
    case 'this_week': {
      const monday = new Date(today)
      const day = monday.getDay()
      const diff = day === 0 ? 6 : day - 1
      monday.setDate(monday.getDate() - diff)
      return { from: fmt(monday), to: fmt(today) }
    }
    case 'this_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: fmt(first), to: fmt(today) }
    }
    case 'last_3_months': {
      const threeMonths = new Date(today)
      threeMonths.setMonth(threeMonths.getMonth() - 3)
      return { from: fmt(threeMonths), to: fmt(today) }
    }
    default:
      return { from: '2025-01-01', to: '2025-02-28' }
  }
}

interface FiltersContextValue {
  filters: GlobalFilterValues
  setFilter: <K extends keyof GlobalFilterValues>(
    key: K,
    value: GlobalFilterValues[K]
  ) => void
  setDatePreset: (preset: DatePreset) => void
  activePreset: DatePreset
  clinics: Clinic[]
  doctors: Doctor[]
  specialties: string[]
  loadingFilters: boolean
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

// Rango por defecto: coincide con los datos dummy del backend
const DEFAULT_FILTERS: GlobalFilterValues = {
  clinic_id: '',
  doctor_id: '',
  specialty: '',
  date_from: '2025-01-01',
  date_to: '2025-02-28',
  group_by: 'month',
}

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilterValues>(DEFAULT_FILTERS)
  const [activePreset, setActivePreset] = useState<DatePreset>('custom')
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  // Cargar catálogos de filtros al montar
  useEffect(() => {
    const load = async () => {
      try {
        const [c, s] = await Promise.all([fetchClinics(), fetchSpecialties()])
        setClinics(c)
        setSpecialties(s)
        // Cargar doctoras sin filtro de clínica
        const d = await fetchDoctors()
        setDoctors(d)
      } catch (err) {
        console.error('Error cargando filtros:', err)
      } finally {
        setLoadingFilters(false)
      }
    }
    load()
  }, [])

  // Recargar doctoras cuando cambia la clínica
  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetchDoctors(filters.clinic_id || undefined)
        setDoctors(d)
        // Si la doctora seleccionada no pertenece a la nueva clínica, limpiar
        if (
          filters.doctor_id &&
          !d.some((doc) => doc.id === filters.doctor_id)
        ) {
          setFilters((prev) => ({ ...prev, doctor_id: '' }))
        }
      } catch (err) {
        console.error('Error cargando doctoras:', err)
      }
    }
    load()
  }, [filters.clinic_id, filters.doctor_id])

  const setFilter = useCallback(
    <K extends keyof GlobalFilterValues>(
      key: K,
      value: GlobalFilterValues[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
      // Si cambian las fechas manualmente, marcar como personalizado
      if (key === 'date_from' || key === 'date_to') {
        setActivePreset('custom')
      }
    },
    []
  )

  const setDatePreset = useCallback((preset: DatePreset) => {
    setActivePreset(preset)
    const { from, to } = getDateRange(preset)
    setFilters((prev) => ({ ...prev, date_from: from, date_to: to }))
  }, [])

  return createElement(
    FiltersContext.Provider,
    {
      value: {
        filters,
        setFilter,
        setDatePreset,
        activePreset,
        clinics,
        doctors,
        specialties,
        loadingFilters,
      },
    },
    children
  )
}

// Hook para consumir el contexto de filtros
export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) {
    throw new Error('useFilters debe usarse dentro de FiltersProvider')
  }
  return ctx
}
