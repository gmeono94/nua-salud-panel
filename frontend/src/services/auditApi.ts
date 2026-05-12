import { apiFetch } from './api'

export interface AuditEntry {
  id: string
  user_name: string
  user_email: string
  action: string
  resource: string
  details: Record<string, string> | null
  ip: string
  created_at: string
}

interface AuditResponse {
  data: AuditEntry[]
  page: number
  page_size: number
}

export function fetchAuditLogs(params: Record<string, string> = {}) {
  return apiFetch<AuditResponse>('/audit-logs', params)
}
