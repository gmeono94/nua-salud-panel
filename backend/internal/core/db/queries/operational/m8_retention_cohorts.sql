-- name: GetRetentionCohorts :many
-- M8: Cohortes de retención. Cada cohorte = mes de primera cita completada.
-- Mide cuántos pacientes regresaron en meses +0, +1, +2, etc.
WITH first_visit AS (
    SELECT
        a.patient_id,
        date_trunc('month', MIN(a.date))::date AS cohort_month
    FROM appointments a
    WHERE a.status = 'completada'
      AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
    GROUP BY a.patient_id
),
cohort_activity AS (
    SELECT DISTINCT
        fv.cohort_month,
        fv.patient_id,
        date_trunc('month', a.date)::date AS activity_month
    FROM first_visit fv
    JOIN appointments a ON a.patient_id = fv.patient_id
    WHERE a.status = 'completada'
      AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
)
SELECT
    to_char(ca.cohort_month, 'YYYY-MM') AS cohort,
    (EXTRACT(YEAR FROM age(ca.activity_month, ca.cohort_month)) * 12
      + EXTRACT(MONTH FROM age(ca.activity_month, ca.cohort_month)))::integer AS month_offset,
    COUNT(DISTINCT ca.patient_id)::bigint AS active_patients
FROM cohort_activity ca
WHERE to_char(ca.cohort_month, 'YYYY-MM') >= to_char(@date_from::date, 'YYYY-MM')
  AND to_char(ca.cohort_month, 'YYYY-MM') <= to_char(@date_to::date, 'YYYY-MM')
GROUP BY ca.cohort_month, month_offset
ORDER BY ca.cohort_month, month_offset;

-- name: GetCohortSizes :many
-- M8: Tamaño de cada cohorte (pacientes con primera cita en ese mes)
WITH first_visit AS (
    SELECT
        a.patient_id,
        date_trunc('month', MIN(a.date))::date AS cohort_month
    FROM appointments a
    WHERE a.status = 'completada'
      AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
    GROUP BY a.patient_id
)
SELECT
    to_char(cohort_month, 'YYYY-MM') AS cohort,
    COUNT(*)::bigint AS cohort_size
FROM first_visit
WHERE to_char(cohort_month, 'YYYY-MM') >= to_char(@date_from::date, 'YYYY-MM')
  AND to_char(cohort_month, 'YYYY-MM') <= to_char(@date_to::date, 'YYYY-MM')
GROUP BY cohort_month
ORDER BY cohort_month;
