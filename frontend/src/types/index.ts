export interface Trainer {
  id: number
  telegram_id: number
  name: string
  username: string
  created_at: string
}

export interface Client {
  id: number
  trainer_id: number
  telegram_id: number | null
  name: string
  invite_token: string
  created_at: string
}

export interface Exercise {
  id: number
  workout_day_id: number
  name: string
  sets: number
  reps: number
  weight: number
  note: string
  order: number
}

export interface WorkoutDay {
  id: number
  program_id: number
  day_number: number
  title: string
  exercises?: Exercise[]
}

export interface Program {
  id: number
  client_id: number
  title: string
  created_at: string
  workout_days?: WorkoutDay[]
}

export interface Payment {
  id: number
  client_id: number
  amount: number
  is_paid: boolean
  paid_at: string | null
  next_payment_at: string | null
  note: string
  created_at: string
}
