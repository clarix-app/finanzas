import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useAdSpend(year: number, month: number) {
  const [adSpend, setAdSpend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdSpend() {
      const { data: { user } } = await supabase.auth.getUser()
      const from = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      let query = supabase
        .from('ad_spend')
        .select('*, platforms(name, color)')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })

      if (user) query = query.eq('user_id', user.id)

      const { data, error } = await query
      if (!error) setAdSpend(data || [])
      setLoading(false)
    }
    fetchAdSpend()
  }, [year, month])

  async function addSpend(spend: any) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('ad_spend')
      .insert({ ...spend, user_id: user?.id })
      .select('*, platforms(name, color)')
      .maybeSingle()
    if (!error && data) setAdSpend(prev => [data, ...prev])
    return { data, error }
  }

  return { adSpend, loading, addSpend }
}
