package repository

import (
	"github.com/jmoiron/sqlx"
	"github.com/planify/api/internal/model"
)

// GetByClientIDFull fetches all programs for a client with their days and
// exercises using 3 queries instead of 1+N+N*M, then assembles the tree in memory.
func (r *ProgramRepo) GetByClientIDFull(clientID int64) ([]model.Program, error) {
	programs, err := r.GetByClientID(clientID)
	if err != nil || len(programs) == 0 {
		return programs, err
	}

	programIDs := make([]int64, len(programs))
	for i, p := range programs {
		programIDs[i] = p.ID
	}

	query, args, err := sqlx.In(
		`SELECT * FROM workout_days WHERE program_id IN (?) ORDER BY program_id, day_number`,
		programIDs,
	)
	if err != nil {
		return nil, err
	}
	var allDays []model.WorkoutDay
	if err := r.db.Select(&allDays, r.db.Rebind(query), args...); err != nil {
		return nil, err
	}

	dayIDs := make([]int64, len(allDays))
	daysByProgram := make(map[int64][]model.WorkoutDay)
	for i, d := range allDays {
		dayIDs[i] = d.ID
		daysByProgram[d.ProgramID] = append(daysByProgram[d.ProgramID], d)
	}

	exercisesByDay := make(map[int64][]model.Exercise)
	if len(dayIDs) > 0 {
		exQuery, exArgs, err := sqlx.In(
			`SELECT * FROM exercises WHERE workout_day_id IN (?) ORDER BY workout_day_id, order_index`,
			dayIDs,
		)
		if err != nil {
			return nil, err
		}
		var allExercises []model.Exercise
		if err := r.db.Select(&allExercises, r.db.Rebind(exQuery), exArgs...); err != nil {
			return nil, err
		}
		for _, e := range allExercises {
			exercisesByDay[e.WorkoutDayID] = append(exercisesByDay[e.WorkoutDayID], e)
		}
	}

	for i := range programs {
		days := daysByProgram[programs[i].ID]
		for j := range days {
			days[j].Exercises = exercisesByDay[days[j].ID]
			if days[j].Exercises == nil {
				days[j].Exercises = []model.Exercise{}
			}
		}
		programs[i].WorkoutDays = days
		if programs[i].WorkoutDays == nil {
			programs[i].WorkoutDays = []model.WorkoutDay{}
		}
	}
	return programs, nil
}

// GetByIDFull fetches a single program with all its days and exercises using
// 3 queries and assembles the tree in memory.
func (r *ProgramRepo) GetByIDFull(id int64) (*model.Program, error) {
	p, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}
	days, err := r.GetDays(p.ID)
	if err != nil {
		return nil, err
	}
	if len(days) == 0 {
		p.WorkoutDays = []model.WorkoutDay{}
		return p, nil
	}

	dayIDs := make([]int64, len(days))
	for i, d := range days {
		dayIDs[i] = d.ID
	}

	exQuery, exArgs, err := sqlx.In(
		`SELECT * FROM exercises WHERE workout_day_id IN (?) ORDER BY workout_day_id, order_index`,
		dayIDs,
	)
	if err != nil {
		return nil, err
	}
	var allExercises []model.Exercise
	if err := r.db.Select(&allExercises, r.db.Rebind(exQuery), exArgs...); err != nil {
		return nil, err
	}

	exercisesByDay := make(map[int64][]model.Exercise)
	for _, e := range allExercises {
		exercisesByDay[e.WorkoutDayID] = append(exercisesByDay[e.WorkoutDayID], e)
	}

	for i := range days {
		days[i].Exercises = exercisesByDay[days[i].ID]
		if days[i].Exercises == nil {
			days[i].Exercises = []model.Exercise{}
		}
	}
	p.WorkoutDays = days
	return p, nil
}

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

// ReorderExercises updates order_index for all exercises in a day in one transaction.
// orderIDs is a slice of exercise IDs in the desired order (index 0 → order_index 1).
// Ownership is verified: the day must belong to a program owned by trainerID.
func (r *ProgramRepo) ReorderExercises(dayID, trainerID int64, orderIDs []int64) error {
	var check int64
	err := r.db.QueryRowx(`
		SELECT d.id FROM workout_days d
		JOIN programs p ON p.id = d.program_id
		JOIN clients c ON c.id = p.client_id
		WHERE d.id = $1 AND c.trainer_id = $2
	`, dayID, trainerID).Scan(&check)
	if err != nil {
		return err
	}

	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for i, exID := range orderIDs {
		if _, err := tx.Exec(`
			UPDATE exercises SET order_index = $1
			WHERE id = $2 AND workout_day_id = $3
		`, i+1, exID, dayID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// CopyToClient clones a program into a different client of the same trainer.
func (r *ProgramRepo) CopyToClient(programID, trainerID, targetClientID int64) (*model.Program, error) {
	tx, err := r.db.Beginx()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Verify source program belongs to trainer and get its title
	var sourceProgram model.Program
	err = tx.QueryRowx(`
		SELECT p.* FROM programs p
		JOIN clients c ON c.id = p.client_id
		WHERE p.id = $1 AND c.trainer_id = $2
	`, programID, trainerID).StructScan(&sourceProgram)
	if err != nil {
		return nil, err
	}

	// Verify target client belongs to the same trainer
	var targetCheck int64
	err = tx.QueryRowx(
		`SELECT id FROM clients WHERE id = $1 AND trainer_id = $2`,
		targetClientID, trainerID,
	).Scan(&targetCheck)
	if err != nil {
		return nil, err
	}

	// Clone program into target client (same title, no suffix)
	var newProgram model.Program
	err = tx.QueryRowx(`
		INSERT INTO programs (client_id, title) VALUES ($1, $2)
		RETURNING id, client_id, title, created_at
	`, targetClientID, sourceProgram.Title).StructScan(&newProgram)
	if err != nil {
		return nil, err
	}

	// Clone days and exercises
	days := make([]model.WorkoutDay, 0)
	if err = tx.Select(&days, `SELECT * FROM workout_days WHERE program_id = $1 ORDER BY day_number`, programID); err != nil {
		return nil, err
	}
	for _, day := range days {
		var newDayID int64
		if err = tx.QueryRowx(`
			INSERT INTO workout_days (program_id, day_number, title) VALUES ($1, $2, $3)
			RETURNING id
		`, newProgram.ID, day.DayNumber, day.Title).Scan(&newDayID); err != nil {
			return nil, err
		}
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
		newDay := model.WorkoutDay{ID: newDayID, ProgramID: newProgram.ID, DayNumber: day.DayNumber, Title: day.Title}
		newDay.Exercises = make([]model.Exercise, len(exercises))
		for i, ex := range exercises {
			ex.WorkoutDayID = newDayID
			newDay.Exercises[i] = ex
		}
		newProgram.WorkoutDays = append(newProgram.WorkoutDays, newDay)
	}

	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return &newProgram, nil
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
