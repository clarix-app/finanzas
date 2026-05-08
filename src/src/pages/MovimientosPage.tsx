import { useState } from 'react'
import { fmt, MONTHS, catColor, styles, type PageProps } from '@/lib/helpers'
import NuevaTxModal from '@/components/dashboard/NuevaTxModal'

export default function MovimientosPage(props: PageProps) {
  const { transactions, categories, space, selectedMonth, selectedYear, onMonthChange, onDeleteTransaction } = props
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('')
  const [cajaView, setCajaView] = useState(false)
  const [cajaFilter, setCajaFilter] = useState('hoy')

  const isEmp = space === 'empresa'
  const filtered = filter ? transactions.filter(t => t.type === filter) : transactions
  const ing = filtered.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const eg = filtered.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)

  // Caja: group by payment method
  const now = new Date()
  const cajaRanges: Record<string, number> = { hoy: 0, '7d': 7, '15d': 15, '30d': 30 }
  const days = cajaRanges[cajaFilter] || 0
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)

  const cajaTx = cajaFilter === 'hoy'
    ? transactions.filter(t => t.date === now.toISOString().split('T')[0])
    : transactions.filter(t => new Date(t.date) >= cutoff)

  const cajaIng = cajaTx.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const cajaEg = cajaTx.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)

  const byMethod = (type: string) => {
    const map: Record<string, number> = {}
    cajaTx.filter(t => t.type === type).forEach(t => {
      const pm = t.payment_method || 'Sin método'
      map[pm] = (map[pm] || 0) + t.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={styles.title}>Movimientos</div>
          <div style={styles.sub}>{isEmp ? 'Finanzas empresa' : 'Finanzas personales'} · {MONTHS[selectedMonth]} {selectedYear}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select value={selectedMonth} onChange={e => onMonthChange(Number(e.target.value))} style={{ ...styles.select, width: 'auto', padding: '6px 10px' }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            <option value={-1}>Acumulado</option>
          </select>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...styles.select, width: 'auto', padding: '6px 10px' }}>
            <option value="">Todos</option>
            <option value="ingreso">Ingresos</option>
            <option value="egreso">Egresos</option>
          </select>
          <button style={styles.btn} onClick={() => setShowModal(true)}>+ Registrar</button>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {['Movimientos', 'Caja'].map((tab, i) => (
          <button key={i} onClick={() => setCajaView(i === 1)} style={{
            padding: '6px 13px', borderRadius: '7px', fontSize: '11px', fontWeight: 500,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            border: (i === 1) === cajaView ? '1px solid rgba(139,127,240,.3)' : '1px solid #252535',
            background: (i === 1) === cajaView ? 'rgba(139,127,240,.18)' : '#1a1a2e',
            color: (i === 1) === cajaView ? '#b0a8ff' : '#8888b8'
          }}>{tab}</button>
        ))}
      </div>

      {!cajaView ? (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', marginBottom: '11px' }}>
            {[
              { label: 'Ingresos', value: ing, color: '#a89ef5' },
              { label: 'Egresos', value: eg, color: '#f87171' },
              { label: isEmp ? 'Utilidad' : 'Balance', value: ing - eg, color: '#4ade80' },
            ].map((k, i) => (
              <div key={i} style={{ ...styles.card, padding: '13px 15px' }}>
                <div style={styles.label}>{k.label}</div>
                <div style={styles.kv(k.color)}>{fmt(k.value)}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ ...styles.card, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isEmp ? '80px 110px 1fr 80px 90px' : '80px 110px 1fr 90px', padding: '8px 13px', borderBottom: '1px solid #252535', fontSize: '10px', color: '#6060a0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Fecha</span><span>Categoría</span><span>Descripción</span>{isEmp && <span>Cliente</span>}<span style={{ textAlign: 'right' }}>Monto</span>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6060a0', fontSize: '12px' }}>No hay movimientos este mes</div>
            ) : filtered.map(t => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: isEmp ? '80px 110px 1fr 80px 90px' : '80px 110px 1fr 90px', padding: '9px 13px', borderBottom: '1px solid rgba(37,37,53,.5)', alignItems: 'center', fontSize: '12px', color: '#c0c0e0', cursor: 'pointer' }}
                onDoubleClick={() => onDeleteTransaction(t.id)}
                title="Doble clic para eliminar">
                <span style={{ fontSize: '11px', color: '#6060a0' }}>{t.date.slice(5).replace('-', '/')}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: catColor(t.description, categories), flexShrink: 0 }}/>
                  {t.description.split(' ')[0]}
                </span>
                <span>{t.description}</span>
                {isEmp && <span style={{ fontSize: '11px', color: '#6060a0' }}>{t.client || '—'}</span>}
                <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, textAlign: 'right', color: t.type === 'ingreso' ? '#4ade80' : '#f87171' }}>
                  {t.type === 'ingreso' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: '#6060a0', marginTop: '6px', textAlign: 'center' }}>Doble clic en una fila para eliminar</div>
        </>
      ) : (
        <>
          {/* Caja filters */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {['hoy', '7d', '15d', '30d'].map(f => (
              <button key={f} onClick={() => setCajaFilter(f)} style={{
                padding: '5px 11px', borderRadius: '99px', fontSize: '11px', fontWeight: 500,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                border: cajaFilter === f ? 'none' : '1px solid #252535',
                background: cajaFilter === f ? 'linear-gradient(135deg,#8b7ff0,#6a8af0)' : '#1a1a2e',
                color: cajaFilter === f ? 'white' : '#8888b8'
              }}>{f === 'hoy' ? 'Hoy' : f === '7d' ? '7 días' : f === '15d' ? '15 días' : '30 días'}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '9px', marginBottom: '12px' }}>
            {[
              { label: 'Saldo inicial', value: '0', color: '#e8e8f0', sub: 'Opcional' },
              { label: 'Ingresos', value: fmt(cajaIng), color: '#a89ef5' },
              { label: 'Egresos', value: fmt(cajaEg), color: '#f87171' },
              { label: 'Disponible', value: fmt(cajaIng - cajaEg), color: '#4ade80' },
            ].map((c, i) => (
              <div key={i} style={{ ...styles.card, padding: '11px 13px' }}>
                <div style={styles.label}>{c.label}</div>
                <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', fontWeight: 700, letterSpacing: '-.03em', marginTop: '4px', color: c.color }}>{c.value}</div>
                {c.sub && <div style={{ fontSize: '10px', color: '#6060a0', marginTop: '2px' }}>{c.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { title: 'Ingresos por método de pago', data: byMethod('ingreso'), color: '#4ade80' },
              { title: 'Egresos por método de pago', data: byMethod('egreso'), color: '#f87171' },
            ].map((section, i) => (
              <div key={i}>
                <div style={{ ...styles.label, marginBottom: '8px' }}>{section.title}</div>
                <div style={{ ...styles.card, overflow: 'hidden' }}>
                  {section.data.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#6060a0' }}>Sin movimientos</div>
                  ) : section.data.map(([pm, amt]) => (
                    <div key={pm} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', borderBottom: '1px solid rgba(37,37,53,.4)' }}>
                      <span style={{ fontSize: '12px', color: '#c0c0e0' }}>{pm}</span>
                      <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '13px', fontWeight: 700, color: section.color }}>{fmt(amt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && <NuevaTxModal {...props} onClose={() => setShowModal(false)} />}
    </div>
  )
}
