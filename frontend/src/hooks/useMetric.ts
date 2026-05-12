// Hook genérico para obtener métricas con filtros como query params
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useFilters } from './useFilters'

type FilterKey = 'clinic_id' | 'doctor_id' | 'specialty' | 'dates' | 'group_by'

interface UseMetricOptions {
  // Parámetros extra además de los filtros globales
  extraParams?: Record<string, string>
  // Filtros a incluir (por defecto todos)
  includeFilters?: FilterKey[]
}

interface UseMetricResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

const ALL_FILTERS: FilterKey[] = ['clinic_id', 'doctor_id', 'specialty', 'dates', 'group_by']

// Obtiene datos de una métrica usando los filtros globales
export function useMetric<T>(
  fetcher: (params: Record<string, string>) => Promise<T>,
  options: UseMetricOptions = {}
): UseMetricResult<T> {
  const { filters } = useFilters()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estabilizar referencia del fetcher
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Serializar opciones para detectar cambios reales
  const extraParamsKey = JSON.stringify(options.extraParams ?? {})
  const includeFilters = options.includeFilters ?? ALL_FILTERS

  // Construir los query params según filtros habilitados
  const queryKey = useMemo(() => {
    const params: Record<string, string> = JSON.parse(extraParamsKey)

    if (includeFilters.includes('dates')) {
      params.date_from = filters.date_from
      params.date_to = filters.date_to
    }
    if (includeFilters.includes('clinic_id')) {
      params.clinic_id = filters.clinic_id
    }
    if (includeFilters.includes('doctor_id')) {
      params.doctor_id = filters.doctor_id
    }
    if (includeFilters.includes('specialty')) {
      params.specialty = filters.specialty
    }
    if (includeFilters.includes('group_by')) {
      params.group_by = filters.group_by
    }

    return params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.date_from, filters.date_to, filters.clinic_id,
    filters.doctor_id, filters.specialty, filters.group_by,
    extraParamsKey,
    // includeFilters se pasa como prop estática, no cambia en la práctica
  ])

  const ready = Boolean(filters.date_from && filters.date_to)

  const fetchData = useCallback(async () => {
    if (!ready) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current(queryKey)
      setData(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [queryKey, ready])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
