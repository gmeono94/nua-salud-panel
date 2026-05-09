-- Relación N:N entre usuarios y clínicas.
-- Define qué clínicas puede ver cada clinic_director.
-- admin y strategy ven todas, pero la restricción se aplica a nivel de API, no de DB.
CREATE TABLE user_clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, clinic_id)
);

CREATE INDEX idx_user_clinics_user_id ON user_clinics (user_id);
