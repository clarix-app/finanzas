import { useState } from 'react'
import { fmt, MONTHS, styles, type PageProps } from '@/lib/helpers'
import NuevaTxModal from '@/components/dashboard/NuevaTxModal'

export default function DashboardPage(props: PageProps) {
  const { transactions, gamification, space, selectedMonth, selectedYear, userName, onMonthChange } = props
  const [showModal, setShowModal] = useState(false)

  const ing = transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const eg = transactions.filter(t => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)
  const bal = ing - eg
  const isEmp = space === 'empresa'

  const xpToNext = 500
  const xpProgress = gamification ? ((gamification.xp % xpToNext) / xpToNext) * 100 : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={styles.title}>Inicio</div>
          <div style={styles.sub}>{isEmp ? 'Finanzas empresa' : 'Finanzas personales'} · {MONTHS[selectedMonth]} {selectedYear}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <select value={selectedMonth} onChange={e => onMonthChange(Number(e.target.value))} style={{ ...styles.select, width: 'auto', padding: '6px 10px' }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <button style={styles.btn} onClick={() => setShowModal(true)}>+ Registrar</button>
        </div>
      </div>

      {/* Greeting card */}
      <div style={{ ...styles.card, padding: '16px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle,rgba(139,127,240,.08),transparent 70%)', pointerEvents: 'none' }}/>
        <div>
          <div style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '15px', color: '#e8e8f0' }}>
            {greeting}, {userName} 👋
          </div>
          <div style={{ fontSize: '11px', color: '#6060a0', marginTop: '3px' }}>
            {isEmp ? 'Tu negocio va por buen camino' : 'Tus finanzas están bajo control'}
          </div>
          {gamification && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '7px', fontSize: '11px', color: '#fbbf24' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fbbf24' }}/>
              {gamification.streak_days} días de racha 🔥
            </div>
          )}
        </div>
        {gamification && (
          <div style={{ textAlign: 'right', minWidth: '140px' }}>
            <div style={{ fontSize: '10px', color: '#6060a0', marginBottom: '5px' }}>
              Nivel {gamification.level} · {xpToNext - (gamification.xp % xpToNext)} XP para nivel {gamification.level + 1}
            </div>
            <div style={{ width: '130px', height: '5px', background: '#1a1a2e', borderRadius: '99px', overflow: 'hidden', marginLeft: 'auto' }}>
              <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg,#8b7ff0,#6a8af0)', borderRadius: '99px' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6060a0', marginTop: '3px', width: '130px', marginLeft: 'auto' }}>
              <span>{gamification.xp} XP</span>
              <span>{Math.round(xpProgress)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '9px', marginBottom: '12px' }}>
        {[
          { label: 'Ingresos', value: ing, color: '#a89ef5' },
          { label: isEmp ? 'Egresos' : 'Gastos', value: eg, color: '#f87171' },
          { label: isEmp ? 'Utilidad' : 'Ahorro', value: bal, color: '#4ade80' },
        ].map((k, i) => (
          <div key={i} style={{ ...styles.card, padding: '13px 15px' }}>
            <div style={styles.label}>{k.label}</div>
            <div style={styles.kv(k.color)}>{fmt(k.value)}</div>
            <div style={{ fontSize: '10px', color: '#6060a0', marginTop: '3px' }}>{MONTHS[selectedMonth]} {selectedYear}</div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div style={{ ...styles.card, padding: '14px' }}>
        <div style={{ ...styles.label, marginBottom: '10px' }}>Últimos movimientos</div>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#6060a0', fontSize: '12px' }}>
            No hay movimientos este mes. ¡Registra el primero!
          </div>
        ) : (
          transactions.slice(0, 5).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(37,37,53,.5)' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#c0c0e0' }}>{t.description}</div>
                <div style={{ fontSize: '10px', color: '#6060a0', marginTop: '2px' }}>{t.date} · {t.payment_method || '—'}</div>
              </div>
              <div style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '13px', color: t.type === 'ingreso' ? '#4ade80' : '#f87171' }}>
                {t.type === 'ingreso' ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && <NuevaTxModal {...props} onClose={() => setShowModal(false)} />}
    </div>
  )
}
