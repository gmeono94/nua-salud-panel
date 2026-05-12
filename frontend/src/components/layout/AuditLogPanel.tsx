import { useState, useEffect, useCallback } from 'react'
import { fetchAuditLogs } from '../../services/auditApi'
import type { AuditEntry } from '../../services/auditApi'
import { ACTION_LABELS, ACTION_COLORS, RESOURCE_LABELS } from '../../constants/labels'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFilters(details: Record<string, string> | null): string {
  if (!details) return ''
  const parts: string[] = []
  if (details.clinic_id) parts.push(`Clínica: ${details.clinic_id}`)
  if (details.specialty) parts.push(`Esp: ${details.specialty}`)
  if (details.doctor_id) parts.push(`Doctora: ${details.doctor_id}`)
  if (details.date_from && details.date_to) parts.push(`${details.date_from} → ${details.date_to}`)
  return parts.join(' · ')
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function AuditLogPanel({ open, onClose }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetchAuditLogs({ page: String(p), page_size: '30' })
      setEntries(res.data)
      setPage(p)
    } catch {
      // silenciar si no es admin
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) load(1)
  }, [open, load])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel lateral */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">Bitácora</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              Sin registros de actividad
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {entries.map((e) => (
                <div key={e.id} className="px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[e.action] || 'bg-gray-50 text-gray-600'}`}>
                          {ACTION_LABELS[e.action] || e.action}
                        </span>
                        {e.resource && e.resource !== 'auth' && (
                          <span className="text-xs text-gray-500">
                            {RESOURCE_LABELS[e.resource] || e.resource}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium truncate">
                        {e.user_name || e.user_email || 'Anónimo'}
                      </p>
                      {e.details && Object.keys(e.details).length > 0 && e.action === 'view_metric' && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {formatFilters(e.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5">
                      {formatDate(e.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {entries.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="text-xs font-medium text-violet-600 disabled:text-gray-300 cursor-pointer disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-400">Página {page}</span>
            <button
              onClick={() => load(page + 1)}
              disabled={entries.length < 30}
              className="text-xs font-medium text-violet-600 disabled:text-gray-300 cursor-pointer disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </>
  )
}
