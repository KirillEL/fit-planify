import type { Exercise, WorkoutDay } from '@/types'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import ExerciseRow from '../ExerciseRow/ExerciseRow'
import s from './DayCard.module.scss'

interface Props {
  day: WorkoutDay
  programId: number
  onEditDay: (day: WorkoutDay, programId: number) => void
  onDeleteDay: (day: WorkoutDay & { programId: number }) => void
  onAddExercise: (programId: number, dayId: number) => void
  onEditExercise: (exercise: Exercise, programId: number, dayId: number) => void
  onDeleteExercise: (exercise: Exercise & { programId: number; dayId: number }) => void
  onMoveExercise: (exerciseId: number, direction: 'up' | 'down', dayId: number, programId: number) => void
}

export default function DayCard({ day, programId, onEditDay, onDeleteDay, onAddExercise, onEditExercise, onDeleteExercise, onMoveExercise }: Props) {
  const exercises = day.exercises ?? []

  return (
    <div className={s.dayCard}>
      <div className={s.dayHeader}>
        <b>{day.title}</b>
        <div className={s.dayActions}>
          <LoadingButton variant="smSecondary" onClick={() => onEditDay(day, programId)}>✏️</LoadingButton>
          <LoadingButton variant="smDanger" onClick={() => onDeleteDay({ ...day, programId })}>✕</LoadingButton>
        </div>
      </div>

      <div className={s.dayBody}>
        {exercises.length > 0 ? (
          <table className={s.exerciseTable}>
            <thead>
              <tr><th>Упражнение</th><th>Подх.</th><th>Повт.</th><th>Вес</th><th></th></tr>
            </thead>
            <tbody>
              {exercises.map((e, idx) => (
                <ExerciseRow
                  key={e.id}
                  exercise={e}
                  isFirst={idx === 0}
                  isLast={idx === exercises.length - 1}
                  noteClass={s.note}
                  onEdit={() => onEditExercise(e, programId, day.id)}
                  onDelete={() => onDeleteExercise({ ...e, programId, dayId: day.id })}
                  onMoveUp={() => onMoveExercise(e.id, 'up', day.id, programId)}
                  onMoveDown={() => onMoveExercise(e.id, 'down', day.id, programId)}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <p className={s.dayEmpty}>Нет упражнений — нажмите «+ Упражнение»</p>
        )}

        <LoadingButton variant="sm" onClick={() => onAddExercise(programId, day.id)}>+ Упражнение</LoadingButton>
      </div>
    </div>
  )
}
