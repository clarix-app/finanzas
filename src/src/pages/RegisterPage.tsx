import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface RegisterPageProps {
  onNavigateLogin: () => void
}

export default function RegisterPage({ onNavigateLogin }: RegisterPageProps) {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password, name)
    if (error) setError(error.message || 'Error al crear cuenta')
    else setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div style={{
      minHeight: '100vh', background: '#0d0d14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ textAlign: 'center', maxWidth: '380px', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontFamily: "'Satoshi', sans-serif", color: '#e8e8f0', fontSize: '22px', marginBottom: '10px' }}>
          ¡Cuenta creada!
        </h2>
        <p style={{ color: '#6060a0', fontSize: '14px', marginBottom: '24px' }}>
          Revisa tu email para confirmar tu cuenta y luego inicia sesión.
        </p>
        <button onClick={onNavigateLogin} style={{
          padding: '12px 28px',
          background: 'linear-gradient(135deg, #8b7ff0, #6a8af0)',
          border: 'none', borderRadius: '9px',
          color: 'white', fontSize: '14px', fontWeight: 600,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
        }}>Ir al login</button>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
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
            fontFamily: "'Satoshi', sans-serif", fontSize: '28px', fontWeight: 700,
            color: '#e8e8f0', letterSpacing: '-0.02em', margin: '0 0 6px'
          }}>Clarix</h1>
          <p style={{ color: '#6060a0', fontSize: '14px', margin: 0 }}>Crea tu cuenta gratis</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#12121e', border: '1px solid #252535',
          borderRadius: '16px', padding: '28px'
        }}>
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: '8px', padding: '10px 14px',
              color: '#f87171', fontSize: '13px', marginBottom: '16px'
            }}>{error}</div>
          )}

          {[
            { label: 'Nombre', value: name, setter: setName, type: 'text', placeholder: 'Tu nombre' },
            { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'tu@email.com' },
            { label: 'Contraseña', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
          ].map((field, i) => (
            <div key={i} style={{ marginBottom: i === 2 ? '20px' : '16px' }}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: '#6060a0', marginBottom: '6px'
              }}>{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
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
          ))}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? '#3a3a5a' : 'linear-gradient(135deg, #8b7ff0, #6a8af0)',
            border: 'none', borderRadius: '9px',
            color: 'white', fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6060a0', fontSize: '14px' }}>
          ¿Ya tienes cuenta?{' '}
          <button onClick={onNavigateLogin} style={{
            background: 'none', border: 'none', color: '#a89ef5',
            cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif"
          }}>Iniciar sesión</button>
        </p>
      </div>
    </div>
  )
}
