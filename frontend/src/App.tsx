import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { authDev, authTelegram } from './api/client'
import ClientDetailPage from './pages/trainer/ClientDetailPage'
import ClientsPage from './pages/trainer/ClientsPage'
import ClientProgramPage from './pages/client/ClientProgramPage'
import Onboarding from './components/Onboarding/Onboarding'

declare global {
  interface Window {
    Telegram?: { WebApp: any }
  }
}

const ONBOARDING_KEY = 'planify_onboarded'

function App() {
  const [authReady, setAuthReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp

    if (tg?.initData) {
      tg.ready()
      tg.expand()
      authTelegram(tg.initData)
        .then((r) => localStorage.setItem('token', r.data.token))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setAuthReady(true))
      return
    }

    if (tg) {
      tg.ready()
      tg.expand()
    }

    if (import.meta.env.VITE_DEV_AUTH) {
      authDev()
        .then((r) => localStorage.setItem('token', r.data.token))
        .finally(() => setAuthReady(true))
      return
    }

    setAuthReady(true)
  }, [])

  useEffect(() => {
    if (authReady && !localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true)
    }
  }, [authReady])

  const handleOnboardingDone = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShowOnboarding(false)
  }

  if (!authReady) return null

  return (
    <>
      {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
      <BrowserRouter>
        <Routes>
          <Route path="/trainer" element={<ClientsPage />} />
          <Route path="/trainer/clients/:id" element={<ClientDetailPage />} />
          <Route path="/client/program/:programId" element={<ClientProgramPage />} />
          <Route path="*" element={<Navigate to="/trainer" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
