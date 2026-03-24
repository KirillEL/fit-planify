import s from './SkeletonClientCard.module.scss'

export default function SkeletonClientCard() {
  return (
    <li className={s.card}>
      <div className={s.info}>
        <div className={`${s.name} skeleton`} />
        <div className={`${s.status} skeleton`} />
      </div>
      <div className={s.actions}>
        <div className={`${s.btn} skeleton`} />
        <div className={`${s.btn} skeleton`} />
        <div className={`${s.btn} skeleton`} />
      </div>
    </li>
  )
}
