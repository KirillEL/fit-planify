import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  addDay, addExercise, createProgram, deleteDay,
  deleteExercise, deleteProgram, getClient, getClientPrograms, getClients,
  markPaid, createPayment, getPayments,
  updateClient, updateProgram, updateDay, updateExercise,
  duplicateProgram, reorderExercises, copyProgramToClient,
} from '@/api/client'
import type { Payment, Program, WorkoutDay, Exercise } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import Modal from '@/components/Modal/Modal'
import FormField from '@/components/FormField/FormField'
import { toastEmitter } from '@/lib/toast'
import ExerciseModal, { type ExerciseForm } from './components/ExerciseModal/ExerciseModal'
import ProgramTab from './components/ProgramTab/ProgramTab'
import PaymentsTab from './components/PaymentsTab/PaymentsTab'
import s from './ClientDetailPage.module.scss'

interface PaymentForm { amount: string; note: string; date: string }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const clientId = Number(id)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [clientName, setClientName] = useState('')
  const [programs, setPrograms] = useState<Program[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [tab, setTab] = useState<'program' | 'payments'>(
    (searchParams.get('tab') as 'program' | 'payments') || 'program'
  )
  const [loading, setLoading] = useState(true)

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

  // Edit day
  const [editDayModal, setEditDayModal] = useState<{ id: number; title: string; programId: number } | null>(null)
  const [editDayTitle, setEditDayTitle] = useState('')
  const [savingDay, setSavingDay] = useState(false)

  // Exercise modal
  const [exerciseModal, setExerciseModal] = useState<{ programId: number; dayId: number } | null>(null)
  const [exForm, setExForm] = useState<ExerciseForm>({ name: '', sets: 3, reps: 10, weight: 0, note: '' })
  const [exNameError, setExNameError] = useState('')

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

  // Copy program to another client
  const [copyProgramModal, setCopyProgramModal] = useState<Program | null>(null)
  const [copyTargetClientId, setCopyTargetClientId] = useState<number | null>(null)
  const [allClients, setAllClients] = useState<import('@/types').Client[]>([])
  const [copyingProgram, setCopyingProgram] = useState(false)

  const showError = (msg: string) => toastEmitter.emit(msg, 'error')
  const showSuccess = (msg: string) => toastEmitter.emit(msg, 'success')

  useEffect(() => {
    Promise.all([getClient(clientId), getClientPrograms(clientId), getPayments(clientId)])
      .then(([c, p, pay]) => {
        setClientName(c.data.name)
        setPrograms(p.data)
        setPayments(pay.data)
      })
      .catch(() => showError('Ошибка загрузки данных'))
      .finally(() => setLoading(false))
  }, [clientId])

  const switchTab = (t: 'program' | 'payments') => {
    setTab(t)
    setSearchParams(t === 'program' ? {} : { tab: t })
  }

  // --- Client ---

  const openEditClient = () => { setEditClientName(clientName); setEditClientModal(true) }

  const handleUpdateClient = async () => {
    if (!editClientName.trim()) return
    setSavingClient(true)
    try {
      await updateClient(clientId, editClientName.trim())
      setClientName(editClientName.trim())
      setEditClientModal(false)
      showSuccess('Имя сохранено')
    } catch { showError('Не удалось сохранить') }
    finally { setSavingClient(false) }
  }

  // --- Program ---

  const handleCreateProgram = async () => {
    if (!programTitle.trim()) return
    setCreatingProgram(true)
    try {
      const r = await createProgram(clientId, programTitle.trim())
      setPrograms((prev) => [{ ...r.data, workout_days: [] }, ...prev])
      setProgramTitle('')
    } catch { showError('Не удалось создать программу') }
    finally { setCreatingProgram(false) }
  }

  const openEditProgram = (p: Program) => { setEditProgramTitle(p.title); setEditProgramModal(p) }

  const handleUpdateProgram = async () => {
    if (!editProgramTitle.trim() || !editProgramModal) return
    setSavingProgram(true)
    try {
      await updateProgram(editProgramModal.id, editProgramTitle.trim())
      setPrograms((prev) => prev.map((p) => p.id === editProgramModal.id ? { ...p, title: editProgramTitle.trim() } : p))
      setEditProgramModal(null)
      showSuccess('Программа обновлена')
    } catch { showError('Не удалось сохранить') }
    finally { setSavingProgram(false) }
  }

  const handleDeleteProgram = async (program: Program) => {
    const prevPrograms = programs
    setPrograms((prev) => prev.filter((p) => p.id !== program.id))
    setConfirmDeleteProgram(null)
    try {
      await deleteProgram(program.id)
    } catch {
      setPrograms(prevPrograms)
      showError('Не удалось удалить программу')
    }
  }

  const handleDuplicateProgram = async (programId: number) => {
    try {
      const r = await duplicateProgram(programId)
      setPrograms((prev) => [r.data, ...prev])
      showSuccess('Программа скопирована')
    } catch { showError('Не удалось скопировать программу') }
  }

  // --- Day ---

  const openDayModal = (programId: number) => { setDayTitle(''); setDayTitleError(''); setDayModalForProgram(programId) }

  const handleAddDay = async () => {
    if (!dayTitle.trim()) { setDayTitleError('Введите название дня'); return }
    const programId = dayModalForProgram!
    const program = programs.find((p) => p.id === programId)!
    const dayNumber = (program.workout_days?.length ?? 0) + 1
    const tempId = -Date.now()
    const tempDay: WorkoutDay = { id: tempId, program_id: programId, day_number: dayNumber, title: dayTitle.trim(), exercises: [] }

    setPrograms((prev) => prev.map((p) =>
      p.id === programId ? { ...p, workout_days: [...(p.workout_days ?? []), tempDay] } : p
    ))
    setDayModalForProgram(null)

    try {
      const r = await addDay(programId, dayNumber, dayTitle.trim())
      setPrograms((prev) => prev.map((p) =>
        p.id === programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === tempId ? { ...r.data, exercises: [] } : d) }
          : p
      ))
    } catch {
      setPrograms((prev) => prev.map((p) =>
        p.id === programId ? { ...p, workout_days: p.workout_days?.filter((d) => d.id !== tempId) } : p
      ))
      showError('Не удалось добавить день')
    }
  }

  const openEditDay = (d: WorkoutDay, programId: number) => { setEditDayTitle(d.title); setEditDayModal({ id: d.id, title: d.title, programId }) }

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
    } catch { showError('Не удалось сохранить') }
    finally { setSavingDay(false) }
  }

  const handleDeleteDay = async (day: WorkoutDay & { programId: number }) => {
    const prevPrograms = programs
    setPrograms((prev) => prev.map((p) =>
      p.id === day.programId ? { ...p, workout_days: p.workout_days?.filter((d) => d.id !== day.id) } : p
    ))
    setConfirmDeleteDay(null)
    try {
      await deleteDay(day.id)
    } catch {
      setPrograms(prevPrograms)
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
    const { programId, dayId } = exerciseModal!
    const order = (programs.find((p) => p.id === programId)?.workout_days?.find((d) => d.id === dayId)?.exercises?.length ?? 0) + 1
    const tempId = -Date.now()
    const tempExercise: Exercise = {
      id: tempId, workout_day_id: dayId,
      name: exForm.name.trim(), sets: exForm.sets, reps: exForm.reps,
      weight: exForm.weight, note: exForm.note.trim(), order,
    }

    setPrograms((prev) => prev.map((p) =>
      p.id === programId
        ? { ...p, workout_days: p.workout_days?.map((d) => d.id === dayId ? { ...d, exercises: [...(d.exercises ?? []), tempExercise] } : d) }
        : p
    ))
    setExerciseModal(null)

    try {
      const r = await addExercise(dayId, { name: exForm.name.trim(), sets: exForm.sets, reps: exForm.reps, weight: exForm.weight, note: exForm.note.trim(), order })
      setPrograms((prev) => prev.map((p) =>
        p.id === programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === dayId ? { ...d, exercises: d.exercises?.map((e) => e.id === tempId ? r.data : e) } : d) }
          : p
      ))
    } catch {
      setPrograms((prev) => prev.map((p) =>
        p.id === programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === dayId ? { ...d, exercises: d.exercises?.filter((e) => e.id !== tempId) } : d) }
          : p
      ))
      showError('Не удалось добавить упражнение')
    }
  }

  const openEditExercise = (e: Exercise, programId: number, dayId: number) => {
    setEditExForm({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, note: e.note })
    setEditExModal({ ...e, programId, dayId })
  }

  const handleUpdateExercise = async () => {
    if (!editExForm.name.trim() || !editExModal) return
    setSavingEx(true)
    const { id: exId, programId, dayId, order } = editExModal
    try {
      await updateExercise(exId, { name: editExForm.name.trim(), sets: editExForm.sets, reps: editExForm.reps, weight: editExForm.weight, note: editExForm.note.trim(), order })
      setPrograms((prev) => prev.map((p) =>
        p.id === programId
          ? { ...p, workout_days: p.workout_days?.map((d) => d.id === dayId ? { ...d, exercises: d.exercises?.map((e) => e.id === exId ? { ...e, ...editExForm, name: editExForm.name.trim() } : e) } : d) }
          : p
      ))
      setEditExModal(null)
      showSuccess('Упражнение обновлено')
    } catch { showError('Не удалось сохранить') }
    finally { setSavingEx(false) }
  }

  const handleDeleteExercise = async (ex: Exercise & { programId: number; dayId: number }) => {
    const prevPrograms = programs
    setPrograms((prev) => prev.map((p) =>
      p.id === ex.programId
        ? { ...p, workout_days: p.workout_days?.map((d) => d.id === ex.dayId ? { ...d, exercises: d.exercises?.filter((e) => e.id !== ex.id) } : d) }
        : p
    ))
    setConfirmDeleteExercise(null)
    try {
      await deleteExercise(ex.id)
    } catch {
      setPrograms(prevPrograms)
      showError('Не удалось удалить упражнение')
    }
  }

  const handleMoveExercise = async (exerciseId: number, direction: 'up' | 'down', dayId: number, programId: number) => {
    const program = programs.find((p) => p.id === programId)
    const day = program?.workout_days?.find((d) => d.id === dayId)
    if (!day?.exercises) return
    const exercises = [...day.exercises]
    const idx = exercises.findIndex((e) => e.id === exerciseId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= exercises.length) return

    const updated = [...exercises];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]

    const prevPrograms = programs
    setPrograms((prev) => prev.map((p) =>
      p.id === programId
        ? { ...p, workout_days: p.workout_days?.map((d) => d.id === dayId ? { ...d, exercises: updated } : d) }
        : p
    ))

    try {
      await reorderExercises(dayId, updated.map((e) => e.id))
    } catch {
      setPrograms(prevPrograms)
      showError('Не удалось изменить порядок')
    }
  }

  // --- Copy program ---

  const openCopyModal = async (program: Program) => {
    setCopyProgramModal(program)
    setCopyTargetClientId(null)
    if (allClients.length === 0) {
      try {
        const r = await getClients()
        setAllClients(r.data)
      } catch { showError('Не удалось загрузить клиентов') }
    }
  }

  const handleCopyProgram = async () => {
    if (!copyProgramModal || !copyTargetClientId) return
    setCopyingProgram(true)
    try {
      await copyProgramToClient(copyProgramModal.id, copyTargetClientId)
      setCopyProgramModal(null)
      showSuccess('Программа скопирована')
    } catch { showError('Не удалось скопировать программу') }
    finally { setCopyingProgram(false) }
  }

  // --- Payment ---

  const openPaymentModal = () => { setPayForm({ amount: '', note: '', date: '' }); setPayErrors({}); setPaymentModal(true) }

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
    } catch { showError('Не удалось создать платёж') }
    finally { setCreatingPayment(false) }
  }

  const handleMarkPaid = async (paymentId: number) => {
    setMarkingPaidId(paymentId)
    try {
      await markPaid(paymentId)
      setPayments((prev) => prev.map((p) => p.id === paymentId ? { ...p, is_paid: true } : p))
    } catch { showError('Не удалось отметить оплату') }
    finally { setMarkingPaidId(null) }
  }

  if (loading) return <div className={s.loader}>Загрузка...</div>

  return (
    <div className={s.page}>
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
        <button className={`${s.tab} ${tab === 'program' ? s.active : ''}`} onClick={() => switchTab('program')}>
          💪 Программа
        </button>
        <button className={`${s.tab} ${tab === 'payments' ? s.active : ''}`} onClick={() => switchTab('payments')}>
          💳 Оплаты
        </button>
      </div>

      {tab === 'program' && (
        <ProgramTab
          programs={programs}
          programTitle={programTitle}
          creatingProgram={creatingProgram}
          onProgramTitleChange={setProgramTitle}
          onCreateProgram={handleCreateProgram}
          onEditProgram={openEditProgram}
          onDeleteProgram={setConfirmDeleteProgram}
          onDuplicateProgram={handleDuplicateProgram}
          onCopyProgram={openCopyModal}
          onAddDay={openDayModal}
          onEditDay={openEditDay}
          onDeleteDay={(d) => setConfirmDeleteDay(d)}
          onAddExercise={openExerciseModal}
          onEditExercise={openEditExercise}
          onDeleteExercise={(ex) => setConfirmDeleteExercise(ex)}
          onMoveExercise={handleMoveExercise}
        />
      )}

      {tab === 'payments' && (
        <PaymentsTab
          payments={payments}
          markingPaidId={markingPaidId}
          onAddPayment={openPaymentModal}
          onMarkPaid={handleMarkPaid}
        />
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

      {/* ─── Add day modal ─── */}
      {dayModalForProgram !== null && (
        <Modal title="Добавить день" onClose={() => setDayModalForProgram(null)}>
          <FormField label="Название дня" error={dayTitleError}>
            <input value={dayTitle} onChange={(e) => { setDayTitle(e.target.value); setDayTitleError('') }} placeholder="День 1 — Ноги" enterKeyHint="done" onKeyDown={(e) => e.key === 'Enter' && handleAddDay()} autoFocus />
          </FormField>
          <LoadingButton loading={false} onClick={handleAddDay}>Добавить</LoadingButton>
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

      {/* ─── Add exercise modal ─── */}
      {exerciseModal && (
        <ExerciseModal
          mode="add"
          form={exForm}
          nameError={exNameError}
          loading={false}
          onFormChange={(patch) => { setExForm((f) => ({ ...f, ...patch })); if (patch.name !== undefined) setExNameError('') }}
          onSubmit={handleAddExercise}
          onClose={() => setExerciseModal(null)}
        />
      )}

      {/* ─── Edit exercise modal ─── */}
      {editExModal && (
        <ExerciseModal
          mode="edit"
          form={editExForm}
          nameError=""
          loading={savingEx}
          onFormChange={(patch) => setEditExForm((f) => ({ ...f, ...patch }))}
          onSubmit={handleUpdateExercise}
          onClose={() => setEditExModal(null)}
        />
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

      {/* ─── Copy program modal ─── */}
      {copyProgramModal && (
        <Modal title="Скопировать программу" onClose={() => setCopyProgramModal(null)}>
          <FormField label="Выберите клиента">
            <select value={copyTargetClientId ?? ''} onChange={(e) => setCopyTargetClientId(Number(e.target.value))}>
              <option value="">— Выберите клиента —</option>
              {allClients
                .filter((c) => c.id !== clientId)
                .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <LoadingButton loading={copyingProgram} onClick={handleCopyProgram} disabled={!copyTargetClientId}>
            Скопировать
          </LoadingButton>
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
