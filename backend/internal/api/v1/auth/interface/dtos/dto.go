// DTOs de entrada y salida para los endpoints de autenticación.
package dtos

// LoginRequest representa las credenciales de login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// TokenResponse contiene los tokens generados tras un login exitoso.
type TokenResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

// RefreshRequest contiene el refresh token para renovar el access token.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// UserResponse representa los datos públicos del usuario autenticado.
type UserResponse struct {
	ID        string   `json:"id"`
	Email     string   `json:"email"`
	Name      string   `json:"name"`
	Role      string   `json:"role"`
	ClinicIDs []int32  `json:"clinic_ids,omitempty"`
}
