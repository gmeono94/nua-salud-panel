// Cliente HTTP base con autenticación (API key + JWT)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
const API_KEY = import.meta.env.VITE_API_KEY || ''

// Referencia al refresher — se inyecta desde AuthProvider para evitar dependencia circular
let tokenRefresher: (() => Promise<string | null>) | null = null
let accessTokenGetter: (() => string | null) | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthHelpers(helpers: {
  getToken: () => string | null
  refresh: () => Promise<string | null>
  onUnauth: () => void
}) {
  accessTokenGetter = helpers.getToken
  tokenRefresher = helpers.refresh
  onUnauthorized = helpers.onUnauth
}

// Realiza un GET al API con API key y JWT
export async function apiFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })
  }

  const headers: Record<string, string> = { 'X-API-Key': API_KEY }
  const token = accessTokenGetter?.()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let response = await fetch(url.toString(), { headers })

  // Si el token expiró, intentar refresh y reintentar una vez
  if (response.status === 401 && tokenRefresher) {
    const newToken = await tokenRefresher()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      response = await fetch(url.toString(), { headers })
    }
  }

  if (response.status === 401) {
    onUnauthorized?.()
    throw new Error('Sesión expirada')
  }

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// --- Filtros ---

import type { Clinic, Doctor } from '../types/api'

export const fetchClinics = () =>
  apiFetch<{ data: Clinic[] }>('/filters/clinics').then((r) => r.data)

export const fetchDoctors = (clinicId?: string) =>
  apiFetch<{ data: Doctor[] }>('/filters/doctors', {
    clinic_id: clinicId || '',
  }).then((r) => r.data)

export const fetchSpecialties = () =>
  apiFetch<{ data: string[] }>('/filters/specialties').then((r) => r.data)

// --- Métricas ---

import type {
  AppointmentsResponse,
  OccupancyResponse,
  PatientsResponse,
  RevenueResponse,
  TopDoctorsResponse,
} from '../types/api'

export const fetchAppointments = (params: Record<string, string>) =>
  apiFetch<AppointmentsResponse>('/metrics/appointments', params)

export const fetchOccupancy = (params: Record<string, string>) =>
  apiFetch<OccupancyResponse>('/metrics/occupancy', params)

export const fetchPatients = (params: Record<string, string>) =>
  apiFetch<PatientsResponse>('/metrics/patients', params)

export const fetchRevenue = (params: Record<string, string>) =>
  apiFetch<RevenueResponse>('/metrics/revenue', params)

export const fetchTopDoctors = (params: Record<string, string>) =>
  apiFetch<TopDoctorsResponse>('/metrics/top-doctors', params)
