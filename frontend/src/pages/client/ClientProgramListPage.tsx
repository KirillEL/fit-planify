import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyPrograms } from '../../api/client'
import type { Program } from '../../types'
import s from './ClientProgramListPage.module.scss'

export default function ClientProgramListPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getMyPrograms()
      .then((r) => setPrograms(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={s.center}>Загрузка...</div>
  if (error) return <div className={s.center}>Программы не найдены</div>

  return (
    <div className={s.page}>
      <h1 className={s.title}>Мои программы</h1>
      {programs.length === 0 ? (
        <p className={s.empty}>Тренер ещё не добавил программы</p>
      ) : (
        <div className={s.list}>
          {programs.map((p) => (
            <Link key={p.id} to={`/client/program/${p.id}`} className={s.card}>
              <span className={s.icon}>💪</span>
              <span className={s.name}>{p.title}</span>
              <span className={s.arrow}>›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
