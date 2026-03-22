package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/planify/api/internal/model"
	"github.com/planify/api/internal/repository"
)

type ClientHandler struct {
	repo        *repository.ClientRepo
	trainerRepo *repository.TrainerRepo
}

func NewClientHandler(repo *repository.ClientRepo, trainerRepo *repository.TrainerRepo) *ClientHandler {
	return &ClientHandler{repo, trainerRepo}
}

func (h *ClientHandler) List(w http.ResponseWriter, r *http.Request) {
	telegramID := getTrainerTelegramID(r)
	trainer, err := h.trainerRepo.GetByTelegramID(telegramID)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	clients, err := h.repo.GetByTrainerID(trainer.ID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, clients)
}

func (h *ClientHandler) Create(w http.ResponseWriter, r *http.Request) {
	telegramID := getTrainerTelegramID(r)
	trainer, err := h.trainerRepo.GetByTelegramID(telegramID)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}

	client := &model.Client{
		TrainerID:   trainer.ID,
		Name:        body.Name,
		InviteToken: generateToken(),
	}
	if err := h.repo.Create(client); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, client)
}

func (h *ClientHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	client, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, client)
}

func (h *ClientHandler) Delete(w http.ResponseWriter, r *http.Request) {
	telegramID := getTrainerTelegramID(r)
	trainer, _ := h.trainerRepo.GetByTelegramID(telegramID)
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.Delete(id, trainer.ID); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ClientHandler) GetByToken(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	client, err := h.repo.GetByInviteToken(token)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, client)
}

func (h *ClientHandler) BindTelegram(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	var body struct {
		TelegramID int64 `json:"telegram_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	client, err := h.repo.GetByInviteToken(token)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if err := h.repo.SetTelegramID(client.ID, body.TelegramID); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
