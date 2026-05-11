-- name: ListClinics :many
-- Clínicas activas para el selector de filtros
SELECT id, name FROM clinics WHERE active = true ORDER BY name;

-- name: ListDoctors :many
-- Doctoras activas, opcionalmente filtradas por clínica
SELECT d.id, d.name, d.specialty, d.clinic_id
FROM doctors d
WHERE d.active = true
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR d.clinic_id = sqlc.narg('clinic_id'))
ORDER BY d.name;

-- name: ListSpecialties :many
-- Especialidades disponibles en servicios
SELECT DISTINCT specialty FROM services WHERE active = true ORDER BY specialty;
