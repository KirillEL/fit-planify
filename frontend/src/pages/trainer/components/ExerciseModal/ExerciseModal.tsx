import Modal from '@/components/Modal/Modal'
import FormField from '@/components/FormField/FormField'
import Stepper from '@/components/Stepper/Stepper'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import s from './ExerciseModal.module.scss'

export const EXERCISE_PRESETS = [
  'Приседания', 'Жим лёжа', 'Становая тяга', 'Подтягивания', 'Отжимания',
  'Жим стоя', 'Тяга верхнего блока', 'Жим ногами', 'Скручивания', 'Планка',
  'Выпады', 'Тяга в наклоне', 'Подъём на бицепс', 'Французский жим',
  'Гиперэкстензия', 'Бег', 'Прыжки на скакалке',
]

export interface ExerciseForm {
  name: string
  sets: number
  reps: number
  weight: number
  note: string
}

interface Props {
  mode: 'add' | 'edit'
  form: ExerciseForm
  nameError: string
  loading: boolean
  onFormChange: (patch: Partial<ExerciseForm>) => void
  onSubmit: () => void
  onClose: () => void
}

export default function ExerciseModal({ mode, form, nameError, loading, onFormChange, onSubmit, onClose }: Props) {
  return (
    <Modal title={mode === 'add' ? 'Добавить упражнение' : 'Редактировать упражнение'} onClose={onClose}>
      <div>
        <span className={s.presetsLabel}>Популярные</span>
        <div className={s.presets}>
          {EXERCISE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${s.preset} ${form.name === preset ? s.presetActive : ''}`}
              onClick={() => onFormChange({ name: preset })}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
      <FormField label="Название" error={nameError}>
        <input
          value={form.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder={mode === 'add' ? 'или введите своё...' : undefined}
          enterKeyHint="next"
        />
      </FormField>
      <div className={s.stepperRow}>
        <Stepper label="Подходы" value={form.sets} onChange={(v) => onFormChange({ sets: v })} min={1} max={20} />
        <Stepper label="Повторения" value={form.reps} onChange={(v) => onFormChange({ reps: v })} min={1} max={100} />
        <Stepper label="Вес (кг)" value={form.weight} onChange={(v) => onFormChange({ weight: v })} min={0} max={500} step={2.5} />
      </div>
      <FormField label="Заметка (необязательно)">
        <input
          value={form.note}
          onChange={(e) => onFormChange({ note: e.target.value })}
          placeholder={mode === 'add' ? 'Медленный негатив, контроль' : undefined}
          enterKeyHint="done"
        />
      </FormField>
      <LoadingButton loading={loading} onClick={onSubmit}>
        {mode === 'add' ? 'Добавить' : 'Сохранить'}
      </LoadingButton>
    </Modal>
  )
}
