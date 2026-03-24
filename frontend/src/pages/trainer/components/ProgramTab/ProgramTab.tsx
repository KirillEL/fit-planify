import type { Exercise, Program, WorkoutDay } from '@/types'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import ProgramCard from '../ProgramCard/ProgramCard'
import s from './ProgramTab.module.scss'

interface Props {
  programs: Program[]
  programTitle: string
  creatingProgram: boolean
  onProgramTitleChange: (value: string) => void
  onCreateProgram: () => void
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

export default function ProgramTab({
  programs,
  programTitle,
  creatingProgram,
  onProgramTitleChange,
  onCreateProgram,
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
    <div>
      <div className={s.addRow}>
        <input
          value={programTitle}
          onChange={(e) => onProgramTitleChange(e.target.value)}
          placeholder="Название программы"
          enterKeyHint="done"
          onKeyDown={(e) => e.key === 'Enter' && onCreateProgram()}
        />
        <LoadingButton loading={creatingProgram} onClick={onCreateProgram}>Создать</LoadingButton>
      </div>

      {programs.length === 0 && (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>📋</span>
          <p className={s.emptyTitle}>Нет программ</p>
          <p className={s.emptyHint}>Введите название программы выше и нажмите «Создать»</p>
        </div>
      )}

      {programs.map((p) => (
        <ProgramCard
          key={p.id}
          program={p}
          onEditProgram={onEditProgram}
          onDeleteProgram={onDeleteProgram}
          onDuplicateProgram={onDuplicateProgram}
          onAddDay={onAddDay}
          onEditDay={onEditDay}
          onDeleteDay={onDeleteDay}
          onAddExercise={onAddExercise}
          onEditExercise={onEditExercise}
          onDeleteExercise={onDeleteExercise}
          onMoveExercise={onMoveExercise}
        />
      ))}
    </div>
  )
}
