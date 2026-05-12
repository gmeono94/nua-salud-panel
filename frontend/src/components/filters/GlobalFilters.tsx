// Barra de filtros globales sticky
import { useFilters } from '../../hooks/useFilters'
import SelectFilter from './SelectFilter'
import MultiSelectFilter from './MultiSelectFilter'
import DateRangePicker from './DateRangePicker'

export default function GlobalFilters() {
  const { filters, setFilter, clinics, doctors, specialties } = useFilters()

  // Convertir entre string separado por comas y array para el multi-select
  const selectedClinicIds = filters.clinic_id
    ? filters.clinic_id.split(',')
    : []

  const handleClinicChange = (ids: string[]) => {
    setFilter('clinic_id', ids.join(','))
  }

  const selectedSpecialtyIds = filters.specialty
    ? filters.specialty.split(',')
    : []

  const handleSpecialtyChange = (ids: string[]) => {
    setFilter('specialty', ids.join(','))
  }

  return (
    <div className="sticky top-0 z-30 bg-[#f8f9fc]/80 backdrop-blur-lg border-b border-gray-100 py-4">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap items-end gap-4">
        {/* Clínica — selección múltiple */}
        <MultiSelectFilter
          label="Clínica"
          value={selectedClinicIds}
          onChange={handleClinicChange}
          options={clinics.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Todas las clínicas"
        />

        {/* Doctora */}
        <SelectFilter
          label="Doctora"
          value={filters.doctor_id}
          onChange={(v) => setFilter('doctor_id', v)}
          options={doctors.map((d) => ({
            value: d.id,
            label: `${d.name} — ${d.specialty}`,
          }))}
          placeholder="Todas las doctoras"
        />

        {/* Especialidad — selección múltiple */}
        <MultiSelectFilter
          label="Especialidad"
          value={selectedSpecialtyIds}
          onChange={handleSpecialtyChange}
          options={specialties.map((s) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
          }))}
          placeholder="Todas"
        />

        {/* Rango de fechas con presets */}
        <DateRangePicker />
      </div>
    </div>
  )
}
