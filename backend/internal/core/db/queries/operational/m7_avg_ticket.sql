-- name: GetAvgTicket :one
-- M7: Ticket promedio global (monto promedio por cita completada con pago confirmado)
SELECT
    COALESCE(ROUND(AVG(p.amount)::numeric, 0), 0)::bigint AS avg_ticket,
    COUNT(DISTINCT p.appointment_id)::bigint AS paid_appointments,
    COALESCE(SUM(p.amount), 0)::bigint AS total_revenue
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
JOIN services s ON s.id = a.service_id
WHERE a.status = 'completada'
  AND p.status = 'completado'
  AND p.payment_date BETWEEN @date_from::date AND @date_to::date
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR s.specialty = sqlc.narg('specialty'));

-- name: GetAvgTicketByClinic :many
-- M7: Ticket promedio desglosado por clínica
SELECT
    c.id AS clinic_id,
    c.name AS clinic_name,
    COALESCE(ROUND(AVG(p.amount)::numeric, 0), 0)::bigint AS avg_ticket,
    COUNT(DISTINCT p.appointment_id)::bigint AS paid_appointments
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
JOIN clinics c ON c.id = a.clinic_id
JOIN services s ON s.id = a.service_id
WHERE a.status = 'completada'
  AND p.status = 'completado'
  AND p.payment_date BETWEEN @date_from::date AND @date_to::date
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR s.specialty = sqlc.narg('specialty'))
GROUP BY c.id, c.name
ORDER BY avg_ticket DESC;

-- name: GetAvgTicketBySpecialty :many
-- M7: Ticket promedio desglosado por especialidad
SELECT
    s.specialty::text AS specialty,
    COALESCE(ROUND(AVG(p.amount)::numeric, 0), 0)::bigint AS avg_ticket,
    COUNT(DISTINCT p.appointment_id)::bigint AS paid_appointments
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
JOIN services s ON s.id = a.service_id
WHERE a.status = 'completada'
  AND p.status = 'completado'
  AND p.payment_date BETWEEN @date_from::date AND @date_to::date
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR s.specialty = sqlc.narg('specialty'))
GROUP BY s.specialty
ORDER BY avg_ticket DESC;
