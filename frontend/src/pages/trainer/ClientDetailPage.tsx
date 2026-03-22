import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addDay, addExercise, createProgram, deleteDay,
  deleteExercise, deleteProgram, getClient, getClientPrograms,
  markPaid, createPayment, getPayments,
} from '../../api/client'
import type { Payment, Program, WorkoutDay, Exercise } from '../../types'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import LoadingButton from '../../components/LoadingButton/LoadingButton'
import Modal from '../../components/Modal/Modal'
import FormField from '../../components/FormField/FormField'
import Stepper from '../../components/Stepper/Stepper'
import s from './ClientDetailPage.module.scss'

const EXERCISE_PRESETS = [
  'Приседания', 'Жим лёжа', 'Становая тяга', 'Подтягивания', 'Отжимания',
  'Жим стоя', 'Тяга верхнего блока', 'Жим ногами', 'Скручивания', 'Планка',
  'Выпады', 'Тяга в наклоне', 'Подъём на бицепс', 'Французский жим',
  'Гиперэкстензия', 'Бег', 'Прыжки на скакалке',
]

interface ExerciseForm {
  name: string
  sets: number
  reps: number
  weight: number
  note: string
}

interface PaymentForm {
  amount: string
  note: string
  date: string
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()

  const [clientName, setClientName] = useState('')
  const [programs, setPrograms] = useState<Program[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [tab, setTab] = useState<'program' | 'payments'>('program')

  // Program creation
  const [programTitle, setProgramTitle] = useState('')
  const [creatingProgram, setCreatingProgram] = useState(false)

  // Day modal
  const [dayModalForProgram, setDayModalForProgram] = useState<number | null>(null)
  const [dayTitle, setDayTitle] = useState('')
  const [dayTitleError, setDayTitleError] = useState('')
  const [addingDay, setAddingDay] = useState(false)

  // Exercise modal
  const [exerciseModal, setExerciseModal] = useState<{ programId: number; dayId: number } | null>(null)
  const [exForm, setExForm] = useState<ExerciseForm>({ name: '', sets: 3, reps: 10, weight: 0, note: '' })
  const [exNameError, setExNameError] = useState('')
  const [addingExercise, setAddingExercise] = useState(false)

  // Payment modal
  const [paymentModal, setPaymentModal] = useState(false)
  const [payForm, setPayForm] = useState<PaymentForm>({ amount: '', note: '', date: '' })
  const [payErrors, setPayErrors] = useState<{ amount?: string }>({})
  const [creatingPayment, setCreatingPayment] = useState(false)

  // Confirm deletions
  const [confirmDeleteProgram, setConfirmDeleteProgram] = useState<Program | null>(null)
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<{ id: number; title: string; programId: number } | null>(null)
  const [confirmDeleteExercise, setConfirmDeleteExercise] = useState<{ id: number; name: string; programId: number; dayId: number } | null>(null)

  // Payment loading
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null)

  useEffect(() => {
    getClient(clientId).then((r) => setClientName(r.data.name))
    getClientPrograms(clientId).then((r) => setPrograms(r.data))
    getPayments(clientId).then((r) => setPayments(r.data))
  }, [clientId])

  // --- Program ---

  const handleCreateProgram = async () => {
    if (!programTitle.trim()) return
    setCreatingProgram(true)
    const r = await createProgram(clientId, programTitle.trim())
    setPrograms((prev) => [r.data, ...prev])
    setProgramTitle('')
    setCreatingProgram(false)
  }

  const handleDeleteProgram = async (program: Program) => {
    await deleteProgram(program.id)
    setPrograms((prev) => prev.filter((p) => p.id !== program.id))
    setConfirmDeleteProgram(null)
  }

  // --- Day ---

  const openDayModal = (programId: number) => {
    setDayTitle('')
    setDayTitleError('')
    setDayModalForProgram(programId)
  }

