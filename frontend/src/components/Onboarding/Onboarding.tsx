import LoadingButton from '../LoadingButton/LoadingButton'
import s from './Onboarding.module.scss'

const STEPS = [
  {
    icon: '👥',
    title: 'Добавьте клиента',
    desc: 'Введите имя клиента — система автоматически создаст уникальную ссылку-приглашение.',
  },
  {
    icon: '🔗',
    title: 'Отправьте приглашение',
    desc: 'Скопируйте ссылку и отправьте клиенту. Он нажимает — и автоматически подключается к вам в боте.',
  },
  {
    icon: '💪',
    title: 'Составьте программу',
    desc: 'В карточке клиента создайте программу тренировок: добавьте дни и упражнения с подходами, повторениями и весом.',
  },
  {
    icon: '💳',
    title: 'Следите за оплатами',
    desc: 'Добавляйте платежи и отмечайте оплаченные. Бот автоматически напомнит клиентам о задолженностях.',
  },
]

interface Props {
  onDone: () => void
}

export default function Onboarding({ onDone }: Props) {
  return (
    <div className={s.wrap}>
      <div className={s.inner}>
        <div className={s.greeting}>
          <span className={s.emoji}>🏋️</span>
          <h1 className={s.title}>Добро пожаловать<br />в Planify!</h1>
          <p className={s.subtitle}>Управляй клиентами и тренировками прямо в Telegram</p>
        </div>

        <div className={s.steps}>
          {STEPS.map((step, i) => (
            <div key={i} className={s.step}>
              <span className={s.stepIcon}>{step.icon}</span>
              <div className={s.stepText}>
                <div className={s.stepTitle}>{step.title}</div>
                <div className={s.stepDesc}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <LoadingButton onClick={onDone}>Начать работу →</LoadingButton>
      </div>
    </div>
  )
}
