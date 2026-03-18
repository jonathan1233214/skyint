import { createClient } from '@supabase/supabase-js'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Use real URL only if it looks valid; fallback prevents build-time crash
const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = rawKey.length > 10 ? rawKey : 'placeholder-anon-key-xxxxxxxxxxxxxxxx'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(supabaseUrl, supabaseAnonKey)
