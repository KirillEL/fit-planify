package repository

import (
	"github.com/jmoiron/sqlx"
	"github.com/planify/api/internal/model"
)

type TrainerRepo struct{ db *sqlx.DB }

func NewTrainerRepo(db *sqlx.DB) *TrainerRepo { return &TrainerRepo{db} }

func (r *TrainerRepo) Upsert(t *model.Trainer) error {
	_, err := r.db.NamedExec(`
		INSERT INTO trainers (telegram_id, name, username)
		VALUES (:telegram_id, :name, :username)
		ON CONFLICT (telegram_id) DO UPDATE SET name = EXCLUDED.name, username = EXCLUDED.username
	`, t)
	return err
}

func (r *TrainerRepo) GetByTelegramID(telegramID int64) (*model.Trainer, error) {
	var t model.Trainer
	err := r.db.Get(&t, `SELECT * FROM trainers WHERE telegram_id = $1`, telegramID)
	return &t, err
}
