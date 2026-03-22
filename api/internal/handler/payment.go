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
	repo        *repository.PaymentRepo
	clientRepo  *repository.ClientRepo
	trainerRepo *repository.TrainerRepo
}

func NewPaymentHandler(repo *repository.PaymentRepo, clientRepo *repository.ClientRepo, trainerRepo *repository.TrainerRepo) *PaymentHandler {
	return &PaymentHandler{repo, clientRepo, trainerRepo}
}

func (h *PaymentHandler) getTrainerID(r *http.Request) (int64, error) {
	tgID := getTrainerTelegramID(r)
	trainer, err := h.trainerRepo.GetByTelegramID(tgID)
	if err != nil {
		return 0, err
	}
	return trainer.ID, nil
}

func (h *PaymentHandler) List(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)
	payments, err := h.repo.GetByClientID(clientID, trainerID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, payments)
}

func (h *PaymentHandler) Create(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)

	// Verify client ownership
	if _, err := h.clientRepo.GetByIDForTrainer(clientID, trainerID); err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	var p model.Payment
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if p.Amount <= 0 || p.Amount > 1_000_000 {
		http.Error(w, "amount must be between 1 and 1000000", http.StatusBadRequest)
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
	tgID := getTrainerTelegramID(r)
	trainer, err := h.trainerRepo.GetByTelegramID(tgID)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	payments, err := h.repo.GetUnpaidByTrainer(trainer.ID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, payments)
}