  const handleAddDay = async () => {
    if (!dayTitle.trim()) {
      setDayTitleError('Введите название дня')
      return
    }
    setAddingDay(true)
    const programId = dayModalForProgram!
    const program = programs.find((p) => p.id === programId)!
    const dayNumber = (program.workout_days?.length ?? 0) + 1
    const r = await addDay(programId, dayNumber, dayTitle.trim())
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId
          ? { ...p, workout_days: [...(p.workout_days ?? []), { ...r.data, exercises: [] }] }
          : p
      )
    )
    setDayModalForProgram(null)
    setAddingDay(false)
  }

  const handleDeleteDay = async (day: WorkoutDay & { programId: number }) => {
    await deleteDay(day.id)
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === day.programId
          ? { ...p, workout_days: p.workout_days?.filter((d) => d.id !== day.id) }
          : p
      )
    )
    setConfirmDeleteDay(null)
  }

  // --- Exercise ---

  const openExerciseModal = (programId: number, dayId: number) => {
    setExForm({ name: '', sets: 3, reps: 10, weight: 0, note: '' })
    setExNameError('')
    setExerciseModal({ programId, dayId })
  }

  const handleAddExercise = async () => {
    if (!exForm.name.trim()) {
      setExNameError('Введите название упражнения')
      return
    }
    setAddingExercise(true)
    const { programId, dayId } = exerciseModal!
    const r = await addExercise(dayId, {
      name: exForm.name.trim(),
      sets: exForm.sets,
      reps: exForm.reps,
      weight: exForm.weight,
      note: exForm.note.trim(),
    })
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId
          ? {
              ...p,
              workout_days: p.workout_days?.map((d) =>
                d.id === dayId
                  ? { ...d, exercises: [...(d.exercises ?? []), r.data] }
                  : d
              ),
            }
          : p
      )
    )
    setExerciseModal(null)
    setAddingExercise(false)
  }

  const handleDeleteExercise = async (ex: Exercise & { programId: number; dayId: number }) => {
    await deleteExercise(ex.id)
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === ex.programId
          ? {
              ...p,
              workout_days: p.workout_days?.map((d) =>
                d.id === ex.dayId
                  ? { ...d, exercises: d.exercises?.filter((e) => e.id !== ex.id) }
                  : d
              ),
            }
          : p
      )
    )
    setConfirmDeleteExercise(null)
  }

  // --- Payment ---

  const openPaymentModal = () => {
    setPayForm({ amount: '', note: '', date: '' })
    setPayErrors({})
    setPaymentModal(true)
  }

  const handleCreatePayment = async () => {
    if (!payForm.amount || isNaN(Number(payForm.amount)) || Number(payForm.amount) <= 0) {
      setPayErrors({ amount: 'Введите сумму' })
      return
    }
    setCreatingPayment(true)
    const r = await createPayment(clientId, {
      amount: Number(payForm.amount),
      note: payForm.note.trim(),
      next_payment_at: payForm.date ? new Date(payForm.date).toISOString() : null,
    })
    setPayments((prev) => [r.data, ...prev])
    setPaymentModal(false)
    setCreatingPayment(false)
  }

  const handleMarkPaid = async (paymentId: number) => {
    setMarkingPaidId(paymentId)
    await markPaid(paymentId)
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, is_paid: true } : p)))
    setMarkingPaidId(null)
  }

  return (
    <div className={s.page}>
      {/* ─── Header ─── */}
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => navigate('/trainer')}>← Назад</button>
        {clientName && <h1 className={s.clientTitle}>{clientName}</h1>}
      </div>

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === 'program' ? s.active : ''}`}
          onClick={() => setTab('program')}
        >
          💪 Программа
        </button>
        <button
          className={`${s.tab} ${tab === 'payments' ? s.active : ''}`}
          onClick={() => setTab('payments')}
        >
          💳 Оплаты
        </button>
      </div>

      {/* ─── Program tab ─── */}
      {tab === 'program' && (
        <div>
          <div className={s.addRow}>
            <input
              value={programTitle}
              onChange={(e) => setProgramTitle(e.target.value)}
              placeholder="Название программы"
              enterKeyHint="done"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProgram()}
            />
            <LoadingButton loading={creatingProgram} onClick={handleCreateProgram}>
              Создать
            </LoadingButton>
          </div>

          {programs.length === 0 && (
            <div className={s.emptyState}>
              <span className={s.emptyIcon}>📋</span>
              <p className={s.emptyTitle}>Нет программ</p>
              <p className={s.emptyHint}>Введите название программы выше и нажмите «Создать»</p>
            </div>
          )}

          {programs.map((p) => (
            <div key={p.id} className={s.programCard}>
              <div className={s.programHeader}>
                <h3>{p.title}</h3>
                <LoadingButton variant="danger" onClick={() => setConfirmDeleteProgram(p)}>
                  🗑
                </LoadingButton>
              </div>

              {p.workout_days?.map((d) => (
                <div key={d.id} className={s.dayCard}>
                  <div className={s.dayHeader}>
                    <b>{d.title}</b>
                    <LoadingButton
                      variant="smDanger"
                      onClick={() => setConfirmDeleteDay({ id: d.id, title: d.title, programId: p.id })}
                    >
                      ✕
                    </LoadingButton>
                  </div>

                  {d.exercises && d.exercises.length > 0 ? (
                    <table className={s.exerciseTable}>
                      <thead>
                        <tr><th>Упражнение</th><th>Подх.</th><th>Повт.</th><th>Вес</th><th></th></tr>
                      </thead>
                      <tbody>
                        {d.exercises.map((e) => (
                          <tr key={e.id}>
                            <td>
                              {e.name}
                              {e.note && <div className={s.note}>{e.note}</div>}
                            </td>
                            <td>{e.sets}</td>
                            <td>{e.reps}</td>
                            <td>{e.weight > 0 ? `${e.weight} кг` : '—'}</td>
                            <td>
                              <LoadingButton
                                variant="smDanger"
                                onClick={() => setConfirmDeleteExercise({ id: e.id, name: e.name, programId: p.id, dayId: d.id })}
                              >
                                ✕
                              </LoadingButton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className={s.dayEmpty}>Нет упражнений — нажмите «+ Упражнение»</p>
                  )}

                  <LoadingButton variant="sm" onClick={() => openExerciseModal(p.id, d.id)}>
                    + Упражнение
                  </LoadingButton>
                </div>
              ))}

              <LoadingButton onClick={() => openDayModal(p.id)}>+ День</LoadingButton>
            </div>
          ))}
        </div>
      )}

      {/* ─── Payments tab ─── */}
      {tab === 'payments' && (
        <div>
          <div className={s.addRow}>
            <LoadingButton onClick={openPaymentModal}>+ Добавить платёж</LoadingButton>
          </div>

          {payments.length === 0 && (
            <div className={s.emptyState}>
              <span className={s.emptyIcon}>💳</span>
              <p className={s.emptyTitle}>Нет платежей</p>
              <p className={s.emptyHint}>Нажмите «+ Добавить платёж» чтобы создать запись об оплате</p>
            </div>
          )}

          {payments.map((p) => (
            <div key={p.id} className={`${s.paymentCard} ${p.is_paid ? s.paid : s.unpaid}`}>
              <div className={s.paymentInfo}>
                <span className={s.paymentAmount}>{p.amount} ₽</span>
                {p.note && <span className={s.paymentNote}>{p.note}</span>}
              </div>
              <div className={s.paymentRight}>
                <span className={s.paymentStatus}>{p.is_paid ? '✅ Оплачено' : '⏳ Не оплачено'}</span>
                {!p.is_paid && (
                  <LoadingButton
                    variant="sm"
                    loading={markingPaidId === p.id}
                    onClick={() => handleMarkPaid(p.id)}
                  >
                    Оплачено
                  </LoadingButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Day modal ─── */}
      {dayModalForProgram !== null && (
        <Modal title="Добавить день" onClose={() => setDayModalForProgram(null)}>
          <FormField label="Название дня" error={dayTitleError}>
            <input
              value={dayTitle}
              onChange={(e) => { setDayTitle(e.target.value); setDayTitleError('') }}
              placeholder="День 1 — Ноги"
              enterKeyHint="done"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDay()}
              autoFocus
            />
          </FormField>
          <LoadingButton loading={addingDay} onClick={handleAddDay}>
            Добавить
          </LoadingButton>
        </Modal>
      )}

      {/* ─── Exercise modal ─── */}
      {exerciseModal && (
        <Modal title="Добавить упражнение" onClose={() => setExerciseModal(null)}>
          {/* Presets */}
          <div>
            <span className={s.presetsLabel}>Популярные</span>
            <div className={s.presets}>
              {EXERCISE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${s.preset} ${exForm.name === p ? s.presetActive : ''}`}
                  onClick={() => { setExForm((f) => ({ ...f, name: p })); setExNameError('') }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <FormField label="Название" error={exNameError}>
            <input
              value={exForm.name}
              onChange={(e) => { setExForm((f) => ({ ...f, name: e.target.value })); setExNameError('') }}
              placeholder="или введите своё..."
              enterKeyHint="next"
            />
          </FormField>

          <div className={s.stepperRow}>
            <Stepper
              label="Подходы"
              value={exForm.sets}
              onChange={(v) => setExForm((f) => ({ ...f, sets: v }))}
              min={1}
              max={20}
            />
            <Stepper
              label="Повторения"
              value={exForm.reps}
              onChange={(v) => setExForm((f) => ({ ...f, reps: v }))}
              min={1}
              max={100}
            />
            <Stepper
              label="Вес (кг)"
              value={exForm.weight}
              onChange={(v) => setExForm((f) => ({ ...f, weight: v }))}
              min={0}
              max={500}
              step={2.5}
            />
          </div>

          <FormField label="Заметка (необязательно)">
            <input
              value={exForm.note}
              onChange={(e) => setExForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Медленный негатив, контроль"
              enterKeyHint="done"
            />
          </FormField>

          <LoadingButton loading={addingExercise} onClick={handleAddExercise}>
            Добавить
          </LoadingButton>
        </Modal>
      )}

      {/* ─── Payment modal ─── */}
      {paymentModal && (
        <Modal title="Добавить платёж" onClose={() => setPaymentModal(false)}>
          <FormField label="Сумма (₽)" error={payErrors.amount}>
            <input
              type="text"
              inputMode="decimal"
              value={payForm.amount}
              onChange={(e) => { setPayForm((f) => ({ ...f, amount: e.target.value })); setPayErrors({}) }}
              placeholder="5000"
              enterKeyHint="next"
              autoFocus
            />
          </FormField>
          <FormField label="Описание (необязательно)">
            <input
              value={payForm.note}
              onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Абонемент — апрель"
              enterKeyHint="next"
            />
          </FormField>
          <FormField label="Дата следующего платежа (необязательно)">
            <input
              type="date"
              value={payForm.date}
              onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))}
            />
          </FormField>
          <LoadingButton loading={creatingPayment} onClick={handleCreatePayment}>
            Добавить
          </LoadingButton>
        </Modal>
      )}

      {/* ─── Confirm dialogs ─── */}
      {confirmDeleteProgram && (
        <ConfirmDialog
          message={`Удалить программу «${confirmDeleteProgram.title}»?`}
          onConfirm={() => handleDeleteProgram(confirmDeleteProgram)}
          onCancel={() => setConfirmDeleteProgram(null)}
        />
      )}
      {confirmDeleteDay && (
        <ConfirmDialog
          message={`Удалить день «${confirmDeleteDay.title}»?`}
          onConfirm={() => handleDeleteDay({ ...confirmDeleteDay } as WorkoutDay & { programId: number })}
          onCancel={() => setConfirmDeleteDay(null)}
        />
      )}
      {confirmDeleteExercise && (
        <ConfirmDialog
          message={`Удалить упражнение «${confirmDeleteExercise.name}»?`}
          onConfirm={() => handleDeleteExercise({ ...confirmDeleteExercise } as Exercise & { programId: number; dayId: number })}
          onCancel={() => setConfirmDeleteExercise(null)}
        />
      )}
    </div>
  )
}
