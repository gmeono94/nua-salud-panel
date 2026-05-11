// Resumen: mini-gráficas clickables que navegan a cada sección
import { useNavigate } from 'react-router-dom'
import AppointmentsChart from '../../components/charts/AppointmentsChart'
import CancellationRateChart from '../../components/charts/CancellationRateChart'
import PatientsChart from '../../components/charts/PatientsChart'
import RevenueChart from '../../components/charts/RevenueChart'
import TopDoctorsChart from '../../components/charts/TopDoctorsChart'

function ClickableSection({
  to,
  children,
}: {
  to: string
  children: React.ReactNode
}) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(to)}
      className="cursor-pointer group"
    >
      <div className="group-hover:ring-2 group-hover:ring-violet-200 rounded-2xl transition-all">
        {children}
      </div>
      <p className="text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-right pr-2">
        Ver detalle
      </p>
    </div>
  )
}

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClickableSection to="/citas">
          <AppointmentsChart mini />
        </ClickableSection>
        <ClickableSection to="/citas">
          <CancellationRateChart mini />
        </ClickableSection>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClickableSection to="/pacientes">
          <PatientsChart mini />
        </ClickableSection>
        <ClickableSection to="/ingresos">
          <RevenueChart mini />
        </ClickableSection>
      </div>

      <ClickableSection to="/equipo">
        <TopDoctorsChart mini />
      </ClickableSection>
    </div>
  )
}
