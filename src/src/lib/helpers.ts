import type { Transaction, Category } from '@/types'

export const fmt = (n: number) => '$' + Math.abs(Math.round(n)).toLocaleString('es-CO')
export const fmtM = (n: number) => {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K'
  return fmt(n)
}

export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export const catColor = (name: string, categories: Category[]) => {
  const c = categories.find(x => x.name === name)
  return c?.color || '#7070b0'
}

export const styles = {
  page: { padding: '20px', color: '#e8e8f0', minHeight: '100vh' } as React.CSSProperties,
  title: { fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '17px', letterSpacing: '-.02em', color: '#e8e8f0' } as React.CSSProperties,
  sub: { fontSize: '11px', color: '#5555a0', marginTop: '2px' } as React.CSSProperties,
  card: { background: '#12121e', borderRadius: '12px', border: '1px solid #252535' } as React.CSSProperties,
  label: { fontWeight: 500, fontSize: '0.63rem', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#6060a0' },
  kv: (color = '#a89ef5') => ({ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-.04em', lineHeight: 1, marginTop: '5px', color } as React.CSSProperties),
  btn: { padding: '7px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#8b7ff0,#6a8af0)', color: '#fff', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  input: { width: '100%', background: '#1a1a2e', border: '1px solid #252535', borderRadius: '7px', padding: '7px 10px', color: '#e8e8f0', fontSize: '12px', outline: 'none', fontFamily: "'DM Sans', sans-serif', colorScheme: 'dark", boxSizing: 'border-box' as const, marginBottom: '9px' } as React.CSSProperties,
  select: { width: '100%', background: '#1a1a2e', border: '1px solid #252535', borderRadius: '7px', padding: '7px 10px', color: '#e8e8f0', fontSize: '12px', outline: 'none', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', boxSizing: 'border-box' as const } as React.CSSProperties,
}

export interface PageProps {
  transactions: Transaction[]
  allTransactions: Transaction[]
  categories: Category[]
  paymentMethods: any[]
  gamification: any
  space: 'personal' | 'empresa'
  selectedMonth: number
  selectedYear: number
  userName: string
  loading: boolean
  onAddTransaction: (tx: any) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
  onAddCategory: (cat: any) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onAddPaymentMethod: (name: string) => Promise<void>
  onDeletePaymentMethod: (id: string) => Promise<void>
  onMonthChange: (month: number) => void
}
