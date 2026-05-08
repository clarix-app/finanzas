import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [view, setView] = useState<'login' | 'register'>('login')

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0d0d14',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'linear-gradient(135deg,#8b7ff0,#6a8af0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div style={{ color: '#6060a0', fontSize: '13px' }}>Cargando Clarix...</div>
      </div>
    </div>
  )

  if (!user) {
    if (view === 'register') return <RegisterPage onNavigateLogin={() => setView('login')} />
    return <LoginPage onNavigateRegister={() => setView('register')} />
  }

  return <>{children}</>
}
