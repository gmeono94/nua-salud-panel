// Tab Ingresos: M4 revenue por clínica/especialidad + M7 ticket promedio
import RevenueChart from '../../components/charts/RevenueChart'
import AvgTicketChart from '../../components/charts/AvgTicketChart'

export default function IngresosTab() {
  return (
    <div className="space-y-6">
      <RevenueChart />
      <AvgTicketChart />
    </div>
  )
}
