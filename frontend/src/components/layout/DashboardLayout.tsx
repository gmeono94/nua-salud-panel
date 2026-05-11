// Layout principal del dashboard
import type { ReactNode } from 'react'
import Header from './Header'
import GlobalFilters from '../filters/GlobalFilters'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Header />
      <GlobalFilters />
      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {children}
      </main>
    </div>
  )
}
