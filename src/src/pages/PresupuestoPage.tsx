import { fmt, MONTHS, styles, type PageProps } from '@/lib/helpers'

export default function PresupuestoPage(props: PageProps) {
  const { transactions, space, selectedMonth, selectedYear } = props

  const defaultBudgets = space === 'personal' ? [
    { cat: 'Vivienda', limit: 900000, color: '#60a5fa' },
    { cat: 'Alimentación', limit: 300000, color: '#fb923c' },
    { cat: 'Transporte', limit: 150000, color: '#c084fc' },
    { cat: 'Salud', limit: 200000, color: '#f87171' },
    { cat: 'Entretenimiento', limit: 100000, color: '#fbbf24' },
  ] : [
    { cat: 'Publicidad', limit: 1000000, color: '#f87171' },
    { cat: 'Asistente virtual', limit: 1500000, color: '#c084fc' },
    { cat: 'Software', limit: 300000, color: '#38bdf8' },
    { cat: 'Transporte', limit: 200000, color: '#818cf8' },
  ]

  const getSpent = (cat: string) =>
    transactions.filter(t => t.type === 'egreso' && t.description.toLowerCase().includes(cat.toLowerCase()))
      .reduce((s, t) => s + t.amount, 0)

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={styles.title}>Presupuesto</div>
          <div style={styles.sub}>Límites por categoría · {MONTHS[selectedMonth]} {selectedYear}</div>
        </div>
        <button style={{ ...styles.btn, opacity: 0.6, cursor: 'not-allowed' }} title="Próximamente">+ Agregar límite</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {defaultBudgets.map((b, i) => {
          const spent = getSpent(b.cat)
          const pct = Math.min(100, Math.round(spent / b.limit * 100))
          const over = spent > b.limit
          return (
            <div key={i} style={{ ...styles.card, padding: '13px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color }}/>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#e8e8f0' }}>{b.cat}</span>
                </div>
                <span style={{ fontSize: '11px', color: over ? '#f87171' : '#6060a0' }}>{fmt(spent)} / {fmt(b.limit)}</span>
              </div>
              <div style={{ background: '#1a1a2e', height: '7px', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: over ? '#f87171' : b.color, borderRadius: '99px', transition: '0.4s' }}/>
              </div>
              <div style={{ fontSize: '10px', marginTop: '5px', color: over ? '#f87171' : '#6060a0' }}>
                {pct}% utilizado{over ? ' · ⚠ Límite superado' : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
