import type { Exercise } from '@/types'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import s from './ExerciseRow.module.scss'

interface Props {
  exercise: Exercise
  isFirst: boolean
  isLast: boolean
  noteClass: string
  onEdit: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export default function ExerciseRow({ exercise, isFirst, isLast, noteClass, onEdit, onDelete, onMoveUp, onMoveDown }: Props) {
  return (
    <tr>
      <td>
        {exercise.name}
        {exercise.note && <div className={noteClass}>{exercise.note}</div>}
      </td>
      <td>{exercise.sets}</td>
      <td>{exercise.reps}</td>
      <td>{exercise.weight > 0 ? `${exercise.weight} кг` : '—'}</td>
      <td>
        <div className={s.actions}>
          <button className={s.moveBtn} onClick={onMoveUp} disabled={isFirst} title="Вверх">▲</button>
          <button className={s.moveBtn} onClick={onMoveDown} disabled={isLast} title="Вниз">▼</button>
          <LoadingButton variant="smSecondary" onClick={onEdit}>✏️</LoadingButton>
          <LoadingButton variant="smDanger" onClick={onDelete}>✕</LoadingButton>
        </div>
      </td>
    </tr>
  )
}
