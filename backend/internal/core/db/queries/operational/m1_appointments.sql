-- name: GetAppointmentsByPeriod :many
-- M1: Citas agrupadas por período con desglose por estado.
-- Agrupa por día, semana o mes según el parámetro @group_by.
SELECT
    CASE
        WHEN @group_by::text = 'day'   THEN to_char(a.date, 'YYYY-MM-DD')
        WHEN @group_by::text = 'week'  THEN to_char(date_trunc('week', a.date), 'YYYY-MM-DD')
        WHEN @group_by::text = 'month' THEN to_char(a.date, 'YYYY-MM')
    END AS period,
    COUNT(*) FILTER (WHERE a.status = 'completada') AS completed,
    COUNT(*) FILTER (WHERE a.status = 'cancelada')  AS cancelled,
    COUNT(*) FILTER (WHERE a.status = 'no_show')    AS no_show,
    COUNT(*) AS total
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
WHERE a.date BETWEEN @date_from::date AND @date_to::date
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = ANY(string_to_array(sqlc.narg('clinic_id')::varchar, ',')))
  AND (sqlc.narg('doctor_id')::varchar IS NULL OR a.doctor_id = sqlc.narg('doctor_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR d.specialty = sqlc.narg('specialty'))
GROUP BY period
ORDER BY period;

-- name: GetAppointmentsSummary :one
-- M1: Totales de KPI para el período seleccionado
SELECT
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE a.status = 'completada') AS completed,
    COUNT(*) FILTER (WHERE a.status = 'cancelada')  AS cancelled,
    COUNT(*) FILTER (WHERE a.status = 'no_show')    AS no_show
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
WHERE a.date BETWEEN @date_from::date AND @date_to::date
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = ANY(string_to_array(sqlc.narg('clinic_id')::varchar, ',')))
  AND (sqlc.narg('doctor_id')::varchar IS NULL OR a.doctor_id = sqlc.narg('doctor_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR d.specialty = sqlc.narg('specialty'));
