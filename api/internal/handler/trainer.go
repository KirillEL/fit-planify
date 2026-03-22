package handler

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/planify/api/internal/repository"
)

type contextKey string

const trainerIDKey contextKey = "trainer_telegram_id"

type TrainerHandler struct {
	repo      *repository.TrainerRepo
	jwtSecret string
}

func NewTrainerHandler(repo *repository.TrainerRepo, jwtSecret string) *TrainerHandler {
	return &TrainerHandler{repo, jwtSecret}
}

func (h *TrainerHandler) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(h.jwtSecret), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		telegramID := int64(claims["telegram_id"].(float64))
		ctx := context.WithValue(r.Context(), trainerIDKey, telegramID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *TrainerHandler) Me(w http.ResponseWriter, r *http.Request) {
	telegramID := r.Context().Value(trainerIDKey).(int64)
	trainer, err := h.repo.GetByTelegramID(telegramID)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, trainer)
}

func getTrainerTelegramID(r *http.Request) int64 {
	return r.Context().Value(trainerIDKey).(int64)
}
