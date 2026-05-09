# Variables
BINARY_NAME=nua-panel
DB_URL=postgresql://nua:nua_secret@localhost:5432/nua_salud?sslmode=disable
MIGRATIONS_DIR=./internal/core/db/migrations

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

# Aplicar migraciones pendientes
.PHONY: migrate-up
migrate-up:
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" up

# Revertir última migración
.PHONY: migrate-down
migrate-down:
	migrate -path $(MIGRATIONS_DIR) -database "$(DB_URL)" down 1

# Crear nueva migración (uso: make migrate-create name=nombre_migracion)
.PHONY: migrate-create
migrate-create:
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $(name)

# Importar datos del CSV a la base de datos
.PHONY: seed
seed:
	go run ./cmd/seed/main.go

# Ejecutar tests
.PHONY: test
test:
	go test ./... -v

# Limpiar artefactos de build
.PHONY: clean
clean:
	rm -rf bin/ tmp/ bootstrap.zip
