// Tab Citas: M1 citas por período + M6 cancelación + M2 ocupación
import AppointmentsChart from '../../components/charts/AppointmentsChart'
import CancellationRateChart from '../../components/charts/CancellationRateChart'
import OccupancyChart from '../../components/charts/OccupancyChart'

export default function CitasTab() {
  return (
    <div className="space-y-6">
      <AppointmentsChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CancellationRateChart />
        <OccupancyChart />
      </div>
    </div>
  )
}
