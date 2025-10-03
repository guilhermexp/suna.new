import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Provide fallback values to prevent build errors
  // These will be replaced with actual values at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          // Check if we're in the browser
          if (typeof window === 'undefined') {
            return undefined
          }

          const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))

          return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
        },
        set(name: string, value: string, options: any) {
          // Check if we're in the browser
          if (typeof window === 'undefined') {
            return
          }

          const optionsString = Object.entries(options || {})
            .map(([k, v]) => `${k}=${v}`)
            .join('; ')

          document.cookie = `${name}=${encodeURIComponent(value)}; ${optionsString}`
        },
        remove(name: string, options: any) {
          // Check if we're in the browser
          if (typeof window === 'undefined') {
            return
          }

          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        },
      },
    }
  )
}
