import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient, deleteClient, getClients, getUnpaid } from '@/api/client'
import type { Client, Payment } from '@/types'
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import Toast from '@/components/Toast/Toast'
import SkeletonClientCard from './components/SkeletonClientCard/SkeletonClientCard'
import UnpaidWidget from './components/UnpaidWidget/UnpaidWidget'
import s from './ClientsPage.module.scss'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'fit_planify_bot'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [unpaidPayments, setUnpaidPayments] = useState<Payment[]>([])
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirmClient, setConfirmClient] = useState<Client | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getClients(), getUnpaid()])
      .then(([r, u]) => {
        setClients(r.data)
        setUnpaidPayments(u.data ?? [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const r = await createClient(newName.trim())
    setClients((prev) => [r.data, ...prev])
    setNewName('')
    setCreating(false)
  }

  const handleDelete = async (client: Client) => {
    await deleteClient(client.id)
    setClients((prev) => prev.filter((c) => c.id !== client.id))
    setConfirmClient(null)
  }

  const copyInviteLink = (token: string) => {
    const link = `https://t.me/${BOT_USERNAME}?start=invite_${token}`
    navigator.clipboard.writeText(link)
    setToast('🔗 Ссылка скопирована!')
  }

  const shareInviteLink = (token: string) => {
    const link = `https://t.me/${BOT_USERNAME}?start=invite_${token}`
    const text = 'Привет! Тренер приглашает тебя в систему управления тренировками Planify.'
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    window.Telegram?.WebApp?.openTelegramLink(shareUrl)
  }

  if (error) return <div className={s.loader}>Ошибка загрузки. Обновите страницу.</div>

  return (
    <div className={s.page}>
      {toast && <Toast message={toast} onHide={() => setToast(null)} />}

      <h1>Мои клиенты</h1>

      {!loading && (
        <UnpaidWidget
          unpaid={unpaidPayments}
          clients={clients}
          onNavigate={(clientId) => navigate(`/trainer/clients/${clientId}?tab=payments`)}
        />
      )}

      {clients.length > 0 && (
        <input
          className={s.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени..."
        />
      )}

      <div className={s.addRow}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Имя клиента"
          enterKeyHint="done"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <LoadingButton loading={creating} onClick={handleCreate}>
          Добавить
        </LoadingButton>
      </div>

      {loading ? (
        <ul className={s.clientList}>
          <SkeletonClientCard />
          <SkeletonClientCard />
          <SkeletonClientCard />
        </ul>
      ) : clients.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>👤</span>
          <p className={s.emptyTitle}>Клиентов пока нет</p>
          <p className={s.emptyHint}>
            Введите имя клиента выше и нажмите «Добавить».
            Затем скопируйте ссылку-приглашение и отправьте клиенту — он сам подключится через бот.
          </p>
        </div>
      ) : (
        <ul className={s.clientList}>
          {clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())).map((c) => (
            <li key={c.id} className={`${s.clientCard} ${c.telegram_id ? s.connected : s.pending}`}>
              <div className={s.clientInfo} onClick={() => navigate(`/trainer/clients/${c.id}`)}>
                <span className={s.clientName}>{c.name}</span>
                <span className={s.clientStatus}>
                  {c.telegram_id ? '✅ подключён' : '⏳ ожидает подключения'}
                </span>
              </div>
              <div className={s.clientActions}>
                <LoadingButton
                  variant="secondary"
                  onClick={() => shareInviteLink(c.invite_token)}
                  disabled={!!c.telegram_id}
                >
                  📤
                </LoadingButton>
                <LoadingButton
                  variant="secondary"
                  onClick={() => copyInviteLink(c.invite_token)}
                  disabled={!!c.telegram_id}
                >
                  🔗
                </LoadingButton>
                <LoadingButton variant="danger" onClick={() => setConfirmClient(c)}>
                  🗑
                </LoadingButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmClient && (
        <ConfirmDialog
          message={`Удалить клиента «${confirmClient.name}»?`}
          onConfirm={() => handleDelete(confirmClient)}
          onCancel={() => setConfirmClient(null)}
        />
      )}
    </div>
  )
}
