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
        getAll() {
          // Only access cookies in browser environment
          if (typeof window === 'undefined') {
            return []
          }

          // Parse cookies from document.cookie
          const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=')
            if (name && value) {
              acc.push({ name, value })
            }
            return acc
          }, [] as { name: string; value: string }[])

          return cookies
        },
        setAll(cookiesToSet) {
          // Only set cookies in browser environment
          if (typeof window === 'undefined') {
            return
          }

          cookiesToSet.forEach(({ name, value, options = {} }) => {
            const cookieStr = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 31536000}; SameSite=${options.sameSite || 'Lax'}`
            document.cookie = cookieStr
          })
        },
      },
    }
  )
}
