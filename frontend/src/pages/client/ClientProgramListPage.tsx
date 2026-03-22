import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getClientProgramsByToken } from '../../api/client'
import type { Program } from '../../types'
import s from './ClientProgramListPage.module.scss'

const TOKEN_KEY = 'client_invite_token'

export default function ClientProgramListPage() {
  const [searchParams] = useSearchParams()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    const token = tokenFromUrl || localStorage.getItem(TOKEN_KEY)

    if (tokenFromUrl) {
      localStorage.setItem(TOKEN_KEY, tokenFromUrl)
    }

    if (!token) {
      setError(true)
      setLoading(false)
      return
    }

    getClientProgramsByToken(token)
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
