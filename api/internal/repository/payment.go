package repository

import (
	"github.com/jmoiron/sqlx"
	"github.com/planify/api/internal/model"
)

type PaymentRepo struct{ db *sqlx.DB }

func NewPaymentRepo(db *sqlx.DB) *PaymentRepo { return &PaymentRepo{db} }

func (r *PaymentRepo) Create(p *model.Payment) error {
	return r.db.QueryRowx(`
		INSERT INTO payments (client_id, amount, is_paid, paid_at, next_payment_at, note)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`, p.ClientID, p.Amount, p.IsPaid, p.PaidAt, p.NextPaymentAt, p.Note).Scan(&p.ID, &p.CreatedAt)
}

// GetByClientID returns payments only if client belongs to trainerID.
func (r *PaymentRepo) GetByClientID(clientID, trainerID int64) ([]model.Payment, error) {
	payments := make([]model.Payment, 0)
	err := r.db.Select(&payments, `
		SELECT p.* FROM payments p
		JOIN clients c ON c.id = p.client_id
		WHERE p.client_id = $1 AND c.trainer_id = $2
		ORDER BY p.created_at DESC
	`, clientID, trainerID)
	return payments, err
}

func (r *PaymentRepo) MarkPaid(id int64) error {
	_, err := r.db.Exec(`UPDATE payments SET is_paid = true, paid_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *PaymentRepo) GetUnpaidByTrainer(trainerID int64) ([]model.Payment, error) {
	payments := make([]model.Payment, 0)
	err := r.db.Select(&payments, `
		SELECT p.* FROM payments p
		JOIN clients c ON c.id = p.client_id
		WHERE c.trainer_id = $1 AND p.is_paid = false
		ORDER BY p.created_at DESC
	`, trainerID)
	return payments, err
}
