import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 有环境变量才创建客户端，否则返回 null，数据层自动回退到 localStorage
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: false } })
    : null
