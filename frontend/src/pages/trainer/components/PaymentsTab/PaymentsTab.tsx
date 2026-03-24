import type { Payment } from '@/types'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import PaymentCard from '../PaymentCard/PaymentCard'
import s from './PaymentsTab.module.scss'

interface Props {
  payments: Payment[]
  markingPaidId: number | null
  onAddPayment: () => void
  onMarkPaid: (id: number) => void
}

export default function PaymentsTab({ payments, markingPaidId, onAddPayment, onMarkPaid }: Props) {
  return (
    <div>
      <div className={s.addRow}>
        <LoadingButton onClick={onAddPayment}>+ Добавить платёж</LoadingButton>
      </div>

      {payments.length === 0 && (
        <div className={s.emptyState}>
          <span className={s.emptyIcon}>💳</span>
          <p className={s.emptyTitle}>Нет платежей</p>
          <p className={s.emptyHint}>Нажмите «+ Добавить платёж» чтобы создать запись об оплате</p>
        </div>
      )}

      {payments.map((p) => (
        <PaymentCard key={p.id} payment={p} markingPaidId={markingPaidId} onMarkPaid={onMarkPaid} />
      ))}
    </div>
  )
}
