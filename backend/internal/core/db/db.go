// Inicialización de la conexión a PostgreSQL y ejecución de migraciones.
package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool es la conexión compartida a PostgreSQL.
var Pool *pgxpool.Pool

// Connect establece la conexión a PostgreSQL usando un pool de conexiones.
func Connect(databaseURL string) {
	var err error
	Pool, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Error conectando a PostgreSQL: %v", err)
	}

	// Verificar que la conexión funcione
	if err := Pool.Ping(context.Background()); err != nil {
		log.Fatalf("Error verificando conexión a PostgreSQL: %v", err)
	}

	log.Println("Conexión a PostgreSQL establecida")
}

// Close cierra el pool de conexiones.
func Close() {
	if Pool != nil {
		Pool.Close()
	}
}
