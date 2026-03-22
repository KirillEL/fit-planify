CREATE TABLE IF NOT EXISTS trainers (
    id          BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    username    VARCHAR(255) DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
    id           BIGSERIAL PRIMARY KEY,
    trainer_id   BIGINT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    telegram_id  BIGINT,
    name         VARCHAR(255) NOT NULL,
    invite_token VARCHAR(64) UNIQUE NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
    id         BIGSERIAL PRIMARY KEY,
    client_id  BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_days (
    id         BIGSERIAL PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    title      VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
    id             BIGSERIAL PRIMARY KEY,
    workout_day_id BIGINT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    sets           INT DEFAULT 0,
    reps           INT DEFAULT 0,
    weight         NUMERIC(6,2) DEFAULT 0,
    note           TEXT DEFAULT '',
    order_index    INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
    id              BIGSERIAL PRIMARY KEY,
    client_id       BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_paid         BOOLEAN DEFAULT FALSE,
    paid_at         TIMESTAMPTZ,
    next_payment_at TIMESTAMPTZ,
    note            TEXT DEFAULT '',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_trainer_id ON clients(trainer_id);
CREATE INDEX IF NOT EXISTS idx_clients_invite_token ON clients(invite_token);
CREATE INDEX IF NOT EXISTS idx_programs_client_id ON programs(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_program_id ON workout_days(program_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_day_id ON exercises(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_is_paid ON payments(is_paid);
