import { useState } from 'react'
import Modal from '../Modal/Modal'
import s from './ConfirmDialog.module.scss'

interface Props {
  message: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
  }

  return (
    <Modal title="Подтверждение" onClose={onCancel}>
      <p className={s.message}>{message}</p>
      <div className={s.actions}>
        <button className={s.cancel} onClick={onCancel} disabled={loading}>
          Отмена
        </button>
        <button className={s.confirm} onClick={handleConfirm} disabled={loading}>
          {loading ? '...' : 'Удалить'}
        </button>
      </div>
    </Modal>
  )
}
