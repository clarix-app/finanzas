import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sxxgarvmbphwtewtrbao.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_XB-V0yk09Mepm9p5vuhTfA_2DudYTxO'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
