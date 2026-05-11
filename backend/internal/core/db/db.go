// Inicialización de las conexiones a PostgreSQL.
// Se manejan dos pools separados: uno para datos operativos y otro para el dashboard.
package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

// OperationalPool es la conexión a la DB de datos operativos (citas, clínicas, etc.)
var OperationalPool *pgxpool.Pool

// DashboardPool es la conexión a la DB del dashboard (usuarios, auth, bitácora)
var DashboardPool *pgxpool.Pool

// ConnectOperational establece la conexión al pool de datos operativos.
func ConnectOperational(databaseURL string) {
	var err error
	OperationalPool, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Error conectando a DB operativa: %v", err)
	}
	if err := OperationalPool.Ping(context.Background()); err != nil {
		log.Fatalf("Error verificando conexión a DB operativa: %v", err)
	}
	log.Println("Conexión a DB operativa establecida")
}

// ConnectDashboard establece la conexión al pool del dashboard.
func ConnectDashboard(databaseURL string) {
	var err error
	DashboardPool, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("Error conectando a DB dashboard: %v", err)
	}
	if err := DashboardPool.Ping(context.Background()); err != nil {
		log.Fatalf("Error verificando conexión a DB dashboard: %v", err)
	}
	log.Println("Conexión a DB dashboard establecida")
}

// Close cierra ambos pools de conexiones.
func Close() {
	if OperationalPool != nil {
		OperationalPool.Close()
	}
	if DashboardPool != nil {
		DashboardPool.Close()
	}
}
