import { fmt, fmtM, MONTHS, styles, type PageProps } from '@/lib/helpers'

export default function ConsolidadoPage(props: PageProps) {
  const { allTransactions, space, selectedYear } = props
  const isEmp = space === 'empresa'

  const byMonth = MONTHS.map((_, m) => {
    const txMonth = allTransactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === m && d.getFullYear() === selectedYear
    })
    const ing = txMonth.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
    const eg = txMonth.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)
    return { ing, eg, util: ing - eg }
  })

  const totalIng = byMonth.reduce((s, m) => s + m.ing, 0)
  const totalEg = byMonth.reduce((s, m) => s + m.eg, 0)
  const totalUtil = totalIng - totalEg
  const avgMargin = totalIng > 0 ? Math.round(totalUtil / totalIng * 100) : 0

  const bestMonth = byMonth.reduce((best, m, i) => m.ing > (byMonth[best]?.ing || 0) ? i : best, 0)
  const maxVal = Math.max(...byMonth.map(m => Math.max(m.ing, m.eg))) || 1

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={styles.title}>Consolidado</div>
          <div style={styles.sub}>Vista general {isEmp ? 'empresa' : 'personal'} · {selectedYear}</div>
        </div>
      </div>

      {/* KPIs anuales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', marginBottom: '14px' }}>
        {[
          { label: 'Ingresos acum.', value: fmtM(totalIng), color: '#a89ef5', sub: `Ene — ${MONTHS[new Date().getMonth()]} ${selectedYear}` },
          { label: 'Egresos acum.', value: fmtM(totalEg), color: '#f87171', sub: `Ene — ${MONTHS[new Date().getMonth()]} ${selectedYear}` },
          { label: isEmp ? 'Utilidad acum.' : 'Ahorro acum.', value: fmtM(totalUtil), color: '#4ade80', sub: `Margen ${avgMargin}%` },
        ].map((k, i) => (
          <div key={i} style={{ ...styles.card, padding: '13px 15px' }}>
            <div style={styles.label}>{k.label}</div>
            <div style={styles.kv(k.color)}>{k.value}</div>
            <div style={{ fontSize: '10px', color: '#6060a0', marginTop: '3px' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart mensual */}
      <div style={{ ...styles.card, padding: '14px', marginBottom: '12px' }}>
        <div style={{ ...styles.label, marginBottom: '12px' }}>Evolución mensual {selectedYear}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '90px' }}>
          {byMonth.map((m, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '1px', justifyContent: 'center' }}>
              <div style={{ width: '48%', height: `${m.ing / maxVal * 80}px`, background: '#8b7ff0', borderRadius: '3px 3px 0 0', minHeight: m.ing > 0 ? '4px' : '0' }} title={`${MONTHS[i]} Ingresos: ${fmt(m.ing)}`}/>
              <div style={{ width: '48%', height: `${m.eg / maxVal * 80}px`, background: '#f87171', borderRadius: '3px 3px 0 0', minHeight: m.eg > 0 ? '4px' : '0' }} title={`${MONTHS[i]} Egresos: ${fmt(m.eg)}`}/>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {MONTHS.map((m, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '8px', color: '#6060a0' }}>{m.slice(0, 1)}</div>)}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#8b7ff0' }}/><span style={{ fontSize: '10px', color: '#6060a0' }}>Ingresos</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f87171' }}/><span style={{ fontSize: '10px', color: '#6060a0' }}>Egresos</span></div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
        <div style={{ ...styles.card, padding: '14px' }}>
          <div style={{ ...styles.label, marginBottom: '8px' }}>Mejor mes</div>
          <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '18px', fontWeight: 700, color: '#4ade80', margin: '6px 0 2px' }}>{MONTHS[bestMonth]}</div>
          <div style={{ fontSize: '11px', color: '#6060a0' }}>{fmtM(byMonth[bestMonth]?.ing || 0)} ingresos</div>
        </div>
        <div style={{ ...styles.card, padding: '14px' }}>
          <div style={{ ...styles.label, marginBottom: '8px' }}>Margen promedio</div>
          <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '18px', fontWeight: 700, color: '#a89ef5', margin: '6px 0 2px' }}>{avgMargin}%</div>
          <div style={{ fontSize: '11px', color: '#6060a0' }}>Ene — {MONTHS[new Date().getMonth()]} {selectedYear}</div>
        </div>
      </div>
    </div>
  )
}
