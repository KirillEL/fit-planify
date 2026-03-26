import { useState, useEffect } from 'react'
import { toastEmitter } from '@/lib/toast'
import s from './GlobalToast.module.scss'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

export default function GlobalToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    return toastEmitter.on((message, type) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 2500)
    })
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className={s.container}>
      {toasts.map((t) => (
        <div key={t.id} className={`${s.toast} ${t.type === 'error' ? s.error : ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
