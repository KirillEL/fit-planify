import type { Payment } from '@/types'
import LoadingButton from '@/components/LoadingButton/LoadingButton'
import s from './PaymentCard.module.scss'

interface Props {
  payment: Payment
  markingPaidId: number | null
  onMarkPaid: (id: number) => void
}

export default function PaymentCard({ payment, markingPaidId, onMarkPaid }: Props) {
  return (
    <div className={`${s.paymentCard} ${payment.is_paid ? s.paid : s.unpaid}`}>
      <div className={s.paymentInfo}>
        <span className={s.paymentAmount}>{payment.amount} ₽</span>
        {payment.note && <span className={s.paymentNote}>{payment.note}</span>}
        {payment.next_payment_at && (
          <span className={s.paymentNote}>
            След. платёж: {new Date(payment.next_payment_at).toLocaleDateString('ru-RU')}
          </span>
        )}
      </div>
      <div className={s.paymentRight}>
        <span className={s.paymentStatus}>{payment.is_paid ? '✅ Оплачено' : '⏳ Не оплачено'}</span>
        {!payment.is_paid && (
          <LoadingButton variant="sm" loading={markingPaidId === payment.id} onClick={() => onMarkPaid(payment.id)}>
            Оплачено
          </LoadingButton>
        )}
      </div>
    </div>
  )
}
