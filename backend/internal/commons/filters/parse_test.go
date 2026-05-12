package filters

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func parseDateRangeFromQuery(query string) (DateRange, error) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test?"+query, nil)
	return ParseDateRange(c)
}

func TestParseDateRange_Valid(t *testing.T) {
	dr, err := parseDateRangeFromQuery("date_from=2026-01-01&date_to=2026-01-31")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dr.Days != 31 {
		t.Errorf("expected 31 days, got %d", dr.Days)
	}
	if !dr.From.Valid || !dr.To.Valid {
		t.Error("expected Valid=true for both dates")
	}
}

func TestParseDateRange_SameDay(t *testing.T) {
	dr, err := parseDateRangeFromQuery("date_from=2026-03-15&date_to=2026-03-15")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dr.Days != 1 {
		t.Errorf("same day should be 1 day, got %d", dr.Days)
	}
}

func TestParseDateRange_InvalidRange(t *testing.T) {
	_, err := parseDateRangeFromQuery("date_from=2026-06-01&date_to=2026-01-01")
	if err == nil {
		t.Error("expected error when date_to is before date_from")
	}
}

func TestParseDateRange_MissingFrom(t *testing.T) {
	_, err := parseDateRangeFromQuery("date_to=2026-01-31")
	if err == nil {
		t.Error("expected error when date_from is missing")
	}
}

func TestParseDateRange_MissingTo(t *testing.T) {
	_, err := parseDateRangeFromQuery("date_from=2026-01-01")
	if err == nil {
		t.Error("expected error when date_to is missing")
	}
}

func TestParseDateRange_InvalidFormat(t *testing.T) {
	_, err := parseDateRangeFromQuery("date_from=01-01-2026&date_to=31-01-2026")
	if err == nil {
		t.Error("expected error for invalid date format")
	}
}

func TestOptionalText_WithValue(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test?clinic_id=3", nil)

	result := OptionalText(c, "clinic_id")
	if !result.Valid {
		t.Error("expected Valid=true when param exists")
	}
	if result.String != "3" {
		t.Errorf("expected '3', got '%s'", result.String)
	}
}

func TestOptionalText_Empty(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test", nil)

	result := OptionalText(c, "clinic_id")
	if result.Valid {
		t.Error("expected Valid=false when param is missing")
	}
}

func TestOptionalText_EmptyString(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("GET", "/test?clinic_id=", nil)

	result := OptionalText(c, "clinic_id")
	if result.Valid {
		t.Error("expected Valid=false when param is empty string")
	}
}
