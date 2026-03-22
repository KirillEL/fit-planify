import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient, deleteClient, getClients } from '../../api/client'
import type { Client } from '../../types'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog'
import LoadingButton from '../../components/LoadingButton/LoadingButton'
import Toast from '../../components/Toast/Toast'
import s from './ClientsPage.module.scss'

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'fit_planify_bot'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [confirmClient, setConfirmClient] = useState<Client | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getClients().then((r) => {
      setClients(r.data)
      setLoading(false)
    })
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

  if (loading) return <div className={s.loader}>Загрузка...</div>

  return (
    <div className={s.page}>
      {toast && <Toast message={toast} onHide={() => setToast(null)} />}

      <h1>Мои клиенты</h1>

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

      {clients.length === 0 ? (
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
          {clients.map((c) => (
            <li key={c.id} className={s.clientCard}>
              <div className={s.clientInfo} onClick={() => navigate(`/trainer/clients/${c.id}`)}>
                <span className={s.clientName}>{c.name}</span>
                <span className={s.clientStatus}>
                  {c.telegram_id ? '✅ подключён' : '⏳ ожидает подключения'}
                </span>
              </div>
              <div className={s.clientActions}>
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
