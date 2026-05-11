-- name: CreateRefreshToken :exec
-- Almacenar un nuevo refresh token
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3);

-- name: GetRefreshToken :one
-- Buscar refresh token por hash para validación
SELECT id, user_id, token_hash, expires_at, revoked, created_at
FROM refresh_tokens
WHERE token_hash = $1 AND revoked = false AND expires_at > now();

-- name: RevokeRefreshToken :exec
-- Revocar un refresh token específico (logout)
UPDATE refresh_tokens SET revoked = true
WHERE token_hash = $1;

-- name: RevokeAllUserTokens :exec
-- Revocar todos los refresh tokens de un usuario (cambio de password, seguridad)
UPDATE refresh_tokens SET revoked = true
WHERE user_id = $1;
