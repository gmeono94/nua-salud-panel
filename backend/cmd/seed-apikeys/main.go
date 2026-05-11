// Seed de API keys para identificar clientes del backend.
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/settings"
)

type apiKey struct {
	Name     string
	RawKey   string
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No se encontró archivo .env")
	}
	settings.Load()

	pool, err := pgxpool.New(context.Background(), settings.AppSettings.DashboardDBURL)
	if err != nil {
		log.Fatalf("Error conectando a DB dashboard: %v", err)
	}
	defer pool.Close()

	keys := []apiKey{
		{Name: "metrics_dash", RawKey: "nua_mk_d4shb0ard_2025_prod"},
		{Name: "dev_test", RawKey: "nua_mk_d3v_t3st_2025_local"},
	}

	ctx := context.Background()
	for _, k := range keys {
		hash := hashKey(k.RawKey)
		_, err := pool.Exec(ctx,
			`INSERT INTO api_keys (name, key_hash)
			 VALUES ($1, $2)
			 ON CONFLICT (name) DO UPDATE SET key_hash = $2`,
			k.Name, hash,
		)
		if err != nil {
			log.Fatalf("Error creando API key %s: %v", k.Name, err)
		}
		fmt.Printf("  API key creada: %s = %s\n", k.Name, k.RawKey)
	}

	fmt.Println("\nSeed de API keys completado.")
	fmt.Println("Uso: Header X-API-Key en cada request.")
}

func hashKey(key string) string {
	h := sha256.Sum256([]byte(key))
	return hex.EncodeToString(h[:])
}
