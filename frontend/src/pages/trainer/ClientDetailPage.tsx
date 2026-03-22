import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  addDay, addExercise, createProgram, deleteDay,
  deleteExercise, deleteProgram, getClient, getClientPrograms,
  markPaid, createPayment, getPayments,
  updateClient, updateProgram, updateDay, updateExercise,
} from '../../api/client'
import type { Payment, Program, WorkoutDay, Exercise } from '../../types'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import LoadingButton from '../../components/LoadingButton/LoadingButton'
import Modal from '../../components/Modal/Modal'
import FormField from '../../components/FormField/FormField'
import Stepper from '../../components/Stepper/Stepper'
import Toast from '../../components/Toast/Toast'
import s from './ClientDetailPage.module.scss'

const EXERCISE_PRESETS = [
  'Приседания', 'Жим лёжа', 'Становая тяга', 'Подтягивания', 'Отжимания',
  'Жим стоя', 'Тяга верхнего блока', 'Жим ногами', 'Скручивания', 'Планка',
  'Выпады', 'Тяга в наклоне', 'Подъём на бицепс', 'Французский жим',
  'Гиперэкстензия', 'Бег', 'Прыжки на скакалке',
]

interface ExerciseForm { name: string; sets: number; reps: number; weight: number; note: string }
interface PaymentForm { amount: string; note: string; date: string }
interface ToastState { message: string; type: 'success' | 'error' }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()

  const [clientName, setClientName] = useState('')
  const [programs, setPrograms] = useState<Program[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [tab, setTab] = useState<'program' | 'payments'>('program')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Edit client name
  const [editClientModal, setEditClientModal] = useState(false)
  const [editClientName, setEditClientName] = useState('')
  const [savingClient, setSavingClient] = useState(false)

  // Program creation
  const [programTitle, setProgramTitle] = useState('')
  const [creatingProgram, setCreatingProgram] = useState(false)

  // Edit program
  const [editProgramModal, setEditProgramModal] = useState<Program | null>(null)
  const [editProgramTitle, setEditProgramTitle] = useState('')
  const [savingProgram, setSavingProgram] = useState(false)

  // Day modal
  const [dayModalForProgram, setDayModalForProgram] = useState<number | null>(null)
  const [dayTitle, setDayTitle] = useState('')
  const [dayTitleError, setDayTitleError] = useState('')
  const [addingDay, setAddingDay] = useState(false)

  // Edit day
  const [editDayModal, setEditDayModal] = useState<{ id: number; title: string; programId: number } | null>(null)
  const [editDayTitle, setEditDayTitle] = useState('')
  const [savingDay, setSavingDay] = useState(false)

  // Exercise modal
  const [exerciseModal, setExerciseModal] = useState<{ programId: number; dayId: number } | null>(null)
  const [exForm, setExForm] = useState<ExerciseForm>({ name: '', sets: 3, reps: 10, weight: 0, note: '' })
  const [exNameError, setExNameError] = useState('')
  const [addingExercise, setAddingExercise] = useState(false)

  // Edit exercise
  const [editExModal, setEditExModal] = useState<(Exercise & { programId: number; dayId: number }) | null>(null)
  const [editExForm, setEditExForm] = useState<ExerciseForm>({ name: '', sets: 3, reps: 10, weight: 0, note: '' })
  const [savingEx, setSavingEx] = useState(false)

  // Payment modal
  const [paymentModal, setPaymentModal] = useState(false)
  const [payForm, setPayForm] = useState<PaymentForm>({ amount: '', note: '', date: '' })
  const [payErrors, setPayErrors] = useState<{ amount?: string }>({})
  const [creatingPayment, setCreatingPayment] = useState(false)

  // Confirm deletions
  const [confirmDeleteProgram, setConfirmDeleteProgram] = useState<Program | null>(null)
  const [confirmDeleteDay, setConfirmDeleteDay] = useState<{ id: number; title: string; programId: number } | null>(null)
  const [confirmDeleteExercise, setConfirmDeleteExercise] = useState<{ id: number; name: string; programId: number; dayId: number } | null>(null)

  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null)

  const showError = (msg: string) => setToast({ message: msg, type: 'error' })
  const showSuccess = (msg: string) => setToast({ message: msg, type: 'success' })

  useEffect(() => {
    Promise.all([
      getClient(clientId),
      getClientPrograms(clientId),
      getPayments(clientId),
    ])
      .then(([c, p, pay]) => {
        setClientName(c.data.name)
        setPrograms(p.data)
        setPayments(pay.data)
      })
      .catch(() => showError('Ошибка загрузки данных'))
      .finally(() => setLoading(false))
  }, [clientId])

  // --- Client ---

  const openEditClient = () => {
    setEditClientName(clientName)
    setEditClientModal(true)
  }

  const handleUpdateClient = async () => {
    if (!editClientName.trim()) return
    setSavingClient(true)
    try {
      await updateClient(clientId, editClientName.trim())
      setClientName(editClientName.trim())
      setEditClientModal(false)
      showSuccess('Имя сохранено')
    } catch {
      showError('Не удалось сохранить')
    } finally {
      setSavingClient(false)
    }
  }

  // --- Program ---

  const handleCreateProgram = async () => {
    if (!programTitle.trim()) return
    setCreatingProgram(true)
    try {
      const r = await createProgram(clientId, programTitle.trim())
      setPrograms((prev) => [{ ...r.data, workout_days: [] }, ...prev])
      setProgramTitle('')
    } catch {
      showError('Не удалось создать программу')
    } finally {
      setCreatingProgram(false)
    }
  }

  const openEditProgram = (p: Program) => {
    setEditProgramTitle(p.title)
    setEditProgramModal(p)
  }

  const handleUpdateProgram = async () => {
    if (!editProgramTitle.trim() || !editProgramModal) return
    setSavingProgram(true)
    try {
      await updateProgram(editProgramModal.id, editProgramTitle.trim())
      setPrograms((prev) => prev.map((p) => p.id === editProgramModal.id ? { ...p, title: editProgramTitle.trim() } : p))
      setEditProgramModal(null)
      showSuccess('Программа обновлена')
    } catch {
      showError('Не удалось сохранить')
    } finally {
      setSavingProgram(false)
    }
  }

  const handleDeleteProgram = async (program: Program) => {
    try {
      await deleteProgram(program.id)
      setPrograms((prev) => prev.filter((p) => p.id !== program.id))
      setConfirmDeleteProgram(null)
    } catch {
      showError('Не удалось удалить программу')
    }
  }

  // --- Day ---

  const openDayModal = (programId: number) => {
    setDayTitle('')
    setDayTitleError('')
    setDayModalForProgram(programId)
  }

  const handleAddDay = async () => {
    if (!dayTitle.trim()) { setDayTitleError('Введите название дня'); return }
    setAddingDay(true)
    const programId = dayModalForProgram!
    const program = programs.find((p) => p.id === programId)!
    const dayNumber = (program.workout_days?.length ?? 0) + 1
    try {
      const r = await addDay(programId, dayNumber, dayTitle.trim())
      setPrograms((prev) => prev.map((p) =>
        p.id === programId ? { ...p, workout_days: [...(p.workout_days ?? []), { ...r.data, exercises: [] }] } : p
      ))
      setDayModalForProgram(null)
    } catch {
      showError('Не удалось добавить день')
    } finally {
      setAddingDay(false)
    }
  }

  const openEditDay = (d: WorkoutDay, programId: number) => {
    setEditDayTitle(d.title)
    setEditDayModal({ id: d.id, title: d.title, programId })
  }

  const handleUpdateDay = async () => {
    if (!editDayTitle.trim() || !editDayModal) return
    setSavingDay(true)
    try {
      await updateDay(editDayModal.id, editDayTitle.trim())
      setPrograms((prev) => prev.map((p) =>
        p.id === editDayModal.programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === editDayModal.id ? { ...d, title: editDayTitle.trim() } : d) }
          : p
      ))
      setEditDayModal(null)
      showSuccess('День обновлён')
    } catch {
      showError('Не удалось сохранить')
    } finally {
      setSavingDay(false)
    }
  }

  const handleDeleteDay = async (day: WorkoutDay & { programId: number }) => {
    try {
      await deleteDay(day.id)
      setPrograms((prev) => prev.map((p) =>
        p.id === day.programId ? { ...p, workout_days: p.workout_days?.filter((d) => d.id !== day.id) } : p
      ))
      setConfirmDeleteDay(null)
    } catch {
      showError('Не удалось удалить день')
    }
  }

  // --- Exercise ---

  const openExerciseModal = (programId: number, dayId: number) => {
    setExForm({ name: '', sets: 3, reps: 10, weight: 0, note: '' })
    setExNameError('')
    setExerciseModal({ programId, dayId })
  }

  const handleAddExercise = async () => {
    if (!exForm.name.trim()) { setExNameError('Введите название упражнения'); return }
    setAddingExercise(true)
    const { programId, dayId } = exerciseModal!
    try {
      const r = await addExercise(dayId, { name: exForm.name.trim(), sets: exForm.sets, reps: exForm.reps, weight: exForm.weight, note: exForm.note.trim() })
      setPrograms((prev) => prev.map((p) =>
        p.id === programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === dayId ? { ...d, exercises: [...(d.exercises ?? []), r.data] } : d) }
          : p
      ))
      setExerciseModal(null)
    } catch {
      showError('Не удалось добавить упражнение')
    } finally {
      setAddingExercise(false)
    }
  }

  const openEditExercise = (e: Exercise, programId: number, dayId: number) => {
    setEditExForm({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, note: e.note })
    setEditExModal({ ...e, programId, dayId })
  }

  const handleUpdateExercise = async () => {
    if (!editExForm.name.trim() || !editExModal) return
    setSavingEx(true)
    const { id: exId, programId, dayId } = editExModal
    try {
      await updateExercise(exId, { name: editExForm.name.trim(), sets: editExForm.sets, reps: editExForm.reps, weight: editExForm.weight, note: editExForm.note.trim() })
      setPrograms((prev) => prev.map((p) =>
        p.id === programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === dayId ? { ...d, exercises: d.exercises?.map((e) => e.id === exId ? { ...e, ...editExForm, name: editExForm.name.trim() } : e) } : d) }
          : p
      ))
      setEditExModal(null)
      showSuccess('Упражнение обновлено')
    } catch {
      showError('Не удалось сохранить')
    } finally {
      setSavingEx(false)
    }
  }

  const handleDeleteExercise = async (ex: Exercise & { programId: number; dayId: number }) => {
    try {
      await deleteExercise(ex.id)
      setPrograms((prev) => prev.map((p) =>
        p.id === ex.programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === ex.dayId ? { ...d, exercises: d.exercises?.filter((e) => e.id !== ex.id) } : d) }
          : p
      ))
      setConfirmDeleteExercise(null)
    } catch {
      showError('Не удалось удалить упражнение')
    }
  }

  // --- Payment ---

  const openPaymentModal = () => {
    setPayForm({ amount: '', note: '', date: '' })
    setPayErrors({})
    setPaymentModal(true)
  }

  const handleCreatePayment = async () => {
    if (!payForm.amount || isNaN(Number(payForm.amount)) || Number(payForm.amount) <= 0) {
      setPayErrors({ amount: 'Введите сумму' }); return
    }
    setCreatingPayment(true)
    try {
      const r = await createPayment(clientId, {
        amount: Number(payForm.amount),
        note: payForm.note.trim(),
        next_payment_at: payForm.date ? new Date(payForm.date).toISOString() : null,
      })
      setPayments((prev) => [r.data, ...prev])
      setPaymentModal(false)
    } catch {
      showError('Не удалось создать платёж')
    } finally {
      setCreatingPayment(false)
    }
  }

  const handleMarkPaid = async (paymentId: number) => {
    setMarkingPaidId(paymentId)
    try {
      await markPaid(paymentId)
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, is_paid: true } : p)))
    } catch {
      showError('Не удалось отметить оплату')
    } finally {
      setMarkingPaidId(null)
    }
  }

  if (loading) return <div className={s.loader}>Загрузка...</div>

  return (
    <div className={s.page}>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      {/* ─── Header ─── */}
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => navigate('/trainer')}>← Назад</button>
        {clientName && (
          <h1 className={s.clientTitle} onClick={openEditClient} title="Нажмите для редактирования">
            {clientName} ✏️
          </h1>
        )}
      </div>

      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'program' ? s.active : ''}`} onClick={() => setTab('program')}>
          💪 Программа
        </button>
        <button className={`${s.tab} ${tab === 'payments' ? s.active : ''}`} onClick={() => setTab('payments')}>
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
            <LoadingButton loading={creatingProgram} onClick={handleCreateProgram}>Создать</LoadingButton>
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
                <div style={{ display: 'flex', gap: 6 }}>
                  <LoadingButton variant="secondary" onClick={() => openEditProgram(p)}>✏️</LoadingButton>
                  <LoadingButton variant="danger" onClick={() => setConfirmDeleteProgram(p)}>🗑</LoadingButton>
                </div>
              </div>

              {p.workout_days?.map((d) => (
                <div key={d.id} className={s.dayCard}>
                  <div className={s.dayHeader}>
                    <b>{d.title}</b>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <LoadingButton variant="smSecondary" onClick={() => openEditDay(d, p.id)}>✏️</LoadingButton>
                      <LoadingButton variant="smDanger" onClick={() => setConfirmDeleteDay({ id: d.id, title: d.title, programId: p.id })}>✕</LoadingButton>
                    </div>
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
                              <div style={{ display: 'flex', gap: 4 }}>
                                <LoadingButton variant="smSecondary" onClick={() => openEditExercise(e, p.id, d.id)}>✏️</LoadingButton>
                                <LoadingButton variant="smDanger" onClick={() => setConfirmDeleteExercise({ id: e.id, name: e.name, programId: p.id, dayId: d.id })}>✕</LoadingButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className={s.dayEmpty}>Нет упражнений — нажмите «+ Упражнение»</p>
                  )}

                  <LoadingButton variant="sm" onClick={() => openExerciseModal(p.id, d.id)}>+ Упражнение</LoadingButton>
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
                {p.next_payment_at && (
                  <span className={s.paymentNote}>
                    След. платёж: {new Date(p.next_payment_at).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>
              <div className={s.paymentRight}>
                <span className={s.paymentStatus}>{p.is_paid ? '✅ Оплачено' : '⏳ Не оплачено'}</span>
                {!p.is_paid && (
                  <LoadingButton variant="sm" loading={markingPaidId === p.id} onClick={() => handleMarkPaid(p.id)}>
                    Оплачено
                  </LoadingButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Edit client modal ─── */}
      {editClientModal && (
        <Modal title="Редактировать имя" onClose={() => setEditClientModal(false)}>
          <FormField label="Имя клиента">
            <input value={editClientName} onChange={(e) => setEditClientName(e.target.value)} enterKeyHint="done" onKeyDown={(e) => e.key === 'Enter' && handleUpdateClient()} autoFocus />
          </FormField>
          <LoadingButton loading={savingClient} onClick={handleUpdateClient}>Сохранить</LoadingButton>
        </Modal>
      )}

      {/* ─── Day modal ─── */}
      {dayModalForProgram !== null && (
        <Modal title="Добавить день" onClose={() => setDayModalForProgram(null)}>
          <FormField label="Название дня" error={dayTitleError}>
            <input value={dayTitle} onChange={(e) => { setDayTitle(e.target.value); setDayTitleError('') }} placeholder="День 1 — Ноги" enterKeyHint="done" onKeyDown={(e) => e.key === 'Enter' && handleAddDay()} autoFocus />
          </FormField>
          <LoadingButton loading={addingDay} onClick={handleAddDay}>Добавить</LoadingButton>
        </Modal>
      )}

      {/* ─── Edit day modal ─── */}
      {editDayModal && (
        <Modal title="Редактировать день" onClose={() => setEditDayModal(null)}>
          <FormField label="Название дня">
            <input value={editDayTitle} onChange={(e) => setEditDayTitle(e.target.value)} enterKeyHint="done" onKeyDown={(e) => e.key === 'Enter' && handleUpdateDay()} autoFocus />
          </FormField>
          <LoadingButton loading={savingDay} onClick={handleUpdateDay}>Сохранить</LoadingButton>
        </Modal>
      )}

      {/* ─── Edit program modal ─── */}
      {editProgramModal && (
        <Modal title="Редактировать программу" onClose={() => setEditProgramModal(null)}>
          <FormField label="Название программы">
            <input value={editProgramTitle} onChange={(e) => setEditProgramTitle(e.target.value)} enterKeyHint="done" onKeyDown={(e) => e.key === 'Enter' && handleUpdateProgram()} autoFocus />
          </FormField>
          <LoadingButton loading={savingProgram} onClick={handleUpdateProgram}>Сохранить</LoadingButton>
        </Modal>
      )}

      {/* ─── Exercise modal ─── */}
      {exerciseModal && (
        <Modal title="Добавить упражнение" onClose={() => setExerciseModal(null)}>
          <div>
            <span className={s.presetsLabel}>Популярные</span>
            <div className={s.presets}>
              {EXERCISE_PRESETS.map((preset) => (
                <button key={preset} type="button" className={`${s.preset} ${exForm.name === preset ? s.presetActive : ''}`} onClick={() => { setExForm((f) => ({ ...f, name: preset })); setExNameError('') }}>{preset}</button>
              ))}
            </div>
          </div>
          <FormField label="Название" error={exNameError}>
            <input value={exForm.name} onChange={(e) => { setExForm((f) => ({ ...f, name: e.target.value })); setExNameError('') }} placeholder="или введите своё..." enterKeyHint="next" />
          </FormField>
          <div className={s.stepperRow}>
            <Stepper label="Подходы" value={exForm.sets} onChange={(v) => setExForm((f) => ({ ...f, sets: v }))} min={1} max={20} />
            <Stepper label="Повторения" value={exForm.reps} onChange={(v) => setExForm((f) => ({ ...f, reps: v }))} min={1} max={100} />
            <Stepper label="Вес (кг)" value={exForm.weight} onChange={(v) => setExForm((f) => ({ ...f, weight: v }))} min={0} max={500} step={2.5} />
          </div>
          <FormField label="Заметка (необязательно)">
            <input value={exForm.note} onChange={(e) => setExForm((f) => ({ ...f, note: e.target.value }))} placeholder="Медленный негатив, контроль" enterKeyHint="done" />
          </FormField>
          <LoadingButton loading={addingExercise} onClick={handleAddExercise}>Добавить</LoadingButton>
        </Modal>
      )}

      {/* ─── Edit exercise modal ─── */}
      {editExModal && (
        <Modal title="Редактировать упражнение" onClose={() => setEditExModal(null)}>
          <div>
            <span className={s.presetsLabel}>Популярные</span>
            <div className={s.presets}>
              {EXERCISE_PRESETS.map((preset) => (
                <button key={preset} type="button" className={`${s.preset} ${editExForm.name === preset ? s.presetActive : ''}`} onClick={() => setEditExForm((f) => ({ ...f, name: preset }))}>{preset}</button>
              ))}
            </div>
          </div>
          <FormField label="Название">
            <input value={editExForm.name} onChange={(e) => setEditExForm((f) => ({ ...f, name: e.target.value }))} enterKeyHint="next" />
          </FormField>
          <div className={s.stepperRow}>
            <Stepper label="Подходы" value={editExForm.sets} onChange={(v) => setEditExForm((f) => ({ ...f, sets: v }))} min={1} max={20} />
            <Stepper label="Повторения" value={editExForm.reps} onChange={(v) => setEditExForm((f) => ({ ...f, reps: v }))} min={1} max={100} />
            <Stepper label="Вес (кг)" value={editExForm.weight} onChange={(v) => setEditExForm((f) => ({ ...f, weight: v }))} min={0} max={500} step={2.5} />
          </div>
          <FormField label="Заметка (необязательно)">
            <input value={editExForm.note} onChange={(e) => setEditExForm((f) => ({ ...f, note: e.target.value }))} enterKeyHint="done" />
          </FormField>
          <LoadingButton loading={savingEx} onClick={handleUpdateExercise}>Сохранить</LoadingButton>
        </Modal>
      )}

      {/* ─── Payment modal ─── */}
      {paymentModal && (
        <Modal title="Добавить платёж" onClose={() => setPaymentModal(false)}>
          <FormField label="Сумма (₽)" error={payErrors.amount}>
            <input type="text" inputMode="decimal" value={payForm.amount} onChange={(e) => { setPayForm((f) => ({ ...f, amount: e.target.value })); setPayErrors({}) }} placeholder="5000" enterKeyHint="next" autoFocus />
          </FormField>
          <FormField label="Описание (необязательно)">
            <input value={payForm.note} onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))} placeholder="Абонемент — апрель" enterKeyHint="next" />
          </FormField>
          <FormField label="Дата следующего платежа (необязательно)">
            <input type="date" value={payForm.date} onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))} />
          </FormField>
          <LoadingButton loading={creatingPayment} onClick={handleCreatePayment}>Добавить</LoadingButton>
        </Modal>
      )}

      {/* ─── Confirm dialogs ─── */}
      {confirmDeleteProgram && (
        <ConfirmDialog message={`Удалить программу «${confirmDeleteProgram.title}»?`} onConfirm={() => handleDeleteProgram(confirmDeleteProgram)} onCancel={() => setConfirmDeleteProgram(null)} />
      )}
      {confirmDeleteDay && (
        <ConfirmDialog message={`Удалить день «${confirmDeleteDay.title}»?`} onConfirm={() => handleDeleteDay({ ...confirmDeleteDay } as WorkoutDay & { programId: number })} onCancel={() => setConfirmDeleteDay(null)} />
      )}
      {confirmDeleteExercise && (
        <ConfirmDialog message={`Удалить упражнение «${confirmDeleteExercise.name}»?`} onConfirm={() => handleDeleteExercise({ ...confirmDeleteExercise } as Exercise & { programId: number; dayId: number })} onCancel={() => setConfirmDeleteExercise(null)} />
      )}
    </div>
  )
}
