// Generación y validación de tokens JWT (access + refresh).
package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/settings"
)

const (
	AccessTokenDuration  = 15 * time.Minute
	RefreshTokenDuration = 7 * 24 * time.Hour
)

// Claims extiende los claims estándar de JWT con datos del usuario.
type Claims struct {
	UserID    string   `json:"user_id"`
	Email     string   `json:"email"`
	Role      string   `json:"role"`
	ClinicIDs []int32  `json:"clinic_ids,omitempty"`
	jwt.RegisteredClaims
}

// GenerateAccessToken crea un JWT firmado con los datos del usuario.
func GenerateAccessToken(userID, email, role string, clinicIDs []int32) (string, error) {
	claims := Claims{
		UserID:    userID,
		Email:     email,
		Role:      role,
		ClinicIDs: clinicIDs,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(AccessTokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "nua-salud-panel",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(settings.AppSettings.JWTSecret))
}

// ValidateAccessToken verifica la firma y vigencia del token, retorna los claims.
func ValidateAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
		}
		return []byte(settings.AppSettings.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("token inválido")
	}

	return claims, nil
}

// GenerateRefreshToken genera un token opaco aleatorio de 32 bytes.
func GenerateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// HashRefreshToken genera un SHA-256 del refresh token para almacenarlo en DB.
// Nunca se guarda el token en texto plano.
func HashRefreshToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
