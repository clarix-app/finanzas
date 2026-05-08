import { useState } from 'react'
import { styles, type PageProps } from '@/lib/helpers'
import { useAuth } from '@/context/AuthContext'

export default function AjustesPage(props: PageProps) {
  const { categories, paymentMethods, space, onAddCategory, onDeleteCategory, onAddPaymentMethod, onDeletePaymentMethod } = props
  const { user } = useAuth()
  const [sub, setSub] = useState('')
  const [newCat, setNewCat] = useState('')
  const [newCatType, setNewCatType] = useState('ingreso')
  const [newPM, setNewPM] = useState('')

  const isEmp = space === 'empresa'
  const spaceCats = categories.filter(c => c.space === space || c.space === 'ambos')

  const adjItems = [
    { id: 'perfil', label: 'Perfil', desc: 'Nombre y configuración' },
    { id: 'categorias', label: 'Categorías', desc: 'Ingresos, costos y gastos' },
    ...(isEmp ? [{ id: 'lineas', label: 'Líneas de venta', desc: 'Productos y servicios' }] : []),
    { id: 'pagos', label: 'Métodos de pago', desc: 'Cómo recibes pagos' },
    { id: 'whatsapp', label: 'WhatsApp', desc: 'Conecta para reportes' },
  ]

  if (sub) return (
    <div style={styles.page}>
      <button onClick={() => setSub('')} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '12px', color: '#6060a0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        Ajustes
      </button>

      {sub === 'perfil' && (
        <>
          <div style={styles.title}>Perfil</div>
          <div style={{ ...styles.card, padding: '16px', marginTop: '14px' }}>
            <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Email</label>
            <div style={{ ...styles.input as any, background: '#0f0f1a', cursor: 'not-allowed', color: '#6060a0', display: 'block', marginBottom: '12px', padding: '7px 10px', borderRadius: '7px', fontSize: '12px' }}>{user?.email}</div>
            <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Moneda</label>
            <select style={{ ...styles.select, marginBottom: '0' }}>
              <option>COP — Peso colombiano</option>
              <option>USD — Dólar</option>
              <option>CLP — Peso chileno</option>
            </select>
          </div>
        </>
      )}

      {sub === 'categorias' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={styles.title}>Categorías</div>
          </div>
          <div style={{ ...styles.card, padding: '14px' }}>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {spaceCats.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 0', borderBottom: '1px solid rgba(37,37,53,.5)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: '11px', flex: 1, color: '#c0c0e0' }}>{c.name}</span>
                  <span style={{ fontSize: '9px', color: '#6060a0', background: '#1a1a2e', padding: '2px 6px', borderRadius: '99px' }}>{c.type}</span>
                  {!c.is_default && (
                    <button onClick={() => onDeleteCategory(c.id)} style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'transparent', border: 'none', color: '#6060a0', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nueva categoría..." style={{ flex: 1, background: '#1a1a2e', border: '1px solid #252535', borderRadius: '7px', padding: '6px 9px', color: '#e8e8f0', fontSize: '11px', outline: 'none', fontFamily: "'DM Sans', sans-serif", colorScheme: 'dark' as any }}/>
              <select value={newCatType} onChange={e => setNewCatType(e.target.value)} style={{ background: '#1a1a2e', border: '1px solid #252535', color: '#e8e8f0', borderRadius: '7px', padding: '5px 7px', fontSize: '10px', outline: 'none', cursor: 'pointer', colorScheme: 'dark' as any }}>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
                <option value="costo">Costo</option>
                <option value="gasto">Gasto</option>
              </select>
              <button onClick={async () => {
                if (!newCat.trim()) return
                const colors = ['#a89ef5','#60a5fa','#fb923c','#4ade80','#f87171','#c084fc','#fbbf24']
                await onAddCategory({ space, type: newCatType, name: newCat.trim(), color: colors[Math.floor(Math.random()*colors.length)], is_default: false })
                setNewCat('')
              }} style={{ padding: '6px 11px', background: 'linear-gradient(135deg,#8b7ff0,#6a8af0)', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+</button>
            </div>
          </div>
        </>
      )}

      {sub === 'pagos' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={styles.title}>Métodos de pago</div>
          </div>
          <div style={{ ...styles.card, padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#6060a0', marginBottom: '10px' }}>Configura cómo recibes los pagos.</div>
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {paymentMethods.map((pm) => (
                <div key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 0', borderBottom: '1px solid rgba(37,37,53,.5)' }}>
                  <span style={{ fontSize: '13px', width: '18px', textAlign: 'center' }}>
                    {pm.name === 'Efectivo' ? '💵' : pm.name === 'Transferencia' ? '💳' : pm.name === 'Nequi' ? '🟢' : pm.name === 'Daviplata' ? '🔵' : '💰'}
                  </span>
                  <span style={{ fontSize: '12px', flex: 1, color: '#c0c0e0' }}>{pm.name}</span>
                  {!pm.is_default && (
                    <button onClick={() => onDeletePaymentMethod(pm.id)} style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'transparent', border: 'none', color: '#6060a0', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
              <input value={newPM} onChange={e => setNewPM(e.target.value)} placeholder="Nueva forma de pago..." style={{ flex: 1, background: '#1a1a2e', border: '1px solid #252535', borderRadius: '7px', padding: '6px 9px', color: '#e8e8f0', fontSize: '11px', outline: 'none', fontFamily: "'DM Sans', sans-serif", colorScheme: 'dark' as any }}/>
              <button onClick={async () => {
                if (!newPM.trim()) return
                await onAddPaymentMethod(newPM.trim())
                setNewPM('')
              }} style={{ padding: '6px 11px', background: 'linear-gradient(135deg,#8b7ff0,#6a8af0)', color: 'white', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+</button>
            </div>
          </div>
        </>
      )}

      {sub === 'whatsapp' && (
        <>
          <div style={styles.title}>WhatsApp</div>
          <div style={{ ...styles.card, padding: '16px', marginTop: '14px' }}>
            <label style={{ ...styles.label, display: 'block', marginBottom: '4px' }}>Número</label>
            <input placeholder="+57 300 000 0000" style={{ ...styles.input as any, display: 'block' }}/>
            <div style={{ fontSize: '11px', color: '#6060a0', marginBottom: '12px' }}>Conecta tu número para consultas y reportes automáticos</div>
            <button style={{ ...styles.btn, width: '100%', textAlign: 'center' }}>Conectar WhatsApp</button>
          </div>
        </>
      )}

      {sub === 'lineas' && (
        <>
          <div style={styles.title}>Líneas de venta</div>
          <div style={{ ...styles.card, padding: '16px', marginTop: '14px' }}>
            <div style={{ textAlign: 'center', color: '#6060a0', fontSize: '12px', padding: '20px' }}>
              Las líneas de venta se crean automáticamente desde tus categorías de ingreso tipo empresa.
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={{ marginBottom: '16px' }}>
        <div style={styles.title}>Ajustes</div>
        <div style={styles.sub}>Personaliza tu experiencia</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {adjItems.map(item => (
          <div key={item.id} onClick={() => setSub(item.id)} style={{ ...styles.card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'border-color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,127,240,.35)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#252535')}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b7ff0" strokeWidth="2">
                {item.id === 'perfil' && <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>}
                {item.id === 'categorias' && <><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></>}
                {item.id === 'lineas' && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}
                {item.id === 'pagos' && <><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></>}
                {item.id === 'whatsapp' && <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#e8e8f0' }}>{item.label}</div>
              <div style={{ fontSize: '11px', color: '#6060a0', marginTop: '1px' }}>{item.desc}</div>
            </div>
            <div style={{ color: '#6060a0', fontSize: '16px' }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
