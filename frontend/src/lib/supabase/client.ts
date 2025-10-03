import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide fallback values to prevent build errors
  // These will be replaced with actual values at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // Use default cookie handling from @supabase/ssr
  // No custom cookie config to avoid SSR issues
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}
