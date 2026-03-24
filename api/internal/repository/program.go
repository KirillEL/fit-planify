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

// Delete removes a program only if it belongs to a client owned by trainerID.
func (r *ProgramRepo) Delete(id, trainerID int64) error {
	_, err := r.db.Exec(`
		DELETE FROM programs WHERE id = $1
		AND client_id IN (SELECT id FROM clients WHERE trainer_id = $2)
	`, id, trainerID)
	return err
}

func (r *ProgramRepo) Update(id, trainerID int64, title string) error {
	_, err := r.db.Exec(`
		UPDATE programs SET title = $1 WHERE id = $2
		AND client_id IN (SELECT id FROM clients WHERE trainer_id = $3)
	`, title, id, trainerID)
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

// DeleteDay removes a day only if its program belongs to trainerID.
func (r *ProgramRepo) DeleteDay(id, trainerID int64) error {
	_, err := r.db.Exec(`
		DELETE FROM workout_days WHERE id = $1
		AND program_id IN (
			SELECT p.id FROM programs p
			JOIN clients c ON c.id = p.client_id
			WHERE c.trainer_id = $2
		)
	`, id, trainerID)
	return err
}

func (r *ProgramRepo) UpdateDay(id, trainerID int64, title string) error {
	_, err := r.db.Exec(`
		UPDATE workout_days SET title = $1 WHERE id = $2
		AND program_id IN (
			SELECT p.id FROM programs p
			JOIN clients c ON c.id = p.client_id
			WHERE c.trainer_id = $3
		)
	`, title, id, trainerID)
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

// DeleteExercise removes an exercise only if it belongs to a day in a trainer's program.
func (r *ProgramRepo) DeleteExercise(id, trainerID int64) error {
	_, err := r.db.Exec(`
		DELETE FROM exercises WHERE id = $1
		AND workout_day_id IN (
			SELECT d.id FROM workout_days d
			JOIN programs p ON p.id = d.program_id
			JOIN clients c ON c.id = p.client_id
			WHERE c.trainer_id = $2
		)
	`, id, trainerID)
	return err
}

func (r *ProgramRepo) UpdateExercise(id, trainerID int64, e model.Exercise) error {
	_, err := r.db.Exec(`
		UPDATE exercises SET name=$1, sets=$2, reps=$3, weight=$4, note=$5, order_index=$6
		WHERE id = $7
		AND workout_day_id IN (
			SELECT d.id FROM workout_days d
			JOIN programs p ON p.id = d.program_id
			JOIN clients c ON c.id = p.client_id
			WHERE c.trainer_id = $8
		)
	`, e.Name, e.Sets, e.Reps, e.Weight, e.Note, e.Order, id, trainerID)
	return err
}

// Duplicate clones a program (with all its days and exercises) under the same client.
// Ownership is verified via trainerID. Returns the full populated clone.
func (r *ProgramRepo) Duplicate(id, trainerID int64) (*model.Program, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Clone program row
	var newProgram model.Program
	err = tx.QueryRowx(`
		INSERT INTO programs (client_id, title)
		SELECT client_id, title || ' (копия)' FROM programs
		WHERE id = $1
		AND client_id IN (SELECT id FROM clients WHERE trainer_id = $2)
		RETURNING id, client_id, title, created_at
	`, id, trainerID).StructScan(&newProgram)
	if err != nil {
		return nil, err
	}

	// Clone days
	days := make([]model.WorkoutDay, 0)
	err = tx.Select(&days, `SELECT * FROM workout_days WHERE program_id = $1 ORDER BY day_number`, id)
	if err != nil {
		return nil, err
	}

	for _, day := range days {
		var newDayID int64
		err = tx.QueryRowx(`
			INSERT INTO workout_days (program_id, day_number, title) VALUES ($1, $2, $3)
			RETURNING id
		`, newProgram.ID, day.DayNumber, day.Title).Scan(&newDayID)
		if err != nil {
			return nil, err
		}

		// Clone exercises for this day
		exercises := make([]model.Exercise, 0)
		if err = tx.Select(&exercises, `SELECT * FROM exercises WHERE workout_day_id = $1 ORDER BY order_index`, day.ID); err != nil {
			return nil, err
		}
		for _, ex := range exercises {
			if _, err = tx.Exec(`
				INSERT INTO exercises (workout_day_id, name, sets, reps, weight, note, order_index)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
			`, newDayID, ex.Name, ex.Sets, ex.Reps, ex.Weight, ex.Note, ex.Order); err != nil {
				return nil, err
			}
		}

		newDay := model.WorkoutDay{ID: newDayID, ProgramID: newProgram.ID, DayNumber: day.DayNumber, Title: day.Title, Exercises: exercises}
		// Update exercise WorkoutDayID to newDayID for the returned struct
		for i := range newDay.Exercises {
			newDay.Exercises[i].WorkoutDayID = newDayID
		}
		newProgram.WorkoutDays = append(newProgram.WorkoutDays, newDay)
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return &newProgram, nil
}
