// Servidor con modo dual: HTTP local para desarrollo y Lambda para producción.
package server

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-gonic/gin"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/settings"
)

var ginLambda *ginadapter.GinLambdaV2

// Start inicia el servidor en modo local o Lambda según la configuración.
func Start(r *gin.Engine) {
	if settings.AppSettings.Environment == "local" {
		// Modo local: servidor HTTP estándar
		addr := fmt.Sprintf(":%s", settings.AppSettings.Port)
		log.Printf("Servidor iniciado en http://localhost:%s", settings.AppSettings.Port)
		if err := r.Run(addr); err != nil {
			log.Fatalf("Error iniciando servidor: %v", err)
		}
		return
	}

	// Modo Lambda: adaptar Gin al handler de AWS Lambda
	ginLambda = ginadapter.NewV2(r)
	lambda.Start(handler)
}

// handler procesa eventos de API Gateway y los delega a Gin.
func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}
