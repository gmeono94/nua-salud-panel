-- name: GetUserByEmail :one
-- Buscar usuario por email para el login
SELECT id, email, password_hash, name, role, active, created_at, updated_at
FROM users
WHERE email = $1 AND active = true;

-- name: GetUserByID :one
-- Obtener usuario por ID para el endpoint /auth/me
SELECT id, email, name, role, active, created_at, updated_at
FROM users
WHERE id = $1;

-- name: CreateUser :one
-- Crear nuevo usuario (solo admin puede ejecutar esta acción)
INSERT INTO users (email, password_hash, name, role)
VALUES ($1, $2, $3, $4)
RETURNING id, email, name, role, active, created_at, updated_at;

-- name: UpdateUser :one
-- Actualizar datos de un usuario
UPDATE users
SET name = $2, role = $3, active = $4, updated_at = now()
WHERE id = $1
RETURNING id, email, name, role, active, created_at, updated_at;

-- name: ListUsers :many
-- Listar todos los usuarios para gestión administrativa
SELECT id, email, name, role, active, created_at, updated_at
FROM users
ORDER BY created_at DESC;

-- name: DeleteUser :exec
-- Desactivar usuario (soft delete)
UPDATE users SET active = false, updated_at = now()
WHERE id = $1;
