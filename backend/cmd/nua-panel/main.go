// Entry point de la aplicación. Carga configuración, conecta a la base
// de datos e inicia el servidor en modo local o Lambda.
package main

import (
	"log"

	"github.com/joho/godotenv"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/router"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/server"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/settings"
)

func main() {
	// Cargar .env solo en modo local
	if err := godotenv.Load(); err != nil {
		log.Println("No se encontró archivo .env, usando variables de entorno del sistema")
	}

	// Cargar configuración desde variables de entorno
	settings.Load()

	// Conectar a PostgreSQL
	db.Connect(settings.AppSettings.DatabaseURL)
	defer db.Close()

	// Configurar router con rutas y middlewares
	r := router.Setup()

	// Iniciar servidor (local o Lambda según ENVIRONMENT)
	server.Start(r)
}
