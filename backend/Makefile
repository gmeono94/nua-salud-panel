# Variables
BINARY_NAME=nua-panel
DB_URL=postgresql://nua:nua_secret@localhost:5432/nua_salud?sslmode=disable
DASHBOARD_DB_URL=postgresql://nua:nua_secret@localhost:5432/nua_dashboard?sslmode=disable
MIGRATIONS_DIR=./internal/core/db/migrations/operational
DASHBOARD_MIGRATIONS_DIR=./internal/core/db/migrations/dashboard

# Desarrollo local con hot reload
.PHONY: dev
dev:
	air

# Compilar binario local
.PHONY: build
build:
	go build -o bin/$(BINARY_NAME) ./cmd/nua-panel

# Compilar para AWS Lambda (linux/amd64)
.PHONY: lambda-build
lambda-build:
	GOOS=linux GOARCH=amd64 go build -o bootstrap ./cmd/nua-panel
	zip bootstrap.zip bootstrap
	rm bootstrap

# Generar código desde queries SQL
.PHONY: sqlc
sqlc:
	sqlc generate

# --- Migraciones DB operativa ---

.PHONY: migrate-up
migrate-up:
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" up

.PHONY: migrate-down
migrate-down:
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" down 1

.PHONY: migrate-create
migrate-create:
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

# --- Migraciones DB dashboard ---

.PHONY: dashboard-migrate-up
dashboard-migrate-up:
	migrate -path $(DASHBOARD_MIGRATIONS_DIR) -database "$(DASHBOARD_DB_URL)" up

.PHONY: dashboard-migrate-down
dashboard-migrate-down:
	migrate -path $(DASHBOARD_MIGRATIONS_DIR) -database "$(DASHBOARD_DB_URL)" down 1

.PHONY: dashboard-migrate-create
dashboard-migrate-create:
	migrate create -ext sql -dir $(DASHBOARD_MIGRATIONS_DIR) -seq $(name)

# Seed de usuarios del dashboard
.PHONY: seed-users
seed-users:
	go run ./cmd/seed/main.go

# Seed de datos operativos desde CSV
.PHONY: seed
seed:
	go run ./cmd/seed-operational/main.go

# Ejecutar tests
.PHONY: test
test:
	go test ./... -v

# Limpiar artefactos de build
.PHONY: clean
clean:
	rm -rf bin/ tmp/ bootstrap.zip
