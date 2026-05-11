-- name: CreateAuditLog :exec
-- Registrar una acción en la bitácora
INSERT INTO audit_logs (user_id, action, resource, details, ip_address)
VALUES ($1, $2, $3, $4, $5);

-- name: ListAuditLogs :many
-- Listar bitácora con filtros opcionales de usuario y rango de fechas
SELECT al.id, al.user_id, u.name as user_name, u.email as user_email,
       al.action, al.resource, al.details, al.ip_address, al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE (sqlc.narg('user_id')::UUID IS NULL OR al.user_id = sqlc.narg('user_id'))
  AND (sqlc.narg('start_date')::TIMESTAMPTZ IS NULL OR al.created_at >= sqlc.narg('start_date'))
  AND (sqlc.narg('end_date')::TIMESTAMPTZ IS NULL OR al.created_at <= sqlc.narg('end_date'))
ORDER BY al.created_at DESC
LIMIT sqlc.arg('page_size')
OFFSET sqlc.arg('page_offset');
