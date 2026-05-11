-- Extensión para generar UUID v7
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles disponibles en el sistema
CREATE TYPE user_role AS ENUM ('admin', 'strategy', 'clinic_director');

-- Usuarios del dashboard
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'clinic_director',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
