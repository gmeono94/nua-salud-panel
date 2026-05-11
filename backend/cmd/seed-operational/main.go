// Seed de datos operativos desde archivos CSV.
// Carga clínicas, doctoras, pacientes, servicios, citas y pagos en la DB operacional.
package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/settings"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No se encontró archivo .env")
	}
	settings.Load()

	pool, err := pgxpool.New(context.Background(), settings.AppSettings.DatabaseURL)
	if err != nil {
		log.Fatalf("Error conectando a DB operacional: %v", err)
	}
	defer pool.Close()

	ctx := context.Background()
	dataDir := resolveDataDir()

	// Orden de carga respeta las foreign keys
	tables := []struct {
		file  string
		query string
	}{
		{"clinicas.csv", `INSERT INTO clinics (id, name, active, slots_per_day) VALUES ($1, $2, $3::boolean, $4::integer) ON CONFLICT (id) DO NOTHING`},
		{"doctoras.csv", `INSERT INTO doctors (id, name, specialty, clinic_id, active) VALUES ($1, $2, $3::specialty, $4, $5::boolean) ON CONFLICT (id) DO NOTHING`},
		{"pacientes.csv", `INSERT INTO patients (id, birth_date) VALUES ($1, $2::date) ON CONFLICT (id) DO NOTHING`},
		{"servicios.csv", `INSERT INTO services (id, name, specialty, price, active) VALUES ($1, $2, $3::specialty, $4::integer, $5::boolean) ON CONFLICT (id) DO NOTHING`},
		{"citas.csv", `INSERT INTO appointments (id, patient_id, doctor_id, clinic_id, service_id, date, hour, status) VALUES ($1, $2, $3, $4, $5, $6::date, $7::time, $8::appointment_status) ON CONFLICT (id) DO NOTHING`},
		{"pagos.csv", `INSERT INTO payments (id, appointment_id, amount, method, status, payment_date) VALUES ($1, $2, $3::integer, $4::payment_method, $5::payment_status, $6::date) ON CONFLICT (id) DO NOTHING`},
	}

	for _, t := range tables {
		rows, err := loadCSV(filepath.Join(dataDir, t.file))
		if err != nil {
			log.Fatalf("Error leyendo %s: %v", t.file, err)
		}

		inserted := 0
		for i, row := range rows {
			if i == 0 {
				continue // Saltar header
			}
			args := toAny(row)
			tag, err := pool.Exec(ctx, t.query, args...)
			if err != nil {
				log.Fatalf("Error insertando fila %d de %s: %v\n  datos: %v", i, t.file, err, row)
			}
			inserted += int(tag.RowsAffected())
		}
		fmt.Printf("  %s: %d registros insertados\n", t.file, inserted)
	}

	fmt.Println("\nSeed operacional completado.")
}

// resolveDataDir busca la carpeta data/ relativa a la raíz del proyecto
func resolveDataDir() string {
	_, filename, _, _ := runtime.Caller(0)
	// backend/cmd/seed-operational/main.go -> subir 3 niveles -> raíz del proyecto
	projectRoot := filepath.Join(filepath.Dir(filename), "..", "..", "..")
	dir := filepath.Join(projectRoot, "data")
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		log.Fatalf("Directorio de datos no encontrado: %s", dir)
	}
	return dir
}

func loadCSV(path string) ([][]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return csv.NewReader(f).ReadAll()
}

func toAny(ss []string) []any {
	args := make([]any, len(ss))
	for i, s := range ss {
		args[i] = s
	}
	return args
}
