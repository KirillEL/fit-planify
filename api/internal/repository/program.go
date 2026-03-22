package repository

import (
	"github.com/jmoiron/sqlx"
	"github.com/planify/api/internal/model"
)

type ProgramRepo struct{ db *sqlx.DB }

func NewProgramRepo(db *sqlx.DB) *ProgramRepo { return &ProgramRepo{db} }

func (r *ProgramRepo) Create(p *model.Program) error {
	return r.db.QueryRowx(`
		INSERT INTO programs (client_id, title) VALUES ($1, $2)
		RETURNING id, created_at
	`, p.ClientID, p.Title).Scan(&p.ID, &p.CreatedAt)
}

func (r *ProgramRepo) GetByClientID(clientID int64) ([]model.Program, error) {
	programs := make([]model.Program, 0)
	err := r.db.Select(&programs, `SELECT * FROM programs WHERE client_id = $1 ORDER BY created_at DESC`, clientID)
	return programs, err
}

func (r *ProgramRepo) GetByID(id int64) (*model.Program, error) {
	var p model.Program
	err := r.db.Get(&p, `SELECT * FROM programs WHERE id = $1`, id)
	return &p, err
}

func (r *ProgramRepo) Delete(id int64) error {
	_, err := r.db.Exec(`DELETE FROM programs WHERE id = $1`, id)
	return err
}

func (r *ProgramRepo) AddDay(d *model.WorkoutDay) error {
	return r.db.QueryRowx(`
		INSERT INTO workout_days (program_id, day_number, title) VALUES ($1, $2, $3)
		RETURNING id
	`, d.ProgramID, d.DayNumber, d.Title).Scan(&d.ID)
}

func (r *ProgramRepo) GetDays(programID int64) ([]model.WorkoutDay, error) {
	days := make([]model.WorkoutDay, 0)
	err := r.db.Select(&days, `SELECT * FROM workout_days WHERE program_id = $1 ORDER BY day_number`, programID)
	return days, err
}

func (r *ProgramRepo) DeleteDay(id int64) error {
	_, err := r.db.Exec(`DELETE FROM workout_days WHERE id = $1`, id)
	return err
}

func (r *ProgramRepo) AddExercise(e *model.Exercise) error {
	return r.db.QueryRowx(`
		INSERT INTO exercises (workout_day_id, name, sets, reps, weight, note, order_index)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, e.WorkoutDayID, e.Name, e.Sets, e.Reps, e.Weight, e.Note, e.Order).Scan(&e.ID)
}

func (r *ProgramRepo) GetExercises(dayID int64) ([]model.Exercise, error) {
	exercises := make([]model.Exercise, 0)
	err := r.db.Select(&exercises, `SELECT * FROM exercises WHERE workout_day_id = $1 ORDER BY order_index`, dayID)
	return exercises, err
}

func (r *ProgramRepo) DeleteExercise(id int64) error {
	_, err := r.db.Exec(`DELETE FROM exercises WHERE id = $1`, id)
	return err
}
