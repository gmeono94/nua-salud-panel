// Servicio de autenticación. Orquesta login, refresh y logout
// coordinando JWT, password hashing, y acceso a la base de datos.
package services

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/gmeono94/nua-salud-panel/backend/internal/api/v1/auth/interface/dtos"
	"github.com/gmeono94/nua-salud-panel/backend/internal/core/db/dashboardsqlc"
)

// AuthService contiene las dependencias para operaciones de autenticación.
type AuthService struct {
	queries *dashboardsqlc.Queries
}

// NewAuthService crea una nueva instancia del servicio de autenticación.
func NewAuthService(queries *dashboardsqlc.Queries) *AuthService {
	return &AuthService{queries: queries}
}

// Login valida credenciales y genera tokens de acceso.
func (s *AuthService) Login(ctx context.Context, req dtos.LoginRequest) (*dtos.TokenResponse, error) {
	// Buscar usuario por email
	user, err := s.queries.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("credenciales inválidas")
	}

	// Verificar password
	valid, err := VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !valid {
		return nil, fmt.Errorf("credenciales inválidas")
	}

	// Obtener clínicas asignadas (relevante para clinic_director)
	clinicIDs, err := s.getUserClinicIDs(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo clínicas del usuario: %w", err)
	}

	// Generar access token
	accessToken, err := GenerateAccessToken(
		user.ID.String(),
		user.Email,
		string(user.Role),
		clinicIDs,
	)
	if err != nil {
		return nil, fmt.Errorf("error generando access token: %w", err)
	}

	// Generar y almacenar refresh token
	refreshToken, err := GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("error generando refresh token: %w", err)
	}

	err = s.queries.CreateRefreshToken(ctx, dashboardsqlc.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: HashRefreshToken(refreshToken),
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(RefreshTokenDuration), Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("error almacenando refresh token: %w", err)
	}

	return &dtos.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dtos.UserResponse{
			ID:        user.ID.String(),
			Email:     user.Email,
			Name:      user.Name,
			Role:      string(user.Role),
			ClinicIDs: clinicIDs,
		},
	}, nil
}

// Refresh genera un nuevo access token usando un refresh token válido.
func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*dtos.TokenResponse, error) {
	tokenHash := HashRefreshToken(refreshToken)

	// Buscar refresh token en DB
	storedToken, err := s.queries.GetRefreshToken(ctx, tokenHash)
	if err != nil {
		return nil, fmt.Errorf("refresh token inválido o expirado")
	}

	// Obtener datos del usuario
	user, err := s.queries.GetUserByID(ctx, storedToken.UserID)
	if err != nil {
		return nil, fmt.Errorf("usuario no encontrado")
	}

	clinicIDs, err := s.getUserClinicIDs(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo clínicas: %w", err)
	}

	// Revocar token anterior y generar uno nuevo (rotación de refresh tokens)
	_ = s.queries.RevokeRefreshToken(ctx, tokenHash)

	accessToken, err := GenerateAccessToken(
		user.ID.String(),
		user.Email,
		string(user.Role),
		clinicIDs,
	)
	if err != nil {
		return nil, fmt.Errorf("error generando access token: %w", err)
	}

	newRefreshToken, err := GenerateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("error generando refresh token: %w", err)
	}

	err = s.queries.CreateRefreshToken(ctx, dashboardsqlc.CreateRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: HashRefreshToken(newRefreshToken),
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(RefreshTokenDuration), Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("error almacenando refresh token: %w", err)
	}

	return &dtos.TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		User: dtos.UserResponse{
			ID:        user.ID.String(),
			Email:     user.Email,
			Name:      user.Name,
			Role:      string(user.Role),
			ClinicIDs: clinicIDs,
		},
	}, nil
}

// Logout revoca el refresh token del usuario.
func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	return s.queries.RevokeRefreshToken(ctx, HashRefreshToken(refreshToken))
}

// GetMe retorna los datos del usuario autenticado.
func (s *AuthService) GetMe(ctx context.Context, userID pgtype.UUID) (*dtos.UserResponse, error) {
	user, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("usuario no encontrado")
	}

	clinicIDs, err := s.getUserClinicIDs(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo clínicas: %w", err)
	}

	return &dtos.UserResponse{
		ID:        user.ID.String(),
		Email:     user.Email,
		Name:      user.Name,
		Role:      string(user.Role),
		ClinicIDs: clinicIDs,
	}, nil
}

// getUserClinicIDs obtiene los IDs de clínicas asignadas a un usuario.
func (s *AuthService) getUserClinicIDs(ctx context.Context, userID pgtype.UUID) ([]int32, error) {
	ids, err := s.queries.GetClinicIDsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return ids, nil
}
