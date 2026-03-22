import { ReactNode } from 'react'
import s from './Modal.module.scss'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>{title}</h2>
          <button className={s.close} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className={s.body}>{children}</div>
      </div>
    </div>
  )
}
