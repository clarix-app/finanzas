import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface LoginPageProps {
  onNavigateRegister: () => void
}

export default function LoginPage({ onNavigateRegister }: LoginPageProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError('Email o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '52px', height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #8b7ff0, #6a8af0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 24px rgba(139,127,240,0.4)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Satoshi', sans-serif",
            fontSize: '28px', fontWeight: 700,
            color: '#e8e8f0', letterSpacing: '-0.02em',
            margin: '0 0 6px'
          }}>Clarix</h1>
          <p style={{ color: '#6060a0', fontSize: '14px', margin: 0 }}>
            Inicia sesión para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: '#12121e',
          border: '1px solid #252535',
          borderRadius: '16px',
          padding: '28px'
        }}>
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '16px'
            }}>{error}</div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: '#6060a0', marginBottom: '6px'
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={{
                width: '100%', background: '#1a1a2e',
                border: '1px solid #252535', borderRadius: '9px',
                padding: '11px 14px', color: '#e8e8f0',
                fontSize: '14px', outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: 'border-box', colorScheme: 'dark'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: '#6060a0', marginBottom: '6px'
            }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', background: '#1a1a2e',
                  border: '1px solid #252535', borderRadius: '9px',
                  padding: '11px 42px 11px 14px', color: '#e8e8f0',
                  fontSize: '14px', outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  boxSizing: 'border-box', colorScheme: 'dark'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: '#6060a0', cursor: 'pointer', fontSize: '16px'
                }}
              >{showPass ? '🙈' : '👁'}</button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              background: loading ? '#3a3a5a' : 'linear-gradient(135deg, #8b7ff0, #6a8af0)',
              border: 'none', borderRadius: '9px',
              color: 'white', fontSize: '14px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s'
            }}
          >
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6060a0', fontSize: '14px' }}>
          ¿No tienes cuenta?{' '}
          <button
            onClick={onNavigateRegister}
            style={{
              background: 'none', border: 'none',
              color: '#a89ef5', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif"
            }}
          >Crear cuenta</button>
        </p>
      </div>
    </div>
  )
}
