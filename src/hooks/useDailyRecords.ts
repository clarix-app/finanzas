import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useDailyRecords(year: number, month: number, country: string) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      if (isCurrent) fetchRecords()
    })

    async function fetchRecords() {
      setLoading(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      const user = session?.user ?? null

      console.log('[useDailyRecords] Usuario activo:', user?.id)
      console.log('[useDailyRecords] Sesión activa:', !!session)

      if (!isCurrent) return
      if (!user) {
        console.warn('[useDailyRecords] No hay usuario autenticado, abortando query')
        setRecords([])
        setLoading(false)
        return
      }

      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      console.log('[useDailyRecords] Filtros:', { user_id: user.id, country, from, to })

      const { data, error } = await supabase
        .from('daily_records')
        .select('*, products(name)')
        .eq('user_id', user.id)
        .eq('country', country)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })

      if (!isCurrent) return

      console.log('[useDailyRecords] Datos recibidos:', data)
      console.log('[useDailyRecords] Error:', error)
      console.log('[useDailyRecords] Registros obtenidos:', data?.length)

      if (error) {
        console.error('Error al cargar daily_records:', error)
        setRecords([])
      } else {
        setRecords(data || [])
      }

      setLoading(false)
    }

    fetchRecords()

    return () => {
      isCurrent = false
      authSub.subscription.unsubscribe()
    }
  }, [year, month, country])

  async function addRecord(record: any) {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    console.log('[addRecord] user_id:', user?.id, 'payload:', record)

    if (!user) {
      const error = { message: 'No hay sesión activa' } as any
      console.error('[addRecord] Sin usuario autenticado')
      return { data: null, error }
    }

    const { data, error } = await supabase
      .from('daily_records')
      .insert({ ...record, user_id: user.id })
      .select('*, products(name)')
      .maybeSingle()

    if (error) {
      console.error('[addRecord] Error guardando:', error.message, error)
    } else if (data) {
      console.log('[addRecord] Insertado OK:', data.id)
      setRecords(prev => (data.country === country ? [...prev, data] : prev))
    }

    return { data, error }
  }

  async function deleteRecord(id: string) {
    const { error } = await supabase
      .from('daily_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteRecord] Error al eliminar:', error.message, error)
    } else {
      setRecords(prev => prev.filter((r: any) => r.id !== id))
    }
  }

  async function updateRecord(id: string, updates: Record<string, any>) {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    console.log('[updateRecord] user_id:', user?.id, 'id:', id, 'updates:', updates)

    if (!user) {
      const error = { message: 'No hay sesión activa' } as any
      console.error('[updateRecord] Sin usuario autenticado')
      return { error }
    }

    const { data, error } = await supabase
      .from('daily_records')
      .update(updates)
      .eq('id', id)
      .select('*, products(name)')
      .maybeSingle()

    if (error) {
      console.error('[updateRecord] Error al actualizar:', error.message, error)
      return { error }
    }

    if (data) {
      console.log('[updateRecord] Actualizado OK:', data.id)
      setRecords(prev => prev.map(r => r.id === id ? data : r))
    } else {
      console.warn('[updateRecord] update no devolvió fila — RLS podría estar bloqueando')
    }

    return { error: null }
  }

  return { records, loading, addRecord, deleteRecord, updateRecord }
}
