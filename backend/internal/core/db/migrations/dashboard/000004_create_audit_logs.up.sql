-- Tipos de acciones auditables
CREATE TYPE audit_action AS ENUM (
    'login',
    'logout',
    'login_failed',
    'view_metric',
    'export_data',
    'create_user',
    'update_user',
    'delete_user'
);

-- Bitácora de auditoría para trazabilidad de acciones en el dashboard.
-- En un sistema con datos médicos y financieros, saber quién vio qué
-- y cuándo es un requerimiento implícito de compliance.
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
