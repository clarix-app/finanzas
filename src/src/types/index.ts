export type Space = 'personal' | 'empresa'
export type TxType = 'ingreso' | 'egreso'
export type CatType = 'ingreso' | 'egreso' | 'costo' | 'gasto'

export interface Profile {
  id: string
  name: string
  email: string
  currency: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  space: Space
  date: string
  type: TxType
  category_id?: string
  description: string
  amount: number
  payment_method?: string
  client?: string
  notes?: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  space: string
  type: CatType
  name: string
  color: string
  is_default: boolean
}

export interface PaymentMethod {
  id: string
  user_id: string
  name: string
  is_default: boolean
}

export interface SalesLine {
  id: string
  user_id: string
  name: string
  active: boolean
}

export interface Gamification {
  user_id: string
  xp: number
  level: number
  streak_days: number
  last_record_date?: string
}

export interface Budget {
  id: string
  user_id: string
  space: Space
  category_name: string
  amount_limit: number
  month: number
  year: number
}
