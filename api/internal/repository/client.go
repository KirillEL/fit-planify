package repository

import (
	"github.com/jmoiron/sqlx"
	"github.com/planify/api/internal/model"
)

type ClientRepo struct{ db *sqlx.DB }

func NewClientRepo(db *sqlx.DB) *ClientRepo { return &ClientRepo{db} }

func (r *ClientRepo) Create(c *model.Client) error {
	return r.db.QueryRowx(`
		INSERT INTO clients (trainer_id, name, invite_token)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`, c.TrainerID, c.Name, c.InviteToken).Scan(&c.ID, &c.CreatedAt)
}

func (r *ClientRepo) GetByTrainerID(trainerID int64) ([]model.Client, error) {
	clients := make([]model.Client, 0)
	err := r.db.Select(&clients, `SELECT * FROM clients WHERE trainer_id = $1 ORDER BY created_at DESC`, trainerID)
	return clients, err
}

func (r *ClientRepo) GetByID(id int64) (*model.Client, error) {
	var c model.Client
	err := r.db.Get(&c, `SELECT * FROM clients WHERE id = $1`, id)
	return &c, err
}

func (r *ClientRepo) GetByInviteToken(token string) (*model.Client, error) {
	var c model.Client
	err := r.db.Get(&c, `SELECT * FROM clients WHERE invite_token = $1`, token)
	return &c, err
}

func (r *ClientRepo) SetTelegramID(clientID int64, telegramID int64) error {
	_, err := r.db.Exec(`UPDATE clients SET telegram_id = $1 WHERE id = $2`, telegramID, clientID)
	return err
}

func (r *ClientRepo) Delete(id int64, trainerID int64) error {
	_, err := r.db.Exec(`DELETE FROM clients WHERE id = $1 AND trainer_id = $2`, id, trainerID)
	return err
}
