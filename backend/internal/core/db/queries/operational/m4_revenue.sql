-- name: GetRevenueByClinic :many
-- M4: Ingresos por clínica, desglosados por especialidad del servicio.
-- Filtra por fecha de pago, no fecha de cita.
SELECT
    c.id AS clinic_id,
    c.name AS clinic_name,
    s.specialty::text AS service_specialty,
    SUM(p.amount)::bigint AS revenue
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
JOIN clinics c ON c.id = a.clinic_id
JOIN services s ON s.id = a.service_id
WHERE p.payment_date BETWEEN @date_from::date AND @date_to::date
  AND p.status = 'completado'
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR s.specialty = sqlc.narg('specialty'))
GROUP BY c.id, c.name, s.specialty
ORDER BY c.name, s.specialty;

-- name: GetRevenueSummary :one
-- M4: Total de ingresos en el período
SELECT COALESCE(SUM(p.amount), 0)::bigint AS total_revenue
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
JOIN services s ON s.id = a.service_id
WHERE p.payment_date BETWEEN @date_from::date AND @date_to::date
  AND p.status = 'completado'
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR s.specialty = sqlc.narg('specialty'));
