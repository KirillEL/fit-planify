import type { Client, Payment } from '@/types'
import s from './UnpaidWidget.module.scss'

interface Props {
  unpaid: Payment[]
  clients: Client[]
  onNavigate: (clientId: number) => void
}

export default function UnpaidWidget({ unpaid, clients, onNavigate }: Props) {
  if (unpaid.length === 0) return null

  const total = unpaid.reduce((sum, p) => sum + p.amount, 0)
  const preview = unpaid.slice(0, 5)

  const clientName = (clientId: number) =>
    clients.find((c) => c.id === clientId)?.name ?? '—'

  return (
    <div className={s.widget}>
      <div className={s.header}>
        <span className={s.title}>Ожидают оплаты</span>
        <span className={s.badge}>{unpaid.length}</span>
      </div>
      <p className={s.total}>Итого: {total.toLocaleString('ru-RU')} ₽</p>
      <div className={s.list}>
        {preview.map((p) => (
          <div key={p.id} className={s.row} onClick={() => onNavigate(p.client_id)}>
            <span className={s.clientName}>{clientName(p.client_id)}</span>
            <div className={s.rowRight}>
              <span className={s.amount}>{p.amount.toLocaleString('ru-RU')} ₽</span>
              {p.next_payment_at && (
                <span className={s.date}>{new Date(p.next_payment_at).toLocaleDateString('ru-RU')}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
