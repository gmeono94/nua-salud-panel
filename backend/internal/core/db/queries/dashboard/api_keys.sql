-- name: ValidateAPIKey :one
-- Busca una API key activa por su hash y actualiza last_used
UPDATE api_keys
SET last_used = now()
WHERE key_hash = $1 AND active = true
RETURNING id, name;

-- name: CreateAPIKey :one
-- Crea una nueva API key
INSERT INTO api_keys (name, key_hash)
VALUES ($1, $2)
RETURNING id, name, created_at;
