import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide fallback values to prevent build errors
  // These will be replaced with actual values at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // Let Supabase SSR handle cookies automatically using default browser storage
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
