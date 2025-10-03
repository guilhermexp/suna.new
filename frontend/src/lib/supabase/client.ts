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
          return document.cookie
            .split('; ')
            .filter(Boolean)
            .map(cookie => {
              const separatorIndex = cookie.indexOf('=')

              if (separatorIndex === -1) {
                return { name: cookie, value: '' }
              }

              const name = cookie.slice(0, separatorIndex)
              const value = cookie.slice(separatorIndex + 1)

              return { name, value }
            })
        },
        setAll(cookiesToSet) {
          // Only set cookies in browser environment
          if (typeof window === 'undefined') {
            return
          }

          cookiesToSet.forEach(({ name, value, options = {} }) => {
            const cookieAttributes = [
              `${name}=${value}`,
              `Path=${options.path ?? '/'}`,
              options.maxAge ? `Max-Age=${options.maxAge}` : undefined,
              options.expires ? `Expires=${options.expires.toUTCString()}` : undefined,
              `SameSite=${options.sameSite ?? 'Lax'}`,
              options.secure ? 'Secure' : undefined,
            ].filter(Boolean)

            document.cookie = cookieAttributes.join('; ')
          })
        },
      },
    }
  )
}
