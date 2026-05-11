// Controller de autenticación. Maneja los endpoints de login, refresh, logout y me.
package controllers

import (
	"net/http"
	"net/netip"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth/domain/services"
	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth/interface/dtos"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
)

// AuthController contiene las dependencias del controller de autenticación.
type AuthController struct {
	service *services.AuthService
	audit   *dashboardsqlc.Queries
}

// NewAuthController crea una nueva instancia del controller.
func NewAuthController(service *services.AuthService, audit *dashboardsqlc.Queries) *AuthController {
	return &AuthController{service: service, audit: audit}
}

// Login autentica al usuario y retorna tokens de acceso.
// POST /api/v1/auth/login
func (c *AuthController) Login(ctx *gin.Context) {
	var req dtos.LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Email y password son requeridos"})
		return
	}

	response, err := c.service.Login(ctx.Request.Context(), req)
	if err != nil {
		// Registrar intento fallido en bitácora
		c.logAction(ctx, nil, dashboardsqlc.AuditActionLoginFailed, "auth", map[string]string{"email": req.Email})
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciales inválidas"})
		return
	}

	// Registrar login exitoso
	userID := parseUUID(response.User.ID)
	c.logAction(ctx, &userID, dashboardsqlc.AuditActionLogin, "auth", nil)

	ctx.JSON(http.StatusOK, response)
}

// Refresh renueva el access token usando un refresh token válido.
// POST /api/v1/auth/refresh
func (c *AuthController) Refresh(ctx *gin.Context) {
	var req dtos.RefreshRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token es requerido"})
		return
	}

	response, err := c.service.Refresh(ctx.Request.Context(), req.RefreshToken)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token inválido o expirado"})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// Logout revoca el refresh token.
// POST /api/v1/auth/logout
func (c *AuthController) Logout(ctx *gin.Context) {
	var req dtos.RefreshRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Refresh token es requerido"})
		return
	}

	_ = c.service.Logout(ctx.Request.Context(), req.RefreshToken)

	// Registrar logout en bitácora
	if userID, exists := ctx.Get("user_id"); exists {
		uid := parseUUID(userID.(string))
		c.logAction(ctx, &uid, dashboardsqlc.AuditActionLogout, "auth", nil)
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Sesión cerrada"})
}

// Me retorna los datos del usuario autenticado.
// GET /api/v1/auth/me
func (c *AuthController) Me(ctx *gin.Context) {
	userIDStr, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "No autenticado"})
		return
	}

	userID := parseUUID(userIDStr.(string))
	user, err := c.service.GetMe(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Usuario no encontrado"})
		return
	}

	ctx.JSON(http.StatusOK, user)
}

// logAction registra una acción en la bitácora de auditoría.
func (c *AuthController) logAction(ctx *gin.Context, userID *pgtype.UUID, action dashboardsqlc.AuditAction, resource string, details map[string]string) {
	params := dashboardsqlc.CreateAuditLogParams{
		Action:   action,
		Resource: pgtype.Text{String: resource, Valid: true},
	}

	if userID != nil {
		params.UserID = *userID
	}

	// IP del cliente
	if addr, err := netip.ParseAddr(ctx.ClientIP()); err == nil {
		params.IpAddress = &addr
	}

	_ = c.audit.CreateAuditLog(ctx.Request.Context(), params)
}

// parseUUID convierte un string UUID a pgtype.UUID.
func parseUUID(s string) pgtype.UUID {
	var uid pgtype.UUID
	_ = uid.Scan(s)
	return uid
}
