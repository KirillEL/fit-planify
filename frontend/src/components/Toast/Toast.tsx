import { useEffect } from 'react'
import s from './Toast.module.scss'

interface Props {
  message: string
  onHide: () => void
  type?: 'success' | 'error'
  duration?: number
}

export default function Toast({ message, onHide, type = 'success', duration = 2500 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onHide, duration)
    return () => clearTimeout(timer)
  }, [message])

  return <div className={`${s.toast} ${type === 'error' ? s.error : ''}`}>{message}</div>
}
