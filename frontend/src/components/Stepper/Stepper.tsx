import s from './Stepper.module.scss'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  error?: string
}

export default function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  error,
}: Props) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)))
  const inc = () => onChange(Math.min(max, +(value + step).toFixed(2)))

  const display = value % 1 === 0 ? String(value) : value.toFixed(1)

  return (
    <div className={s.wrapper}>
      <span className={s.label}>{label}</span>
      <div className={s.control}>
        <button type="button" className={s.btn} onClick={dec} disabled={value <= min}>
          −
        </button>
        <span className={s.value}>{display}</span>
        <button type="button" className={s.btn} onClick={inc} disabled={value >= max}>
          +
        </button>
      </div>
      {error && <span className={s.error}>{error}</span>}
    </div>
  )
}
