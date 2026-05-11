#!/bin/bash
# Crea la base de datos del dashboard si no existe.
# PostgreSQL ejecuta este script automáticamente al iniciar el contenedor por primera vez.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE nua_dashboard'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nua_dashboard')\gexec
EOSQL
