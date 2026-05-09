import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Transaction, Category, PaymentMethod, Gamification, Space } from '@/types'
import DashboardPage from '@/pages/DashboardPage'
import MovimientosPage from '@/pages/MovimientosPage'
import ConsolidadoPage from '@/pages/ConsolidadoPage'
import PresupuestoPage from '@/pages/PresupuestoPage'
import ReportesPage from '@/pages/ReportesPage'
import AjustesPage from '@/pages/AjustesPage'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function App() {
  const { user, signOut } = useAuth()
  const [page, setPage] = useState('dashboard')
  const [space, setSpace] = useState<Space>('personal')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear] = useState(new Date().getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [gamification, setGamification] = useState<Gamification | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadAll() }, [user, space])

  async function loadAll() {
    setLoading(true)
    const [txRes, catRes, pmRes, gamRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user!.id).eq('space', space).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user!.id),
      supabase.from('payment_methods').select('*').eq('user_id', user!.id),
      supabase.from('gamification').select('*').eq('user_id', user!.id).single(),
    ])
    if (txRes.data) setTransactions(txRes.data)
    if (catRes.data) setCategories(catRes.data)
    if (pmRes.data) setPaymentMethods(pmRes.data)
    if (gamRes.data) setGamification(gamRes.data)
    setLoading(false)
  }

  async function addTransaction(tx: any) {
    const { data, error } = await supabase.from('transactions').insert({ ...tx, user_id: user!.id, space }).select().single()
    if (!error && data) {
      setTransactions(prev => [data, ...prev])
      const newXp = (gamification?.xp || 0) + 10
      const newLevel = Math.floor(newXp / 500) + 1
      await supabase.from('gamification').update({ xp: newXp, level: newLevel, streak_days: (gamification?.streak_days || 0) + 1, last_record_date: new Date().toISOString().split('T')[0] }).eq('user_id', user!.id)
      setGamification(prev => prev ? { ...prev, xp: newXp, level: newLevel } : prev)
    }
  }

  async function deleteTransaction(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  async function addCategory(cat: any) {
    const { data } = await supabase.from('categories').insert({ ...cat, user_id: user!.id }).select().single()
    if (data) setCategories(prev => [...prev, data])
  }

  async function deleteCategory(id: string) {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  async function addPaymentMethod(name: string) {
    const { data } = await supabase.from('payment_methods').insert({ name, user_id: user!.id }).select().single()
    if (data) setPaymentMethods(prev => [...prev, data])
  }

  async function deletePaymentMethod(id: string) {
    await supabase.from('payment_methods').delete().eq('id', id)
    setPaymentMethods(prev => prev.filter(p => p.id !== id))
  }

  const filteredTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  const spaceCats = categories.filter(c => c.space === space || c.space === 'ambos')
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario'

  const pageProps = {
    transactions: filteredTx, allTransactions: transactions,
    categories: spaceCats, paymentMethods, gamification,
    space, selectedMonth, selectedYear, userName, loading,
    onAddTransaction: addTransaction, onDeleteTransaction: deleteTransaction,
    onAddCategory: addCategory, onDeleteCategory: deleteCategory,
    onAddPaymentMethod: addPaymentMethod, onDeletePaymentMethod: deletePaymentMethod,
    onMonthChange: setSelectedMonth,
  }

  const navItems = [
    { id: 'dashboard', label: 'Inicio', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
    { id: 'movimientos', label: 'Movimientos', d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
    { id: 'consolidado', label: 'Consolidado', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
    { id: 'presupuesto', label: 'Presupuesto', d: 'M3 3h18v18H3zM3 9h18M9 21V9' },
    { id: 'reportes', label: 'Reportes', d: 'M18 20V10M12 20V4M6 20v-6' },
  ]

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0d0d14', fontFamily:"'DM Sans', sans-serif", colorScheme:'dark' as any }}>
      {/* SIDEBAR */}
      <div style={{ width:'200px', flexShrink:0, background:'#0f0f18', borderRight:'1px solid #1e1e2e', display:'flex', flexDirection:'column', height:'100vh' }}>
        <div style={{ padding:'16px 14px 12px', borderBottom:'1px solid #1e1e2e' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#8b7ff0,#6a8af0)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'8px', boxShadow:'0 0 14px rgba(139,127,240,.35)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div style={{ fontFamily:"'Satoshi', sans-serif", fontWeight:700, fontSize:'15px', color:'#e8e8f0', letterSpacing:'-.02em' }}>Clarix</div>
          <div style={{ fontSize:'10px', color:'#5555a0', marginTop:'1px' }}>Planeación financiera</div>
        </div>
        <div style={{ margin:'8px 10px 4px', background:'#18182a', borderRadius:'8px', padding:'3px', display:'flex', border:'1px solid #2a2a3e' }}>
          {(['personal','empresa'] as Space[]).map(s => (
            <button key={s} onClick={() => setSpace(s)} style={{ flex:1, padding:'5px 0', textAlign:'center', borderRadius:'5px', fontSize:'10px', fontWeight:600, cursor:'pointer', border:'none', fontFamily:"'DM Sans', sans-serif", background: space===s ? 'linear-gradient(135deg,#8b7ff0,#6a8af0)' : 'transparent', color: space===s ? '#fff' : '#7070b0' }}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
        <nav style={{ flex:1, overflowY:'auto', padding:'6px 8px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 9px', borderRadius:'9px', cursor:'pointer', fontSize:'12px', fontWeight:500, marginBottom:'2px', border:'none', width:'100%', textAlign:'left', fontFamily:"'DM Sans', sans-serif", background: page===item.id ? 'rgba(139,127,240,.2)' : 'transparent', color: page===item.id ? '#b0a8ff' : '#8888b8' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.d}/></svg>
              {item.label}
            </button>
          ))}
          <div style={{ height:'1px', background:'#1e1e2e', margin:'5px 4px' }}/>
          <button onClick={() => setPage('ajustes')} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 9px', borderRadius:'9px', cursor:'pointer', fontSize:'12px', fontWeight:500, border:'none', width:'100%', textAlign:'left', fontFamily:"'DM Sans', sans-serif", background: page==='ajustes' ? 'rgba(139,127,240,.2)' : 'transparent', color: page==='ajustes' ? '#b0a8ff' : '#8888b8' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Ajustes
          </button>
        </nav>
        <div style={{ padding:'10px 12px', borderTop:'1px solid #1e1e2e', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'11px', fontWeight:500, color:'#e8e8f0' }}>{userName}</div>
            <div style={{ fontSize:'10px', color:'#5555a0', marginTop:'1px' }}>{user?.email}</div>
          </div>
          <button onClick={signOut} title="Cerrar sesión" style={{ background:'none', border:'none', color:'#6060a0', cursor:'pointer', fontSize:'16px' }}>→</button>
        </div>
      </div>
      {/* MAIN */}
      <div style={{ flex:1, overflowY:'auto', background:'#0d0d14' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#6060a0' }}>Cargando...</div>
        ) : (
          <>
            {page==='dashboard' && <DashboardPage {...pageProps} />}
            {page==='movimientos' && <MovimientosPage {...pageProps} />}
            {page==='consolidado' && <ConsolidadoPage {...pageProps} />}
            {page==='presupuesto' && <PresupuestoPage {...pageProps} />}
            {page==='reportes' && <ReportesPage {...pageProps} />}
            {page==='ajustes' && <AjustesPage {...pageProps} />}
          </>
        )}
      </div>
    </div>
  )
}
