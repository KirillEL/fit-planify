package model

import "time"

type Trainer struct {
	ID         int64     `db:"id" json:"id"`
	TelegramID int64     `db:"telegram_id" json:"telegram_id"`
	Name       string    `db:"name" json:"name"`
	Username   string    `db:"username" json:"username"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}

type Client struct {
	ID          int64      `db:"id" json:"id"`
	TrainerID   int64      `db:"trainer_id" json:"trainer_id"`
	TelegramID  *int64     `db:"telegram_id" json:"telegram_id"`
	Name        string     `db:"name" json:"name"`
	InviteToken string     `db:"invite_token" json:"invite_token"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
}

type Program struct {
	ID          int64        `db:"id" json:"id"`
	ClientID    int64        `db:"client_id" json:"client_id"`
	Title       string       `db:"title" json:"title"`
	CreatedAt   time.Time    `db:"created_at" json:"created_at"`
	WorkoutDays []WorkoutDay `db:"-" json:"workout_days,omitempty"`
}

type WorkoutDay struct {
	ID        int64      `db:"id" json:"id"`
	ProgramID int64      `db:"program_id" json:"program_id"`
	DayNumber int        `db:"day_number" json:"day_number"`
	Title     string     `db:"title" json:"title"`
	Exercises []Exercise `db:"-" json:"exercises,omitempty"`
}

type Exercise struct {
	ID           int64   `db:"id" json:"id"`
	WorkoutDayID int64   `db:"workout_day_id" json:"workout_day_id"`
	Name         string  `db:"name" json:"name"`
	Sets         int     `db:"sets" json:"sets"`
	Reps         int     `db:"reps" json:"reps"`
	Weight       float64 `db:"weight" json:"weight"`
	Note         string  `db:"note" json:"note"`
	Order        int     `db:"order_index" json:"order"`
}

type Payment struct {
	ID            int64      `db:"id" json:"id"`
	ClientID      int64      `db:"client_id" json:"client_id"`
	Amount        float64    `db:"amount" json:"amount"`
	IsPaid        bool       `db:"is_paid" json:"is_paid"`
	PaidAt        *time.Time `db:"paid_at" json:"paid_at"`
	NextPaymentAt *time.Time `db:"next_payment_at" json:"next_payment_at"`
	Note          string     `db:"note" json:"note"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
}
