package handler

import (
	"net/http"

	"github.com/planify/api/internal/repository"
)

type NotifyHandler struct {
	repo      *repository.NotifyRepo
	botSecret string
}

func NewNotifyHandler(repo *repository.NotifyRepo, botSecret string) *NotifyHandler {
	return &NotifyHandler{repo, botSecret}
}

type unpaidClient struct {
	ClientName string  `json:"client_name"`
	Amount     float64 `json:"amount"`
	Note       string  `json:"note"`
}

type trainerReminder struct {
	TrainerTelegramID int64          `json:"trainer_telegram_id"`
	TrainerName       string         `json:"trainer_name"`
	UnpaidClients     []unpaidClient `json:"unpaid_clients"`
}

type clientReminder struct {
	ClientTelegramID int64   `json:"client_telegram_id"`
	ClientName       string  `json:"client_name"`
	Amount           float64 `json:"amount"`
	Note             string  `json:"note"`
}

type remindersResponse struct {
	Trainers []trainerReminder `json:"trainers"`
	Clients  []clientReminder  `json:"clients"`
}

func (h *NotifyHandler) Reminders(w http.ResponseWriter, r *http.Request) {
	if h.botSecret == "" || r.Header.Get("X-Bot-Secret") != h.botSecret {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}

	trainerRows, err := h.repo.GetTrainerUnpaid()
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	clientRows, err := h.repo.GetClientUnpaid()
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}

	// Group trainer rows by telegram_id
	trainerMap := make(map[int64]*trainerReminder)
	trainerOrder := make([]int64, 0)
	for _, row := range trainerRows {
		if _, ok := trainerMap[row.TrainerTelegramID]; !ok {
			trainerMap[row.TrainerTelegramID] = &trainerReminder{
				TrainerTelegramID: row.TrainerTelegramID,
				TrainerName:       row.TrainerName,
				UnpaidClients:     []unpaidClient{},
			}
			trainerOrder = append(trainerOrder, row.TrainerTelegramID)
		}
		trainerMap[row.TrainerTelegramID].UnpaidClients = append(
			trainerMap[row.TrainerTelegramID].UnpaidClients,
			unpaidClient{ClientName: row.ClientName, Amount: row.Amount, Note: row.Note},
		)
	}

	trainers := make([]trainerReminder, 0, len(trainerOrder))
	for _, id := range trainerOrder {
		trainers = append(trainers, *trainerMap[id])
	}

	clients := make([]clientReminder, 0, len(clientRows))
	for _, row := range clientRows {
		clients = append(clients, clientReminder{
			ClientTelegramID: row.ClientTelegramID,
			ClientName:       row.ClientName,
			Amount:           row.Amount,
			Note:             row.Note,
		})
	}

	writeJSON(w, http.StatusOK, remindersResponse{Trainers: trainers, Clients: clients})
}
