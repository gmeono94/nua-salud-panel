// Seed de usuarios iniciales del dashboard.
// Crea los usuarios por defecto con roles predefinidos para acceso al panel.
package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/argon2"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/settings"
)

// Parámetros de Argon2id recomendados por OWASP
const (
	argonTime    = 1
	argonMemory  = 64 * 1024 // 64MB
	argonThreads = 4
	argonKeyLen  = 32
	argonSaltLen = 16
)

// seedUser representa un usuario a crear en el seed
type seedUser struct {
	Email    string
	Password string
	Name     string
	Role     string
	Clinics  []int // IDs de clínicas asignadas (solo para clinic_director)
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

	users := []seedUser{
		{
			Email:    "admin@nuasalud.com",
			Password: "admin123",
			Name:     "Yao Jin",
			Role:     "admin",
		},
		{
			Email:    "daniella@nuasalud.com",
			Password: "strategy123",
			Name:     "Daniella Ríos",
			Role:     "strategy",
		},
		{
			Email:    "directora.roma@nuasalud.com",
			Password: "clinica123",
			Name:     "María García",
			Role:     "clinic_director",
			Clinics:  []int{1},
		},
		{
			Email:    "directora.polanco@nuasalud.com",
			Password: "clinica123",
			Name:     "Ana López",
			Role:     "clinic_director",
			Clinics:  []int{2},
		},
		{
			Email:    "directora.condesa@nuasalud.com",
			Password: "clinica123",
			Name:     "Laura Martínez",
			Role:     "clinic_director",
			Clinics:  []int{3},
		},
	}

	ctx := context.Background()

	for _, u := range users {
		hash, err := hashPassword(u.Password)
		if err != nil {
			log.Fatalf("Error hasheando password para %s: %v", u.Email, err)
		}

		var userID string
		err = pool.QueryRow(ctx,
			`INSERT INTO users (email, password_hash, name, role)
			 VALUES ($1, $2, $3, $4::user_role)
			 ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = $3, role = $4::user_role
			 RETURNING id`,
			u.Email, hash, u.Name, u.Role,
		).Scan(&userID)
		if err != nil {
			log.Fatalf("Error creando usuario %s: %v", u.Email, err)
		}

		// Asignar clínicas si es clinic_director
		for _, clinicID := range u.Clinics {
			_, err = pool.Exec(ctx,
				`INSERT INTO user_clinics (user_id, clinic_id)
				 VALUES ($1, $2)
				 ON CONFLICT (user_id, clinic_id) DO NOTHING`,
				userID, clinicID,
			)
			if err != nil {
				log.Fatalf("Error asignando clínica %d a %s: %v", clinicID, u.Email, err)
			}
		}

		fmt.Printf("✓ Usuario creado: %s (%s) — %s\n", u.Name, u.Email, u.Role)
	}

	fmt.Println("\nSeed de usuarios completado.")
	fmt.Println("Credenciales de acceso:")
	fmt.Println("  admin@nuasalud.com / admin123")
	fmt.Println("  daniella@nuasalud.com / strategy123")
	fmt.Println("  directora.roma@nuasalud.com / clinica123")
}

// hashPassword genera un hash Argon2id con salt aleatorio
func hashPassword(password string) (string, error) {
	salt := make([]byte, argonSaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	hash := argon2.IDKey([]byte(password), salt, argonTime, argonMemory, argonThreads, argonKeyLen)

	// Formato: $argon2id$salt$hash (ambos en base64)
	return fmt.Sprintf("$argon2id$%s$%s",
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash),
	), nil
}
