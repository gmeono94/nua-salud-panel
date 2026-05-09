// Configuración de la aplicación cargada desde variables de entorno.
package settings

import (
	"log"

	"github.com/kelseyhightower/envconfig"
)

// Settings contiene las variables de entorno requeridas por la aplicación.
type Settings struct {
	Environment string `envconfig:"ENVIRONMENT" default:"local"`
	Port        string `envconfig:"PORT" default:"3001"`
	DatabaseURL string `envconfig:"DATABASE_URL" required:"true"`
}

// AppSettings es la instancia global de configuración.
var AppSettings Settings

// Load carga las variables de entorno y las asigna a AppSettings.
func Load() {
	if err := envconfig.Process("", &AppSettings); err != nil {
		log.Fatalf("Error cargando configuración: %v", err)
	}
}
