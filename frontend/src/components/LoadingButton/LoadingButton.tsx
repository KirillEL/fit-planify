import { ReactNode } from 'react'
import s from './LoadingButton.module.scss'

type Variant = 'primary' | 'danger' | 'secondary' | 'sm' | 'smDanger' | 'smSecondary'

interface Props {
  loading?: boolean
  onClick?: () => void
  children: ReactNode
  variant?: Variant
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export default function LoadingButton({
  loading,
  onClick,
  children,
  variant = 'primary',
  type = 'button',
  disabled,
  className,
}: Props) {
  return (
    <button
      type={type}
      className={[s.btn, s[variant], className].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? <span className={s.spinner} /> : children}
    </button>
  )
}
