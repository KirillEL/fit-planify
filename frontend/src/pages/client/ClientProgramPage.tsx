import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProgram } from '../../api/client'
import type { Program } from '../../types'
import s from './ClientProgramPage.module.scss'

export default function ClientProgramPage() {
  const { programId } = useParams<{ programId: string }>()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProgram(Number(programId)).then((r) => {
      setProgram(r.data)
      setLoading(false)
    })
  }, [programId])

  if (loading) return <div className={s.loader}>Загрузка программы...</div>
  if (!program) return <div className={s.error}>Программа не найдена</div>

  return (
    <div className={s.page}>
      <h1>💪 {program.title}</h1>

      {program.workout_days?.map((day) => (
        <div key={day.id} className={s.dayCard}>
          <h2>{day.title}</h2>
          <table className={s.exerciseTable}>
            <thead>
              <tr>
                <th>Упражнение</th>
                <th>Подх.</th>
                <th>Повт.</th>
                <th>Вес</th>
              </tr>
            </thead>
            <tbody>
              {day.exercises?.map((e) => (
                <tr key={e.id}>
                  <td>
                    <b>{e.name}</b>
                    {e.note && <div className={s.note}>{e.note}</div>}
                  </td>
                  <td>{e.sets}</td>
                  <td>{e.reps}</td>
                  <td>{e.weight > 0 ? `${e.weight} кг` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
