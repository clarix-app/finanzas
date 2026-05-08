import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useCurrencyConfig() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRates() {
      const { data, error } = await supabase
        .from('currency_config')
        .select('*')
      if (!error) setRates(data || [])
      setLoading(false)
    }
    fetchRates()
  }, [])

  async function updateRate(currency_code: string, rate_to_usd: number) {
    const { error } = await supabase
      .from('currency_config')
      .update({ rate_to_usd, updated_at: new Date().toISOString() })
      .eq('currency_code', currency_code)
    if (!error) {
      setRates(prev => prev.map((r: any) =>
        r.currency_code === currency_code ? { ...r, rate_to_usd } : r
      ))
    }
  }

  return { rates, loading, updateRate }
}
