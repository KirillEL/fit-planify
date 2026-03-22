import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

// Auth
export const authTelegram = (initData: string) =>
  axios.post<{ token: string }>('/auth/telegram', { init_data: initData })

export const authDev = () =>
  axios.post<{ token: string }>('/auth/dev')

// Trainer
export const getMe = () => http.get('/trainer/me')

// Clients
export const getClients = () => http.get('/clients')
export const getClient = (id: number) => http.get(`/clients/${id}`)
export const createClient = (name: string) => http.post('/clients', { name })
export const deleteClient = (id: number) => http.delete(`/clients/${id}`)
export const getClientByToken = (token: string) => axios.get(`/invite/${token}`)

// Programs
export const getClientPrograms = (clientId: number) =>
  http.get(`/clients/${clientId}/programs`)
export const createProgram = (clientId: number, title: string) =>
  http.post(`/clients/${clientId}/programs`, { title })
export const getProgram = (id: number) => http.get(`/programs/${id}`)
export const deleteProgram = (id: number) => http.delete(`/programs/${id}`)

// Days
export const addDay = (programId: number, day_number: number, title: string) =>
  http.post(`/programs/${programId}/days`, { day_number, title })
export const deleteDay = (id: number) => http.delete(`/days/${id}`)

// Exercises
export const addExercise = (
  dayId: number,
  data: { name: string; sets: number; reps: number; weight: number; note: string }
) => http.post(`/days/${dayId}/exercises`, data)
export const deleteExercise = (id: number) => http.delete(`/exercises/${id}`)

// Payments
export const getPayments = (clientId: number) =>
  http.get(`/clients/${clientId}/payments`)
export const createPayment = (
  clientId: number,
  data: { amount: number; note: string; next_payment_at: string | null }
) => http.post(`/clients/${clientId}/payments`, data)
export const markPaid = (id: number) => http.put(`/payments/${id}/pay`)
export const getUnpaid = () => http.get('/payments/unpaid')
