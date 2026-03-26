import s from './RolePage.module.scss'

interface Props {
  onSelect: (role: 'trainer' | 'client') => void
  loading: 'trainer' | 'client' | null
}

export default function RolePage({ onSelect, loading }: Props) {
  return (
    <div className={s.page}>
      <div className={s.logo}>💪</div>
      <h1 className={s.title}>Planify</h1>
      <p className={s.subtitle}>Выберите роль для входа</p>

      <div className={s.buttons}>
        <button
          className={`${s.btn} ${s.trainer}`}
          onClick={() => onSelect('trainer')}
          disabled={!!loading}
        >
          <span className={s.icon}>🏋️</span>
          <span className={s.label}>Я тренер</span>
          {loading === 'trainer' && <span className={s.spinner} />}
        </button>

        <button
          className={`${s.btn} ${s.client}`}
          onClick={() => onSelect('client')}
          disabled={!!loading}
        >
          <span className={s.icon}>👤</span>
          <span className={s.label}>Я клиент</span>
          {loading === 'client' && <span className={s.spinner} />}
        </button>
      </div>

      <p className={s.hint}>
        Клиентам необходимо получить приглашение от тренера
      </p>
    </div>
  )
}
