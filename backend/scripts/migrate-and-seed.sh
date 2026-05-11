#!/bin/sh
set -e

echo "Esperando a que PostgreSQL esté listo..."
until pg_isready -h postgres -p 5432 -U nua -q; do
  sleep 1
done

echo "Ejecutando migraciones operativas..."
migrate -path /app/internal/core/db/migrations/operational \
  -database "postgresql://nua:nua_secret@postgres:5432/nua_salud?sslmode=disable" up

echo "Ejecutando migraciones dashboard..."
migrate -path /app/internal/core/db/migrations/dashboard \
  -database "postgresql://nua:nua_secret@postgres:5432/nua_dashboard?sslmode=disable" up

echo "Seeding datos operativos..."
go run /app/cmd/seed-operational/main.go

echo "Seeding usuarios..."
go run /app/cmd/seed/main.go

echo "Seeding API keys..."
go run /app/cmd/seed-apikeys/main.go

echo "Inicialización completa."
