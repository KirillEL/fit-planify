package repository

import "github.com/jmoiron/sqlx"

type NotifyRepo struct{ db *sqlx.DB }

func NewNotifyRepo(db *sqlx.DB) *NotifyRepo { return &NotifyRepo{db} }

type TrainerUnpaidRow struct {
	TrainerTelegramID int64   `db:"trainer_telegram_id"`
	TrainerName       string  `db:"trainer_name"`
	ClientName        string  `db:"client_name"`
	Amount            float64 `db:"amount"`
	Note              string  `db:"note"`
}

type ClientUnpaidRow struct {
	ClientTelegramID int64   `db:"client_telegram_id"`
	ClientName       string  `db:"client_name"`
	Amount           float64 `db:"amount"`
	Note             string  `db:"note"`
}

// GetTrainerUnpaid returns all unpaid payments grouped by trainer.
func (r *NotifyRepo) GetTrainerUnpaid() ([]TrainerUnpaidRow, error) {
	rows := make([]TrainerUnpaidRow, 0)
	err := r.db.Select(&rows, `
		SELECT
			t.telegram_id AS trainer_telegram_id,
			t.name        AS trainer_name,
			c.name        AS client_name,
			p.amount,
			p.note
		FROM payments p
		JOIN clients  c ON c.id = p.client_id
		JOIN trainers t ON t.id = c.trainer_id
		WHERE p.is_paid = false
		ORDER BY t.telegram_id, p.created_at DESC
	`)
	return rows, err
}

// GetClientUnpaid returns unpaid payments for clients who have connected via Telegram.
func (r *NotifyRepo) GetClientUnpaid() ([]ClientUnpaidRow, error) {
	rows := make([]ClientUnpaidRow, 0)
	err := r.db.Select(&rows, `
		SELECT
			c.telegram_id AS client_telegram_id,
			c.name        AS client_name,
			p.amount,
			p.note
		FROM payments p
		JOIN clients c ON c.id = p.client_id
		WHERE p.is_paid = false
		  AND c.telegram_id IS NOT NULL
		ORDER BY c.telegram_id, p.created_at DESC
	`)
	return rows, err
}
