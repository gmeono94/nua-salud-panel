package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupRouter(clinicIDs []int32, role string, queryParams string) *httptest.ResponseRecorder {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("role", role)
		c.Set("clinic_ids", clinicIDs)
		c.Next()
	})
	r.Use(ClinicAccessMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test?"+queryParams, nil)
	r.ServeHTTP(w, req)
	return w
}

func TestClinicAccess_AdminBypassesCheck(t *testing.T) {
	w := setupRouter(nil, "admin", "clinic_id=99")
	if w.Code != http.StatusOK {
		t.Errorf("admin should bypass clinic check, got %d", w.Code)
	}
}

func TestClinicAccess_DirectorAllowedClinic(t *testing.T) {
	w := setupRouter([]int32{1, 3}, "clinic_director", "clinic_id=1")
	if w.Code != http.StatusOK {
		t.Errorf("director with clinic 1 should access clinic 1, got %d", w.Code)
	}
}

func TestClinicAccess_DirectorDeniedClinic(t *testing.T) {
	w := setupRouter([]int32{1, 3}, "clinic_director", "clinic_id=2")
	if w.Code != http.StatusForbidden {
		t.Errorf("director with clinics [1,3] should be denied clinic 2, got %d", w.Code)
	}
}

func TestClinicAccess_DirectorNoFilter(t *testing.T) {
	w := setupRouter([]int32{1}, "clinic_director", "")
	if w.Code != http.StatusOK {
		t.Errorf("director without clinic_id filter should pass, got %d", w.Code)
	}
}

func TestClinicAccess_DirectorMultipleClinics(t *testing.T) {
	w := setupRouter([]int32{1, 2, 3}, "clinic_director", "clinic_id=1,3")
	if w.Code != http.StatusOK {
		t.Errorf("director with clinics [1,2,3] should access 1,3, got %d", w.Code)
	}
}

func TestClinicAccess_DirectorMultipleClinicsOneDenied(t *testing.T) {
	w := setupRouter([]int32{1, 3}, "clinic_director", "clinic_id=1,2")
	if w.Code != http.StatusForbidden {
		t.Errorf("director with clinics [1,3] requesting 1,2 should be denied, got %d", w.Code)
	}
}

func TestClinicAccess_InvalidClinicID(t *testing.T) {
	w := setupRouter([]int32{1}, "clinic_director", "clinic_id=abc")
	if w.Code != http.StatusBadRequest {
		t.Errorf("non-numeric clinic_id should return 400, got %d", w.Code)
	}
}

func TestClinicAccess_DirectorNoClinicsAssigned(t *testing.T) {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("role", "clinic_director")
		c.Next()
	})
	r.Use(ClinicAccessMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test?clinic_id=1", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("director without clinic_ids in context should be denied, got %d", w.Code)
	}
}
