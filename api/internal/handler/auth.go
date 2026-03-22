package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/planify/api/internal/model"
	"github.com/planify/api/internal/repository"
)

type AuthHandler struct {
	trainerRepo *repository.TrainerRepo
	jwtSecret   string
	devMode     bool
}

func NewAuthHandler(trainerRepo *repository.TrainerRepo, jwtSecret string, devMode bool) *AuthHandler {
	return &AuthHandler{trainerRepo, jwtSecret, devMode}
}

type telegramAuthRequest struct {
	InitData string `json:"init_data"`
}

type telegramUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
}

func (h *AuthHandler) TelegramAuth(w http.ResponseWriter, r *http.Request) {
	var req telegramAuthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	user, ok := h.validateInitData(req.InitData)
	if !ok {
		http.Error(w, "invalid init data", http.StatusUnauthorized)
		return
	}

	trainer := &model.Trainer{
		TelegramID: user.ID,
		Name:       strings.TrimSpace(user.FirstName + " " + user.LastName),
		Username:   user.Username,
	}
	if err := h.trainerRepo.Upsert(trainer); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	token, err := h.generateJWT(user.ID)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func (h *AuthHandler) validateInitData(initData string) (*telegramUser, bool) {
	params := make(map[string]string)
	var hash string
	var dataCheckParts []string

	for _, part := range strings.Split(initData, "&") {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) != 2 {
			continue
		}
		if kv[0] == "hash" {
			hash = kv[1]
		} else {
			params[kv[0]] = kv[1]
			dataCheckParts = append(dataCheckParts, kv[0]+"="+kv[1])
		}
	}

	sort.Strings(dataCheckParts)
	dataCheckString := strings.Join(dataCheckParts, "\n")

	secretKey := hmac.New(sha256.New, []byte("WebAppData"))
	secretKey.Write([]byte(h.jwtSecret))

	mac := hmac.New(sha256.New, secretKey.Sum(nil))
	mac.Write([]byte(dataCheckString))
	expectedHash := hex.EncodeToString(mac.Sum(nil))

	if expectedHash != hash {
		return nil, false
	}

	var user telegramUser
	if err := json.Unmarshal([]byte(params["user"]), &user); err != nil {
		return nil, false
	}
	return &user, true
}

// DevAuth issues a JWT for a hardcoded dev trainer. Only works when devMode is true.
func (h *AuthHandler) DevAuth(w http.ResponseWriter, r *http.Request) {
	if !h.devMode {
		http.Error(w, "not available", http.StatusForbidden)
		return
	}

	trainer := &model.Trainer{
		TelegramID: 1,
		Name:       "Dev Trainer",
		Username:   "dev",
	}
	if err := h.trainerRepo.Upsert(trainer); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	token, err := h.generateJWT(1)
	if err != nil {
		http.Error(w, "token error", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": token})
}

func (h *AuthHandler) generateJWT(telegramID int64) (string, error) {
	claims := jwt.MapClaims{
		"telegram_id": telegramID,
		"exp":         time.Now().Add(30 * 24 * time.Hour).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.jwtSecret))
}
