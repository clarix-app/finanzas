import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useUsdtPurchases(year: number, month: number, country: string, userId: string | undefined) {
  const [amount, setAmount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('usdt_purchases')
      .select('amount')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .eq('country', country)
      .maybeSingle()
    setAmount(data?.amount ?? 0)
    setLoading(false)
  }, [userId, year, month, country])

  useEffect(() => { fetch() }, [fetch])

  const save = useCallback(async (newAmount: number) => {
    if (!userId) return
    setSaving(true)
    await supabase.from('usdt_purchases').upsert({
      user_id: userId,
      year,
      month,
      country,
      amount: newAmount,
    }, { onConflict: 'user_id,year,month,country' })
    setAmount(newAmount)
    setSaving(false)
  }, [userId, year, month, country])

  return { amount, loading, saving, save }
}
