package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/planify/api/internal/repository"
)

func NewRouter(
	trainerRepo *repository.TrainerRepo,
	clientRepo *repository.ClientRepo,
	programRepo *repository.ProgramRepo,
	paymentRepo *repository.PaymentRepo,
	notifyRepo *repository.NotifyRepo,
	jwtSecret string,
	botToken string,
	botSecret string,
	devMode bool,
) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"https://gymlead.elertka.tech"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
	}))

	auth := NewAuthHandler(trainerRepo, jwtSecret, botToken, devMode)
	trainer := NewTrainerHandler(trainerRepo, jwtSecret)
	client := NewClientHandler(clientRepo, trainerRepo)
	program := NewProgramHandler(programRepo, clientRepo, trainerRepo)
	payment := NewPaymentHandler(paymentRepo, clientRepo, trainerRepo)
	notify := NewNotifyHandler(notifyRepo, botSecret)

	r.Post("/auth/telegram", auth.TelegramAuth)
	r.Post("/auth/dev", auth.DevAuth)

	r.Route("/api", func(r chi.Router) {
		r.Use(trainer.Middleware)

		r.Get("/trainer/me", trainer.Me)

		r.Get("/clients", client.List)
		r.Post("/clients", client.Create)
		r.Get("/clients/{id}", client.Get)
		r.Put("/clients/{id}", client.Update)
		r.Delete("/clients/{id}", client.Delete)

		r.Get("/clients/{clientID}/programs", program.List)
		r.Post("/clients/{clientID}/programs", program.Create)
		r.Get("/programs/{id}", program.Get)
		r.Put("/programs/{id}", program.Update)
		r.Delete("/programs/{id}", program.Delete)
		r.Post("/programs/{id}/duplicate", program.Duplicate)
		r.Post("/programs/{id}/copy", program.CopyToClient)

		r.Post("/programs/{programID}/days", program.AddDay)
		r.Put("/days/{id}", program.UpdateDay)
		r.Delete("/days/{id}", program.DeleteDay)

		r.Post("/days/{dayID}/exercises", program.AddExercise)
		r.Put("/days/{dayID}/exercises/reorder", program.ReorderExercises)
		r.Put("/exercises/{id}", program.UpdateExercise)
		r.Delete("/exercises/{id}", program.DeleteExercise)

		r.Get("/clients/{clientID}/payments", payment.List)
		r.Post("/clients/{clientID}/payments", payment.Create)
		r.Put("/payments/{id}/pay", payment.MarkPaid)
		r.Get("/payments/unpaid", payment.ListUnpaid)
	})

	// Public — for clients via invite token
	r.Get("/invite/{token}", client.GetByToken)
	r.Post("/invite/{token}/bind", client.BindTelegram)
	r.Get("/invite/{token}/programs", client.GetProgramsByToken)

	// Internal — for bot notifications
	r.Get("/notify/reminders", notify.Reminders)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})

	return r
}
