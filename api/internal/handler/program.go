package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/planify/api/internal/model"
	"github.com/planify/api/internal/repository"
)

type ProgramHandler struct {
	repo        *repository.ProgramRepo
	clientRepo  *repository.ClientRepo
	trainerRepo *repository.TrainerRepo
}

func NewProgramHandler(repo *repository.ProgramRepo, clientRepo *repository.ClientRepo, trainerRepo *repository.TrainerRepo) *ProgramHandler {
	return &ProgramHandler{repo, clientRepo, trainerRepo}
}

func (h *ProgramHandler) getTrainerID(r *http.Request) (int64, error) {
	tgID := getTrainerTelegramID(r)
	trainer, err := h.trainerRepo.GetByTelegramID(tgID)
	if err != nil {
		return 0, err
	}
	return trainer.ID, nil
}

func (h *ProgramHandler) List(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)

	// Verify client belongs to trainer
	if _, err := h.clientRepo.GetByIDForTrainer(clientID, trainerID); err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	programs, err := h.repo.GetByClientID(clientID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	for i := range programs {
		days, _ := h.repo.GetDays(programs[i].ID)
		for j := range days {
			days[j].Exercises, _ = h.repo.GetExercises(days[j].ID)
		}
		programs[i].WorkoutDays = days
	}
	writeJSON(w, http.StatusOK, programs)
}

func (h *ProgramHandler) Create(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)

	if _, err := h.clientRepo.GetByIDForTrainer(clientID, trainerID); err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	var body struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	title := strings.TrimSpace(body.Title)
	if title == "" || len(title) > 100 {
		http.Error(w, "title must be 1-100 characters", http.StatusBadRequest)
		return
	}

	p := &model.Program{ClientID: clientID, Title: title}
	if err := h.repo.Create(p); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (h *ProgramHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	p, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	days, _ := h.repo.GetDays(p.ID)
	for i, day := range days {
		exercises, _ := h.repo.GetExercises(day.ID)
		days[i].Exercises = exercises
	}
	p.WorkoutDays = days
	writeJSON(w, http.StatusOK, p)
}

func (h *ProgramHandler) Update(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	var body struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	title := strings.TrimSpace(body.Title)
	if title == "" || len(title) > 100 {
		http.Error(w, "title must be 1-100 characters", http.StatusBadRequest)
		return
	}

	if err := h.repo.Update(id, trainerID, title); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProgramHandler) Delete(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.Delete(id, trainerID); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProgramHandler) AddDay(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	programID, _ := strconv.ParseInt(chi.URLParam(r, "programID"), 10, 64)

	// Verify program belongs to trainer
	p, err := h.repo.GetByID(programID)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	if _, err := h.clientRepo.GetByIDForTrainer(p.ClientID, trainerID); err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	var body struct {
		DayNumber int    `json:"day_number"`
		Title     string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	title := strings.TrimSpace(body.Title)
	if title == "" || len(title) > 100 {
		http.Error(w, "title must be 1-100 characters", http.StatusBadRequest)
		return
	}

	d := &model.WorkoutDay{ProgramID: programID, DayNumber: body.DayNumber, Title: title}
	if err := h.repo.AddDay(d); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, d)
}

func (h *ProgramHandler) UpdateDay(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	var body struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	title := strings.TrimSpace(body.Title)
	if title == "" || len(title) > 100 {
		http.Error(w, "title must be 1-100 characters", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateDay(id, trainerID, title); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProgramHandler) DeleteDay(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.DeleteDay(id, trainerID); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProgramHandler) AddExercise(w http.ResponseWriter, r *http.Request) {
	dayID, _ := strconv.ParseInt(chi.URLParam(r, "dayID"), 10, 64)
	var e model.Exercise
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	name := strings.TrimSpace(e.Name)
	if name == "" || len(name) > 100 {
		http.Error(w, "name must be 1-100 characters", http.StatusBadRequest)
		return
	}
	if e.Sets < 1 || e.Sets > 100 {
		http.Error(w, "sets must be 1-100", http.StatusBadRequest)
		return
	}
	if e.Reps < 1 || e.Reps > 100 {
		http.Error(w, "reps must be 1-100", http.StatusBadRequest)
		return
	}
	if e.Weight < 0 || e.Weight > 1000 {
		http.Error(w, "weight must be 0-1000", http.StatusBadRequest)
		return
	}
	e.Name = name
	e.WorkoutDayID = dayID
	if err := h.repo.AddExercise(&e); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, e)
}

func (h *ProgramHandler) UpdateExercise(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)

	var e model.Exercise
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	name := strings.TrimSpace(e.Name)
	if name == "" || len(name) > 100 {
		http.Error(w, "name must be 1-100 characters", http.StatusBadRequest)
		return
	}
	if e.Sets < 1 || e.Sets > 100 || e.Reps < 1 || e.Reps > 100 || e.Weight < 0 || e.Weight > 1000 {
		http.Error(w, "invalid exercise values", http.StatusBadRequest)
		return
	}
	e.Name = name

	if err := h.repo.UpdateExercise(id, trainerID, e); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProgramHandler) Duplicate(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	program, err := h.repo.Duplicate(id, trainerID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, program)
}

func (h *ProgramHandler) DeleteExercise(w http.ResponseWriter, r *http.Request) {
	trainerID, err := h.getTrainerID(r)
	if err != nil {
		http.Error(w, "trainer not found", http.StatusNotFound)
		return
	}
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.DeleteExercise(id, trainerID); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
