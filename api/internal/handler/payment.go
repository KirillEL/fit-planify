package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/planify/api/internal/model"
	"github.com/planify/api/internal/repository"
)

type PaymentHandler struct {
	repo       *repository.PaymentRepo
	clientRepo *repository.ClientRepo
}

func NewPaymentHandler(repo *repository.PaymentRepo, clientRepo *repository.ClientRepo) *PaymentHandler {
	return &PaymentHandler{repo, clientRepo}
}

func (h *PaymentHandler) List(w http.ResponseWriter, r *http.Request) {
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)
	payments, err := h.repo.GetByClientID(clientID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, payments)
}

func (h *PaymentHandler) Create(w http.ResponseWriter, r *http.Request) {
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)
	var p model.Payment
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	p.ClientID = clientID
	if err := h.repo.Create(&p); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (h *PaymentHandler) MarkPaid(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.MarkPaid(id); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (h *PaymentHandler) ListUnpaid(w http.ResponseWriter, r *http.Request) {
	telegramID := getTrainerTelegramID(r)
	// Use trainer telegram_id directly via JOIN in repo
	payments, err := h.repo.GetUnpaidByTrainer(telegramID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, payments)
}
