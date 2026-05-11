-- name: GetOccupancyByClinic :many
-- M2: Tasa de ocupación por clínica.
-- Recibe días_en_rango precalculado desde Go para evitar aritmética de fechas en sqlc.
WITH clinic_doctors AS (
    SELECT clinic_id, COUNT(*) AS doctor_count
    FROM doctors
    WHERE active = true
    GROUP BY clinic_id
),
booked AS (
    SELECT a.clinic_id, COUNT(*) AS booked_slots
    FROM appointments a
    WHERE a.date BETWEEN sqlc.arg('date_from')::date AND sqlc.arg('date_to')::date
    GROUP BY a.clinic_id
)
SELECT
    c.id AS clinic_id,
    c.name AS clinic_name,
    (c.slots_per_day * sqlc.arg('total_days')::integer * COALESCE(cd.doctor_count, 0))::bigint AS available_slots,
    COALESCE(b.booked_slots, 0)::bigint AS booked_slots,
    CASE
        WHEN (c.slots_per_day * sqlc.arg('total_days')::integer * COALESCE(cd.doctor_count, 0)) = 0 THEN 0::numeric
        ELSE ROUND(COALESCE(b.booked_slots, 0)::numeric / (c.slots_per_day * sqlc.arg('total_days')::integer * COALESCE(cd.doctor_count, 0)) * 100, 1)
    END AS occupancy_rate
FROM clinics c
LEFT JOIN clinic_doctors cd ON cd.clinic_id = c.id
LEFT JOIN booked b ON b.clinic_id = c.id
WHERE c.active = true
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR c.id = sqlc.narg('clinic_id'))
ORDER BY occupancy_rate DESC;
