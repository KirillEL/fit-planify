package handler

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/planify/api/internal/repository"
)

const clientIDKey contextKey = "client_id"

type ClientSelfHandler struct {
	clientRepo  *repository.ClientRepo
	programRepo *repository.ProgramRepo
	jwtSecret   string
}

func NewClientSelfHandler(clientRepo *repository.ClientRepo, programRepo *repository.ProgramRepo, jwtSecret string) *ClientSelfHandler {
	return &ClientSelfHandler{clientRepo, programRepo, jwtSecret}
}

func (h *ClientSelfHandler) Middleware(next http.Handler) http.Handler {
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
		role, _ := claims["role"].(string)
		if role != "client" {
			http.Error(w, "forbidden", http.StatusForbidden)
			return
		}

		clientID := int64(claims["client_id"].(float64))
		ctx := context.WithValue(r.Context(), clientIDKey, clientID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (h *ClientSelfHandler) Me(w http.ResponseWriter, r *http.Request) {
	clientID := r.Context().Value(clientIDKey).(int64)
	client, err := h.clientRepo.GetByID(clientID)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, client)
}

func (h *ClientSelfHandler) Programs(w http.ResponseWriter, r *http.Request) {
	clientID := r.Context().Value(clientIDKey).(int64)
	programs, err := h.programRepo.GetByClientIDFull(clientID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, programs)
}

func (h *ClientSelfHandler) Program(w http.ResponseWriter, r *http.Request) {
	clientID := r.Context().Value(clientIDKey).(int64)
	programID, err := strconv.ParseInt(chi.URLParam(r, "programId"), 10, 64)
	if err != nil {
		http.Error(w, "invalid program id", http.StatusBadRequest)
		return
	}

	program, err := h.programRepo.GetByIDFull(programID)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if program.ClientID != clientID {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	writeJSON(w, http.StatusOK, program)
}
