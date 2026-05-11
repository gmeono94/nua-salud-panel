-- name: GetNewVsReturning :one
-- M3: Pacientes nuevas vs recurrentes en el período.
-- Nueva = su primera cita completada en todo Nua cae dentro del rango.
WITH first_visit AS (
    SELECT patient_id, MIN(date) AS first_date
    FROM appointments
    WHERE status = 'completada'
    GROUP BY patient_id
),
period_patients AS (
    SELECT DISTINCT a.patient_id, fv.first_date
    FROM appointments a
    JOIN first_visit fv ON fv.patient_id = a.patient_id
    WHERE a.status = 'completada'
      AND a.date BETWEEN @date_from::date AND @date_to::date
      AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
)
SELECT
    COUNT(*) FILTER (WHERE first_date BETWEEN @date_from::date AND @date_to::date) AS new_patients,
    COUNT(*) FILTER (WHERE first_date < @date_from::date) AS returning_patients,
    COUNT(*) AS total_patients
FROM period_patients;

-- name: GetNewVsReturningByMonth :many
-- M3: Desglose mensual de nuevas vs recurrentes
WITH first_visit AS (
    SELECT patient_id, MIN(date) AS first_date
    FROM appointments
    WHERE status = 'completada'
    GROUP BY patient_id
)
SELECT
    to_char(a.date, 'YYYY-MM') AS month,
    COUNT(DISTINCT a.patient_id) FILTER (WHERE fv.first_date BETWEEN date_trunc('month', a.date)::date AND (date_trunc('month', a.date) + interval '1 month' - interval '1 day')::date) AS new_patients,
    COUNT(DISTINCT a.patient_id) FILTER (WHERE fv.first_date < date_trunc('month', a.date)::date) AS returning_patients
FROM appointments a
JOIN first_visit fv ON fv.patient_id = a.patient_id
WHERE a.status = 'completada'
  AND a.date BETWEEN @date_from::date AND @date_to::date
  AND (sqlc.narg('clinic_id')::varchar IS NULL OR a.clinic_id = sqlc.narg('clinic_id'))
GROUP BY month
ORDER BY month;
