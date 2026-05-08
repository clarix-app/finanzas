import { useState } from 'react'
import { MONTHS, styles, type PageProps } from '@/lib/helpers'

interface Props extends PageProps {
  onClose: () => void
}

const aiExamples = {
  audio: { type: 'egreso', amount: 800000, description: 'Pago arriendo', payment_method: 'Transferencia' },
  foto: { type: 'egreso', amount: 245000, description: 'Supermercado', payment_method: 'Efectivo' },
  chat: { type: 'ingreso', amount: 1500000, description: 'Consultoría a cliente', payment_method: 'Transferencia' },
}

const aiMessages = {
  audio: ['🎙 Escuchando...', '✅ "Pagué arriendo 800 mil" → Egreso / $800.000'],
  foto: ['📷 Analizando recibo...', '✅ Factura supermercado → Egreso / $245.000'],
  chat: ['💬 Procesando texto...', '✅ "Cobré consultoría 1.5M" → Ingreso / $1.500.000'],
}

export default function NuevaTxModal({ categories, paymentMethods, space, selectedMonth, selectedYear, onAddTransaction, onClose }: Props) {
  const [type, setType] = useState<'ingreso' | 'egreso'>('ingreso')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.name || '')
  const [client, setClient] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiFeedback, setAiFeedback] = useState('')
  const [showMenu, setShowMenu] = useState(true)
  const [mode, setMode] = useState<'menu' | 'form'>('menu')

  const isEmp = space === 'empresa'
  const filteredCats = categories.filter(c => type === 'ingreso' ? c.type === 'ingreso' : c.type !== 'ingreso')

  const doAI = (aiType: 'audio' | 'foto' | 'chat') => {
    setMode('form')
    setAiFeedback(aiMessages[aiType][0])
    setTimeout(() => {
      const data = aiExamples[aiType]
      setType(data.type as any)
      setAmount(String(data.amount))
      setDescription(data.description)
      setPaymentMethod(data.payment_method)
      setAiFeedback(aiMessages[aiType][1])
    }, 1200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount) return
    setLoading(true)
    await onAddTransaction({
      space, date, type,
      description, amount: Number(amount),
      payment_method: paymentMethod,
      client: isEmp ? client : undefined,
    })
    setLoading(false)
    onClose()
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(5,5,10,.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, backdropFilter: 'blur(4px)'
  }

  const modal: React.CSSProperties = {
    background: '#17172a', border: '1px solid #2a2a3e',
    borderRadius: '14px', padding: '20px',
    width: '380px', maxWidth: '95vw',
    boxShadow: '0 8px 40px rgba(0,0,0,.7)',
    fontFamily: "'DM Sans', sans-serif"
  }

  if (mode === 'menu') return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modal, width: '340px' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#e8e8f0' }}>¿Cómo quieres registrar?</div>
        <div style={{ fontSize: '11px', color: '#6060a0', marginBottom: '14px' }}>Elige el método de entrada</div>
        {[
          { id: 'manual', icon: '✏️', label: 'Manual', desc: 'Llena el formulario paso a paso' },
          { id: 'audio', icon: '🎙', label: 'Audio', desc: 'Habla: "Gasté 50 mil en taxi hoy"' },
          { id: 'foto', icon: '📷', label: 'Foto de recibo', desc: 'Sube una foto y la IA lo lee' },
          { id: 'chat', icon: '💬', label: 'Chat IA', desc: 'Escribe en lenguaje natural' },
        ].map(opt => (
          <div key={opt.id} onClick={() => opt.id === 'manual' ? setMode('form') : doAI(opt.id as any)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #2a2a3e', background: '#12121e', marginBottom: '8px', transition: 'border-color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,127,240,.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a3e')}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(139,127,240,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{opt.icon}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8e8f0' }}>{opt.label}</div>
              <div style={{ fontSize: '10px', color: '#6060a0', marginTop: '1px' }}>{opt.desc}</div>
            </div>
          </div>
        ))}
        <button onClick={onClose} style={{ width: '100%', padding: '9px', background: 'transparent', border: '1px solid #252535', borderRadius: '9px', color: '#6060a0', fontSize: '12px', cursor: 'pointer', marginTop: '4px', fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
      </div>
    </div>
  )

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '15px', marginBottom: '14px', color: '#e8e8f0' }}>Nueva transacción</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as any)} style={{ ...styles.select, marginBottom: 0 }}>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...styles.input as any, marginBottom: 0, display: 'block' }}/>
            </div>
          </div>

          <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Descripción</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Consultoría con cliente..." required style={{ ...styles.input as any, display: 'block' }}/>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <div>
              <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Monto</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required style={{ ...styles.input as any, marginBottom: 0, display: 'block' }}/>
            </div>
            <div>
              <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Forma de pago</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...styles.select, marginBottom: 0 }}>
                {paymentMethods.map(pm => <option key={pm.id}>{pm.name}</option>)}
              </select>
            </div>
          </div>

          {isEmp && (
            <>
              <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Cliente (opcional)</label>
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="Nombre del cliente..." style={{ ...styles.input as any, display: 'block' }}/>
            </>
          )}

          {aiFeedback && (
            <div style={{ background: '#1a1a2e', border: '1px solid #252535', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '11px', color: '#a89ef5' }}>{aiFeedback}</div>
          )}

          {/* IA buttons */}
          <div style={{ background: '#1a1a2e', border: '1px solid #252535', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#6060a0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>✨ IA activa</div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {(['audio', 'foto', 'chat'] as const).map(t => (
                <button key={t} type="button" onClick={() => doAI(t)} style={{ flex: 1, padding: '6px', background: '#12121e', border: '1px solid #252535', borderRadius: '7px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', color: '#c0c0e0', fontFamily: "'DM Sans', sans-serif" }}>
                  {t === 'audio' ? '🎙' : t === 'foto' ? '📷' : '💬'} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '7px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: '1px solid #2a2a3e', background: '#1a1a2e', color: '#c0c0e0', fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
