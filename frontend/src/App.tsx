import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppRoot } from '@telegram-apps/telegram-ui'
import { authDev, authTelegram } from '@/api/client'
import { toastEmitter } from '@/lib/toast'
import ClientDetailPage from '@/pages/trainer/ClientDetailPage'
import ClientsPage from '@/pages/trainer/ClientsPage'
import ClientProgramPage from '@/pages/client/ClientProgramPage'
import ClientProgramListPage from '@/pages/client/ClientProgramListPage'
import RolePage from '@/pages/RolePage'
import Onboarding from '@/components/Onboarding/Onboarding'
import GlobalToast from '@/components/GlobalToast/GlobalToast'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        ready(): void
        expand(): void
        openTelegramLink(url: string): void
      }
    }
  }
}

const ONBOARDING_KEY = 'planify_onboarded'

function App() {
  const [authState, setAuthState] = useState<'loading' | 'role-select' | 'ready'>('loading')
  const [role, setRole] = useState<'trainer' | 'client' | null>(null)
  const [roleLoading, setRoleLoading] = useState<'trainer' | 'client' | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) { tg.ready(); tg.expand() }

    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role') as 'trainer' | 'client' | null

    if (token && storedRole) {
      setRole(storedRole)
      setAuthState('ready')
      return
    }

    // Dev mode: skip role selection, auto-login as trainer
    if (import.meta.env.VITE_DEV_AUTH) {
      authDev()
        .then((r) => {
          localStorage.setItem('token', r.data.token)
          localStorage.setItem('role', 'trainer')
          setRole('trainer')
        })
        .finally(() => setAuthState('ready'))
      return
    }

    setAuthState('role-select')
  }, [])

  useEffect(() => {
    if (authState === 'ready' && role === 'trainer' && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true)
    }
  }, [authState, role])

  const handleRoleSelect = async (selectedRole: 'trainer' | 'client') => {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData) return

    setRoleLoading(selectedRole)
    try {
      const r = await authTelegram(initData, selectedRole)
      localStorage.setItem('token', r.data.token)
      localStorage.setItem('role', selectedRole)
      setRole(selectedRole)
      setAuthState('ready')
    } catch (err: any) {
      const status = err.response?.status
      if (status === 403) {
        toastEmitter.emit('Доступ запрещён — вы не являетесь тренером')
      } else if (status === 404) {
        toastEmitter.emit('Вы не подключены ни к одному тренеру')
      } else {
        toastEmitter.emit('Ошибка входа')
      }
    } finally {
      setRoleLoading(null)
    }
  }

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  if (authState === 'loading') return null

  if (authState === 'role-select') {
    return (
      <AppRoot>
        <GlobalToast />
        <RolePage onSelect={handleRoleSelect} loading={roleLoading} />
      </AppRoot>
    )
  }

  return (
    <AppRoot>
      <GlobalToast />
      {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
      <BrowserRouter>
        <Routes>
          {role === 'trainer' && (
            <>
              <Route path="/trainer" element={<ClientsPage />} />
              <Route path="/trainer/clients/:id" element={<ClientDetailPage />} />
              <Route path="*" element={<Navigate to="/trainer" replace />} />
            </>
          )}
          {role === 'client' && (
            <>
              <Route path="/client/programs" element={<ClientProgramListPage />} />
              <Route path="/client/program/:programId" element={<ClientProgramPage />} />
              <Route path="*" element={<Navigate to="/client/programs" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </AppRoot>
  )
}

export default App
