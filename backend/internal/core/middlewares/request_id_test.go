package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequestID_GeneratesID(t *testing.T) {
	r := gin.New()
	r.Use(RequestIDMiddleware())
	r.GET("/test", func(c *gin.Context) {
		id, _ := c.Get("request_id")
		c.String(http.StatusOK, id.(string))
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	headerID := w.Header().Get("X-Request-ID")
	if headerID == "" {
		t.Error("expected X-Request-ID header to be set")
	}
	if len(headerID) != 32 {
		t.Errorf("expected 32-char hex ID, got %d chars: %s", len(headerID), headerID)
	}
	if w.Body.String() != headerID {
		t.Error("context request_id should match response header")
	}
}

func TestRequestID_ReusesExistingHeader(t *testing.T) {
	r := gin.New()
	r.Use(RequestIDMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-ID", "my-custom-id-123")
	r.ServeHTTP(w, req)

	if w.Header().Get("X-Request-ID") != "my-custom-id-123" {
		t.Errorf("expected reused ID, got %s", w.Header().Get("X-Request-ID"))
	}
}

func TestRequestID_UniquePerRequest(t *testing.T) {
	r := gin.New()
	r.Use(RequestIDMiddleware())
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	ids := make(map[string]bool)
	for i := 0; i < 100; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		r.ServeHTTP(w, req)
		id := w.Header().Get("X-Request-ID")
		if ids[id] {
			t.Fatalf("duplicate request ID generated: %s", id)
		}
		ids[id] = true
	}
}
