// Tab Pacientes: M3 nuevas vs recurrentes + M8 cohortes de retención
import PatientsChart from '../../components/charts/PatientsChart'
import RetentionCohortsChart from '../../components/charts/RetentionCohortsChart'

export default function PacientesTab() {
  return (
    <div className="space-y-6">
      <PatientsChart />
      <RetentionCohortsChart />
    </div>
  )
}
