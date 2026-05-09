-- name: GetClinicIDsByUserID :many
-- Obtener las clínicas asignadas a un usuario (para clinic_director)
SELECT clinic_id
FROM user_clinics
WHERE user_id = $1;

-- name: AssignClinicToUser :exec
-- Asignar una clínica a un usuario
INSERT INTO user_clinics (user_id, clinic_id)
VALUES ($1, $2)
ON CONFLICT (user_id, clinic_id) DO NOTHING;

-- name: RemoveClinicsFromUser :exec
-- Remover todas las clínicas asignadas a un usuario (para reasignación)
DELETE FROM user_clinics
WHERE user_id = $1;
