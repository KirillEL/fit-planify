import { ReactNode } from 'react'
import s from './FormField.module.scss'

interface Props {
  label: string
  error?: string
  children: ReactNode
}

export default function FormField({ label, error, children }: Props) {
  return (
    <div className={s.field}>
      <label className={s.label}>{label}</label>
      {children}
      {error && <span className={s.error}>{error}</span>}
    </div>
  )
}
