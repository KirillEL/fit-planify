import { useEffect } from 'react'
import s from './Toast.module.scss'

interface Props {
  message: string
  onHide: () => void
  duration?: number
}

export default function Toast({ message, onHide, duration = 2000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onHide, duration)
    return () => clearTimeout(timer)
  }, [message])

  return <div className={s.toast}>{message}</div>
}
