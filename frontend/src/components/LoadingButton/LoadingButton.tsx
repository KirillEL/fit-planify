import { ReactNode } from 'react'
import s from './LoadingButton.module.scss'

type Variant = 'primary' | 'danger' | 'secondary' | 'sm' | 'smDanger'

interface Props {
  loading?: boolean
  onClick?: () => void
  children: ReactNode
  variant?: Variant
  type?: 'button' | 'submit'
  disabled?: boolean
}

export default function LoadingButton({
  loading,
  onClick,
  children,
  variant = 'primary',
  type = 'button',
  disabled,
}: Props) {
  return (
    <button
      type={type}
      className={[s.btn, s[variant]].join(' ')}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <span className={s.spinner} /> : children}
    </button>
  )
}
