// Layout principal con KPIs globales y navegación por tabs
import { Outlet } from 'react-router-dom'
import Header from './Header'
import GlobalFilters from '../filters/GlobalFilters'
import KpiSummaryBar from './KpiSummaryBar'
import TabNavigation from './TabNavigation'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Header />
      <GlobalFilters />
      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        <KpiSummaryBar />
        <TabNavigation />
        <Outlet />
      </main>
    </div>
  )
}
