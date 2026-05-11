-- name: GetTopDoctors :many
-- M5: Ranking de doctoras por volumen de citas completadas
SELECT
    d.id AS doctor_id,
    d.name AS doctor_name,
    d.specialty::text AS specialty,
    c.name AS clinic_name,
    COUNT(*)::bigint AS completed_appointments
FROM appointments a
JOIN doctors d ON d.id = a.doctor_id
JOIN clinics c ON c.id = d.clinic_id
WHERE a.status = 'completada'
  AND a.date BETWEEN @date_from::date AND @date_to::date
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = ANY(string_to_array(sqlc.narg('clinic_id')::varchar, ',')))
  AND (sqlc.narg('specialty')::specialty IS NULL OR d.specialty = sqlc.narg('specialty'))
GROUP BY d.id, d.name, d.specialty, c.name
ORDER BY completed_appointments DESC
LIMIT 10;
