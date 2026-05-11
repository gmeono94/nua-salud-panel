// Página principal del dashboard con layout de métricas
import DashboardLayout from '../components/layout/DashboardLayout'
import AppointmentsChart from '../components/charts/AppointmentsChart'
import OccupancyChart from '../components/charts/OccupancyChart'
import PatientsChart from '../components/charts/PatientsChart'
import RevenueChart from '../components/charts/RevenueChart'
import TopDoctorsChart from '../components/charts/TopDoctorsChart'

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* M1 - Citas: ancho completo (KPIs + área) */}
      <AppointmentsChart />

      {/* M2 Ocupación (izq) | M3 Pacientes (der) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyChart />
        <PatientsChart />
      </div>

      {/* M4 Ingresos (izq) | M5 Top Doctoras (der) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <TopDoctorsChart />
      </div>
    </DashboardLayout>
  )
}
