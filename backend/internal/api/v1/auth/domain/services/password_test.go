package services

import (
	"testing"
)

func TestHashAndVerifyPassword(t *testing.T) {
	hash, err := HashPassword("mi-password-seguro")
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}

	valid, err := VerifyPassword("mi-password-seguro", hash)
	if err != nil {
		t.Fatalf("failed to verify password: %v", err)
	}
	if !valid {
		t.Error("expected password to match")
	}
}

func TestVerifyPassword_WrongPassword(t *testing.T) {
	hash, _ := HashPassword("password-correcto")

	valid, err := VerifyPassword("password-incorrecto", hash)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if valid {
		t.Error("wrong password should not match")
	}
}

func TestHashPassword_UniqueSalts(t *testing.T) {
	hash1, _ := HashPassword("same-password")
	hash2, _ := HashPassword("same-password")

	if hash1 == hash2 {
		t.Error("same password should produce different hashes (random salt)")
	}
}

func TestVerifyPassword_InvalidFormat(t *testing.T) {
	_, err := VerifyPassword("test", "not-a-valid-hash")
	if err == nil {
		t.Error("expected error for invalid hash format")
	}
}
