export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administradora',
  strategy: 'Estrategia',
  clinic_director: 'Directora de Clínica',
}

export const ACTION_LABELS: Record<string, string> = {
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  login_failed: 'Login fallido',
  view_metric: 'Vista de reporte',
  export_data: 'Exportación',
  create_user: 'Crear usuario',
  update_user: 'Editar usuario',
  delete_user: 'Eliminar usuario',
}

export const ACTION_COLORS: Record<string, string> = {
  login: 'bg-emerald-50 text-emerald-700',
  logout: 'bg-gray-50 text-gray-600',
  login_failed: 'bg-rose-50 text-rose-700',
  view_metric: 'bg-violet-50 text-violet-700',
  export_data: 'bg-amber-50 text-amber-700',
}

export const RESOURCE_LABELS: Record<string, string> = {
  appointments: 'Citas',
  occupancy: 'Ocupación',
  patients: 'Pacientes',
  revenue: 'Ingresos',
  'top-doctors': 'Top Doctoras',
  'cancellation-rate': 'Cancelación',
  'avg-ticket': 'Ticket Promedio',
  'retention-cohorts': 'Retención',
  auth: 'Autenticación',
}
