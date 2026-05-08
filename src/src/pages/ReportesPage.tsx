import { useState } from 'react'
import { fmt, fmtM, MONTHS, styles, type PageProps } from '@/lib/helpers'

export default function ReportesPage(props: PageProps) {
  const { transactions, space, selectedMonth, selectedYear, onMonthChange } = props
  const [tab, setTab] = useState('resumen')
  const [paretoView, setParetoView] = useState('ingresos')
  const isEmp = space === 'empresa'

  const ing = transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const eg = transactions.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)
  const util = ing - eg
  const margin = ing > 0 ? Math.round(util / ing * 100) : 0

  // Group by description for pareto
  const groupBy = (type: string) => {
    const map: Record<string, number> = {}
    transactions.filter(t => t.type === type).forEach(t => {
      map[t.description] = (map[t.description] || 0) + t.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }))
  }

  const tabs = ['resumen', 'ingresos', ...(isEmp ? ['costos'] : []), 'gastos', 'pareto']

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={styles.title}>Reportes</div>
          <div style={styles.sub}>{MONTHS[selectedMonth]} {selectedYear}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <select value={selectedMonth} onChange={e => onMonthChange(Number(e.target.value))} style={{ ...styles.select, width: 'auto', padding: '6px 10px' }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '3px', background: '#1a1a2e', border: '1px solid #252535', borderRadius: '11px', padding: '3px', marginBottom: '16px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '6px', textAlign: 'center', borderRadius: '8px',
            cursor: 'pointer', fontSize: '11px', fontWeight: 500,
            border: tab === t ? '1px solid #252535' : 'none',
            background: tab === t ? '#12121e' : 'transparent',
            color: tab === t ? '#e8e8f0' : '#7070b0',
            fontFamily: "'DM Sans', sans-serif"
          }}>{t === 'pareto' ? 'Pareto 80/20' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* RESUMEN */}
      {tab === 'resumen' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '9px', marginBottom: '12px' }}>
            {[
              { label: 'Ingresos', value: fmtM(ing), color: '#a89ef5' },
              { label: 'Ut. bruta', value: fmtM(ing), color: '#a89ef5', sub: `Margen ${margin}%` },
              { label: 'Ut. operacional', value: fmtM(util), color: '#a89ef5', sub: `Margen ${margin}%` },
              { label: 'Ut. neta', value: fmtM(util), color: '#4ade80' },
            ].map((k, i) => (
              <div key={i} style={{ ...styles.card, padding: '11px 13px' }}>
                <div style={styles.label}>{k.label}</div>
                <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '-.03em', color: k.color, margin: '4px 0 2px' }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: '10px', color: '#4ade80' }}>{k.sub}</div>}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
            <div style={{ ...styles.card, padding: '14px' }}>
              <div style={{ ...styles.label, marginBottom: '10px' }}>Ingresos vs Egresos</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '80px' }}>
                {[{ v: ing, c: '#8b7ff0', l: 'Ingresos' }, { v: eg, c: '#f87171', l: 'Egresos' }, { v: Math.max(0, util), c: '#4ade80', l: 'Neto' }].map((b, i) => {
                  const max = Math.max(ing, eg, util) || 1
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '9px', color: '#6060a0' }}>{fmtM(b.v)}</div>
                      <div style={{ width: '100%', height: `${b.v / max * 60}px`, background: b.c, borderRadius: '3px 3px 0 0', minHeight: '4px' }}/>
                      <div style={{ fontSize: '8px', color: '#6060a0' }}>{b.l}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ ...styles.card, padding: '14px' }}>
              <div style={{ ...styles.label, marginBottom: '10px' }}>Margen</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', gap: '14px' }}>
                <svg width="60" height="60" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a2e" strokeWidth="3.5"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8b7ff0" strokeWidth="3.5" strokeDasharray={`${margin} 100`} strokeLinecap="round"/>
                </svg>
                <div style={{ fontSize: '22px', fontFamily: "'Satoshi', sans-serif", fontWeight: 700, color: '#a89ef5' }}>{margin}%</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* INGRESOS / GASTOS */}
      {(tab === 'ingresos' || tab === 'gastos' || tab === 'costos') && (() => {
        const type = tab === 'ingresos' ? 'ingreso' : 'egreso'
        const total = tab === 'ingresos' ? ing : eg
        const color = tab === 'ingresos' ? '#a89ef5' : '#f87171'
        const items = groupBy(type)
        return (
          <>
            <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '22px', fontWeight: 700, letterSpacing: '-.04em', marginBottom: '14px', color }}>{fmt(total)}</div>
            <div style={{ ...styles.card, padding: '14px' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6060a0', fontSize: '12px', padding: '20px' }}>No hay {tab} este mes</div>
              ) : items.map((item, i) => {
                const pct = total > 0 ? Math.round(item.amount / total * 100) : 0
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px' }}>
                    <span style={{ fontSize: '11px', flex: 1, color: '#c0c0e0' }}>{item.name}</span>
                    <div style={{ flex: 1.5, height: '5px', background: '#1a1a2e', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px' }}/>
                    </div>
                    <span style={{ fontSize: '10px', color: '#6060a0', minWidth: '26px', textAlign: 'right' }}>{pct}%</span>
                    <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '11px', fontWeight: 700, color, minWidth: '80px', textAlign: 'right' }}>{fmt(item.amount)}</span>
                  </div>
                )
              })}
            </div>
          </>
        )
      })()}

      {/* PARETO */}
      {tab === 'pareto' && (() => {
        const items = groupBy(paretoView === 'ingresos' ? 'ingreso' : 'egreso')
        const total = paretoView === 'ingresos' ? ing : eg
        const isIng = paretoView === 'ingresos'
        const color = isIng ? '#a89ef5' : '#f87171'
        const barColor = isIng ? '#8b7ff0' : '#f87171'

        let acum = 0
        const itemsCalc = items.map((it, i) => {
          const pct = total > 0 ? Math.round(it.amount / total * 100) : 0
          acum += pct
          return { ...it, pct, acum, rank: i + 1 }
        })
        const cutIdx = itemsCalc.findIndex(it => it.acum >= 80)
        const countTop = cutIdx === -1 ? itemsCalc.length : cutIdx + 1
        const pctTop = itemsCalc[Math.max(0, countTop - 1)]?.acum || 0

        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', marginBottom: '14px' }}>
              <div style={{ ...styles.card, padding: '12px 14px' }}><div style={styles.label}>Ingresos</div><div style={styles.kv('#a89ef5')}>{fmtM(ing)}</div></div>
              <div style={{ ...styles.card, padding: '12px 14px' }}><div style={styles.label}>Egresos</div><div style={styles.kv('#f87171')}>{fmtM(eg)}</div></div>
              <div style={{ ...styles.card, padding: '12px 14px' }}><div style={styles.label}>Neto</div><div style={styles.kv('#4ade80')}>{fmtM(util)}</div><div style={{ fontSize: '10px', color: '#6060a0', marginTop: '3px' }}>Margen {margin}%</div></div>
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '14px' }}>
              {[{ v: 'ingresos', l: '📈 ¿De dónde entra más?' }, { v: 'egresos', l: '📉 ¿A dónde se va más?' }].map(btn => (
                <button key={btn.v} onClick={() => setParetoView(btn.v)} style={{
                  padding: '6px 14px', borderRadius: '99px', fontSize: '11px', fontWeight: 500,
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  border: paretoView === btn.v ? (btn.v === 'ingresos' ? '1px solid rgba(139,127,240,.35)' : '1px solid rgba(248,113,113,.3)') : '1px solid #252535',
                  background: paretoView === btn.v ? (btn.v === 'ingresos' ? 'rgba(139,127,240,.15)' : 'rgba(248,113,113,.1)') : '#1a1a2e',
                  color: paretoView === btn.v ? (btn.v === 'ingresos' ? '#a89ef5' : '#f87171') : '#8888b8'
                }}>{btn.l}</button>
              ))}
            </div>

            <div style={{ ...styles.card, padding: '18px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '15px', fontWeight: 700, color: '#e8e8f0' }}>Análisis Pareto 80/20</div>
                  <div style={{ fontSize: '12px', color: '#6060a0', marginTop: '4px' }}>
                    <span style={{ color: '#e8e8f0', fontWeight: 600 }}>{countTop}</span> de {items.length} {isIng ? 'fuentes' : 'categorías'} generan el{' '}
                    <span style={{ color, fontSize: '15px', fontWeight: 700 }}>{pctTop}%</span> de tus {isIng ? 'ingresos' : 'egresos'}
                  </div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: 700, background: isIng ? 'rgba(139,127,240,.15)' : 'rgba(248,113,113,.12)', color, border: `1px solid ${isIng ? 'rgba(139,127,240,.3)' : 'rgba(248,113,113,.25)'}` }}>
                  {isIng ? 'INGRESOS' : 'EGRESOS'}
                </div>
              </div>

              {itemsCalc.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6060a0', fontSize: '12px', padding: '20px' }}>No hay datos este mes</div>
              ) : itemsCalc.map((it, i) => {
                const isTop = i < countTop
                const barW = items[0]?.amount > 0 ? Math.round(it.amount / items[0].amount * 100) : 0
                return (
                  <div key={i}>
                    {i === countTop && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0 10px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(139,127,240,.25)' }}/>
                        <div style={{ fontSize: '10px', color: '#8b7ff0', fontWeight: 600, whiteSpace: 'nowrap' }}>─── 80% alcanzado</div>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(139,127,240,.25)' }}/>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '6px 8px', borderRadius: '8px', opacity: isTop ? 1 : 0.45 }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0, background: isTop ? barColor : '#1a1a2e', color: isTop ? 'white' : '#6060a0' }}>{it.rank}</div>
                      <div style={{ fontSize: '12px', fontWeight: 500, flex: 1, color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                      <div style={{ flex: 1.8, height: '6px', background: '#1a1a2e', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barW}%`, background: isTop ? barColor : '#2a2a3e', borderRadius: '99px' }}/>
                      </div>
                      <div style={{ fontSize: '10px', color: '#6060a0', minWidth: '26px', textAlign: 'right' }}>{it.pct}%</div>
                      <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '12px', fontWeight: 700, minWidth: '84px', textAlign: 'right', color: isTop ? color : '#6060a0' }}>{fmt(it.amount)}</div>
                    </div>
                  </div>
                )
              })}

              <div style={{ marginTop: '12px', padding: '10px 12px', background: '#0f0f1a', borderRadius: '8px', border: '1px solid #1e1e2e', fontSize: '10px', color: '#5555a0', lineHeight: 1.6 }}>
                <strong style={{ color: '#8b7ff0' }}>Principio de Pareto:</strong> El ~20% de tus {isIng ? 'fuentes de ingreso' : 'categorías de gasto'} concentran el ~80% del total {isIng ? 'generado' : 'gastado'}.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ ...styles.card, padding: '14px', border: `1px solid ${isIng ? 'rgba(139,127,240,.25)' : 'rgba(248,113,113,.2)'}` }}>
                <div style={styles.label}>Top {countTop} concentran</div>
                <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '28px', fontWeight: 700, color, letterSpacing: '-.04em', margin: '6px 0' }}>{pctTop}%</div>
                <div style={{ height: '8px', background: '#1a1a2e', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pctTop}%`, background: isIng ? 'linear-gradient(90deg,#8b7ff0,#6a8af0)' : 'linear-gradient(90deg,#f87171,#fb923c)', borderRadius: '99px' }}/>
                </div>
              </div>
              <div style={{ ...styles.card, padding: '14px' }}>
                <div style={styles.label}>Promedio por {isIng ? 'fuente' : 'categoría'}</div>
                <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '22px', fontWeight: 700, color: '#e8e8f0', letterSpacing: '-.04em', margin: '6px 0' }}>{items.length > 0 ? fmtM(Math.round(total / items.length)) : '$0'}</div>
                <div style={{ fontSize: '11px', color: '#6060a0' }}>{items.length} {isIng ? 'fuentes' : 'categorías'}</div>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
