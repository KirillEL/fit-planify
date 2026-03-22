package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/planify/api/internal/model"
	"github.com/planify/api/internal/repository"
)

type ProgramHandler struct {
	repo       *repository.ProgramRepo
	clientRepo *repository.ClientRepo
}

func NewProgramHandler(repo *repository.ProgramRepo, clientRepo *repository.ClientRepo) *ProgramHandler {
	return &ProgramHandler{repo, clientRepo}
}

func (h *ProgramHandler) List(w http.ResponseWriter, r *http.Request) {
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)
	programs, err := h.repo.GetByClientID(clientID)
	if err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, programs)
}

func (h *ProgramHandler) Create(w http.ResponseWriter, r *http.Request) {
	clientID, _ := strconv.ParseInt(chi.URLParam(r, "clientID"), 10, 64)
	var body struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	p := &model.Program{ClientID: clientID, Title: body.Title}
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

func (h *ProgramHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.Delete(id); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProgramHandler) AddDay(w http.ResponseWriter, r *http.Request) {
	programID, _ := strconv.ParseInt(chi.URLParam(r, "programID"), 10, 64)
	var body struct {
		DayNumber int    `json:"day_number"`
		Title     string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	d := &model.WorkoutDay{ProgramID: programID, DayNumber: body.DayNumber, Title: body.Title}
	if err := h.repo.AddDay(d); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, d)
}

func (h *ProgramHandler) DeleteDay(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.DeleteDay(id); err != nil {
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
	e.WorkoutDayID = dayID
	if err := h.repo.AddExercise(&e); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, e)
}

func (h *ProgramHandler) DeleteExercise(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err := h.repo.DeleteExercise(id); err != nil {
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
