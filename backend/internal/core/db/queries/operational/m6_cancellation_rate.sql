-- name: GetCancellationRateByPeriod :many
-- M6: Tasa de cancelación/no-show por período (excluye agendadas del denominador)
SELECT
    CASE
        WHEN @group_by::text = 'day'   THEN to_char(a.date, 'YYYY-MM-DD')
        WHEN @group_by::text = 'week'  THEN to_char(date_trunc('week', a.date), 'YYYY-MM-DD')
        WHEN @group_by::text = 'month' THEN to_char(a.date, 'YYYY-MM')
    END AS period,
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE a.status IN ('cancelada', 'no_show'))::bigint AS lost,
    CASE
        WHEN COUNT(*) = 0 THEN 0::numeric
        ELSE ROUND(COUNT(*) FILTER (WHERE a.status IN ('cancelada', 'no_show'))::numeric / COUNT(*) * 100, 1)
    END AS lost_rate
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
WHERE a.date BETWEEN @date_from::date AND @date_to::date
  AND a.status != 'agendada'
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = ANY(string_to_array(sqlc.narg('clinic_id')::varchar, ',')))
  AND (sqlc.narg('doctor_id')::varchar IS NULL OR a.doctor_id = sqlc.narg('doctor_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR d.specialty = sqlc.narg('specialty'))
GROUP BY period
ORDER BY period;

-- name: GetCancellationRateSummary :one
-- M6: Tasa global de cancelación/no-show en el período
SELECT
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE a.status = 'cancelada')::bigint AS cancelled,
    COUNT(*) FILTER (WHERE a.status = 'no_show')::bigint AS no_show,
    CASE
        WHEN COUNT(*) = 0 THEN 0::numeric
        ELSE ROUND(COUNT(*) FILTER (WHERE a.status IN ('cancelada', 'no_show'))::numeric / COUNT(*) * 100, 1)
    END AS lost_rate
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
WHERE a.date BETWEEN @date_from::date AND @date_to::date
  AND a.status != 'agendada'
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = ANY(string_to_array(sqlc.narg('clinic_id')::varchar, ',')))
  AND (sqlc.narg('doctor_id')::varchar IS NULL OR a.doctor_id = sqlc.narg('doctor_id'))
  AND (sqlc.narg('specialty')::specialty IS NULL OR d.specialty = sqlc.narg('specialty'));
