import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const { data: { user } } = await supabase.auth.getUser()

      let query = supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (user) query = query.eq('user_id', user.id)

      const { data, error } = await query
      if (!error) setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  async function addProduct(product: {
    name: string;
    price_usd?: number | null;
    cost_usd?: number | null;
    sku?: string | null;
    category?: string | null;
    active?: boolean;
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, user_id: user?.id, active: product.active ?? true })
      .select()
      .maybeSingle()
    if (!error && data) setProducts(prev => [data, ...prev])
    return { data, error }
  }

  async function deleteProduct(id: string) {
    await supabase.from('products').update({ active: false }).eq('id', id)
    setProducts(prev => prev.filter((p: any) => p.id !== id))
  }

  return { products, loading, addProduct, deleteProduct }
}
