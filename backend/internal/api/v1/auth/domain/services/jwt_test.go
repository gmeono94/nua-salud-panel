package services

import (
	"testing"

	"github.com/gmeono94/nua-salud-panel/backend/internal/core/settings"
)

func init() {
	settings.AppSettings.JWTSecret = "test-jwt-secret-minimum-32-chars!"
	settings.AppSettings.JWTRefreshSecret = "test-refresh-secret-min-32-chars!"
}

func TestGenerateAndValidateAccessToken(t *testing.T) {
	token, err := GenerateAccessToken("user-123", "test@nua.com", "admin", []int32{1, 2})
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("failed to validate token: %v", err)
	}
	if claims.UserID != "user-123" {
		t.Errorf("expected user_id 'user-123', got '%s'", claims.UserID)
	}
	if claims.Email != "test@nua.com" {
		t.Errorf("expected email 'test@nua.com', got '%s'", claims.Email)
	}
	if claims.Role != "admin" {
		t.Errorf("expected role 'admin', got '%s'", claims.Role)
	}
	if len(claims.ClinicIDs) != 2 || claims.ClinicIDs[0] != 1 || claims.ClinicIDs[1] != 2 {
		t.Errorf("expected clinic_ids [1,2], got %v", claims.ClinicIDs)
	}
}

func TestValidateAccessToken_InvalidToken(t *testing.T) {
	_, err := ValidateAccessToken("invalid.token.here")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestValidateAccessToken_WrongSecret(t *testing.T) {
	token, _ := GenerateAccessToken("user-123", "test@nua.com", "admin", nil)

	original := settings.AppSettings.JWTSecret
	settings.AppSettings.JWTSecret = "different-secret-that-is-32-chars"
	_, err := ValidateAccessToken(token)
	settings.AppSettings.JWTSecret = original

	if err == nil {
		t.Error("expected error when validating with wrong secret")
	}
}

func TestGenerateAccessToken_NilClinicIDs(t *testing.T) {
	token, err := GenerateAccessToken("user-456", "admin@nua.com", "strategy", nil)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	claims, err := ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("failed to validate token: %v", err)
	}
	if len(claims.ClinicIDs) != 0 {
		t.Errorf("expected empty clinic_ids, got %v", claims.ClinicIDs)
	}
}

func TestGenerateRefreshToken_Unique(t *testing.T) {
	tokens := make(map[string]bool)
	for i := 0; i < 100; i++ {
		token, err := GenerateRefreshToken()
		if err != nil {
			t.Fatalf("failed to generate refresh token: %v", err)
		}
		if tokens[token] {
			t.Fatalf("duplicate refresh token: %s", token)
		}
		tokens[token] = true
	}
}

func TestHashRefreshToken_Deterministic(t *testing.T) {
	hash1 := HashRefreshToken("my-token")
	hash2 := HashRefreshToken("my-token")
	if hash1 != hash2 {
		t.Error("same input should produce same hash")
	}
}

func TestHashRefreshToken_DifferentInputs(t *testing.T) {
	hash1 := HashRefreshToken("token-a")
	hash2 := HashRefreshToken("token-b")
	if hash1 == hash2 {
		t.Error("different inputs should produce different hashes")
	}
}
