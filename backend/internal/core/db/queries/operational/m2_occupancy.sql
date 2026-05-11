-- name: GetOccupancyByClinic :many
-- M2: Ocupación por clínica. slots_per_day es la capacidad total de la clínica.
WITH booked AS (
    SELECT a.clinic_id, COUNT(*) AS booked_slots
    FROM appointments a
    WHERE a.date BETWEEN sqlc.arg('date_from')::date AND sqlc.arg('date_to')::date
    GROUP BY a.clinic_id
)
SELECT
    c.id AS clinic_id,
    c.name AS clinic_name,
    (c.slots_per_day * sqlc.arg('total_days')::integer)::bigint AS available_slots,
    COALESCE(b.booked_slots, 0)::bigint AS booked_slots,
    CASE
        WHEN c.slots_per_day * sqlc.arg('total_days')::integer = 0 THEN 0::numeric
        ELSE ROUND(COALESCE(b.booked_slots, 0)::numeric / (c.slots_per_day * sqlc.arg('total_days')::integer) * 100, 1)
    END AS occupancy_rate
FROM clinics c
LEFT JOIN booked b ON b.clinic_id = c.id
WHERE c.active = true
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR c.id = ANY(string_to_array(sqlc.narg('clinic_id')::varchar, ',')))
ORDER BY occupancy_rate DESC;

-- name: GetOccupancyByDoctor :many
-- M2: Ocupación por doctora. Cada doctora recibe slots_per_day / doctoras_activas de su clínica.
WITH doctor_slots AS (
    SELECT
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.specialty::text AS specialty,
        c.id AS clinic_id,
        c.name AS clinic_name,
        CASE
            WHEN COUNT(*) OVER (PARTITION BY d.clinic_id) = 0 THEN 0
            ELSE c.slots_per_day / COUNT(*) OVER (PARTITION BY d.clinic_id)
        END AS slots_per_doctor
    FROM doctors d
    JOIN clinics c ON c.id = d.clinic_id
    WHERE d.active = true
),
booked AS (
    SELECT a.doctor_id, COUNT(*) AS booked_slots
    FROM appointments a
    WHERE a.date BETWEEN sqlc.arg('date_from')::date AND sqlc.arg('date_to')::date
    GROUP BY a.doctor_id
)
SELECT
    ds.doctor_id,
    ds.doctor_name,
    ds.specialty,
    ds.clinic_id,
    ds.clinic_name,
    (ds.slots_per_doctor * sqlc.arg('total_days')::integer)::bigint AS available_slots,
    COALESCE(b.booked_slots, 0)::bigint AS booked_slots,
    CASE
        WHEN ds.slots_per_doctor * sqlc.arg('total_days')::integer = 0 THEN 0::numeric
        ELSE ROUND(COALESCE(b.booked_slots, 0)::numeric / (ds.slots_per_doctor * sqlc.arg('total_days')::integer) * 100, 1)
    END AS occupancy_rate
FROM doctor_slots ds
LEFT JOIN booked b ON b.doctor_id = ds.doctor_id
WHERE (sqlc.narg('clinic_id')::varchar IS NULL OR ds.clinic_id = ANY(string_to_array(sqlc.narg('clinic_id')::varchar, ',')))
  AND (sqlc.narg('specialty')::specialty IS NULL OR ds.specialty::specialty = sqlc.narg('specialty'))
ORDER BY occupancy_rate DESC;
