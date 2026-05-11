// Contexto global de filtros con presets de fecha
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import type { ReactNode } from 'react'
import { createElement } from 'react'
import type { GlobalFilterValues, Clinic, Doctor } from '../types/api'
import { fetchClinics, fetchDoctors, fetchSpecialties, fetchDateRange } from '../services/api'

// Presets de fecha disponibles
export type DatePreset =
  | 'all'
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_3_months'
  | 'custom'

interface DataDateRange {
  min_date: string
  max_date: string
}

function getDateRange(preset: DatePreset, dataRange: DataDateRange | null): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  switch (preset) {
    case 'all':
      return dataRange
        ? { from: dataRange.min_date, to: dataRange.max_date }
        : { from: fmt(today), to: fmt(today) }
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
      return dataRange
        ? { from: dataRange.min_date, to: dataRange.max_date }
        : { from: fmt(today), to: fmt(today) }
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
  dataRange: DataDateRange | null
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilterValues>({
    clinic_id: '',
    doctor_id: '',
    specialty: '',
    date_from: '',
    date_to: '',
    group_by: 'month',
  })
  const [activePreset, setActivePreset] = useState<DatePreset>('all')
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [dataRange, setDataRange] = useState<DataDateRange | null>(null)
  const dataRangeRef = useRef<DataDateRange | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [c, s, dr] = await Promise.all([
          fetchClinics(),
          fetchSpecialties(),
          fetchDateRange(),
        ])
        setClinics(c)
        setSpecialties(s)
        setDataRange(dr)
        dataRangeRef.current = dr
        setFilters((prev) => ({
          ...prev,
          date_from: dr.min_date,
          date_to: dr.max_date,
        }))
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

  useEffect(() => {
    const load = async () => {
      try {
        const d = await fetchDoctors(filters.clinic_id || undefined)
        setDoctors(d)
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
      if (key === 'date_from' || key === 'date_to') {
        setActivePreset('custom')
      }
    },
    []
  )

  const setDatePreset = useCallback((preset: DatePreset) => {
    setActivePreset(preset)
    const { from, to } = getDateRange(preset, dataRangeRef.current)
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
        dataRange,
      },
    },
    children
  )
}

export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) {
    throw new Error('useFilters debe usarse dentro de FiltersProvider')
  }
  return ctx
}
