import type { Exercise, Program, WorkoutDay } from '@/types'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import DayCard from '../DayCard/DayCard'
import s from './ProgramCard.module.scss'

interface Props {
  program: Program
  onEditProgram: (program: Program) => void
  onDeleteProgram: (program: Program) => void
  onDuplicateProgram: (programId: number) => void
  onAddDay: (programId: number) => void
  onEditDay: (day: WorkoutDay, programId: number) => void
  onDeleteDay: (day: WorkoutDay & { programId: number }) => void
  onAddExercise: (programId: number, dayId: number) => void
  onEditExercise: (exercise: Exercise, programId: number, dayId: number) => void
  onDeleteExercise: (exercise: Exercise & { programId: number; dayId: number }) => void
  onMoveExercise: (exerciseId: number, direction: 'up' | 'down', dayId: number, programId: number) => void
}

export default function ProgramCard({
  program,
  onEditProgram,
  onDeleteProgram,
  onDuplicateProgram,
  onAddDay,
  onEditDay,
  onDeleteDay,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
  onMoveExercise,
}: Props) {
  return (
    <div className={s.programCard}>
      <div className={s.programHeader}>
        <h3>{program.title}</h3>
        <div className={s.programActions}>
          <LoadingButton variant="secondary" onClick={() => onDuplicateProgram(program.id)}>📋</LoadingButton>
          <LoadingButton variant="secondary" onClick={() => onEditProgram(program)}>✏️</LoadingButton>
          <LoadingButton variant="danger" onClick={() => onDeleteProgram(program)}>🗑</LoadingButton>
        </div>
      </div>

      {program.workout_days?.map((d) => (
        <DayCard
          key={d.id}
          day={d}
          programId={program.id}
          onEditDay={onEditDay}
          onDeleteDay={onDeleteDay}
          onAddExercise={onAddExercise}
          onEditExercise={onEditExercise}
          onDeleteExercise={onDeleteExercise}
          onMoveExercise={onMoveExercise}
        />
      ))}

      <LoadingButton onClick={() => onAddDay(program.id)}>+ День</LoadingButton>
    </div>
  )
}
