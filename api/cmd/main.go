package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
	"github.com/planify/api/internal/handler"
	"github.com/planify/api/internal/repository"
)

func main() {
	godotenv.Load()

	dbURL := mustEnv("DATABASE_URL")
	jwtSecret := mustEnv("JWT_SECRET")
	botToken := mustEnv("BOT_TOKEN")
	port := getEnv("API_PORT", "8080")
	devMode := os.Getenv("DEV_MODE") == "true"

	db, err := repository.NewPostgres(dbURL)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer db.Close()

	runMigrations(dbURL)

	trainerRepo := repository.NewTrainerRepo(db)
	clientRepo := repository.NewClientRepo(db)
	programRepo := repository.NewProgramRepo(db)
	paymentRepo := repository.NewPaymentRepo(db)

	if devMode {
		log.Println("WARNING: DEV_MODE is enabled — /auth/dev endpoint is active")
	}

	r := handler.NewRouter(trainerRepo, clientRepo, programRepo, paymentRepo, jwtSecret, botToken, devMode)

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Planify API starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err)
	}
}

func runMigrations(dbURL string) {
	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		log.Fatalf("migrations init: %v", err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("migrations run: %v", err)
	}
	log.Println("Migrations applied")
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("env %s is required", key)
	}
	return v
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
