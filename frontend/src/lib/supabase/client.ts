import { createBrowserClient } from '@supabase/ssr'
import { serialize } from 'cookie'

export function createClient() {
  // Provide fallback values to prevent build errors
  // These will be replaced with actual values at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  // Bridge auth state between server (httpOnly cookies) and client by
  // configuring cookie methods for @supabase/ssr. Without these, the
  // client storage cannot read/write the auth cookie and `getSession()`
  // will return null after a server-side sign-in, causing a blank screen.
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async getAll() {
        if (typeof document === 'undefined') return []
        const source = document.cookie || ''
        if (!source) return []
        return source.split('; ').filter(Boolean).map((pair) => {
          const eq = pair.indexOf('=')
          const name = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair)
          const value = decodeURIComponent(eq >= 0 ? pair.slice(eq + 1) : '')
          return { name, value }
        })
      },
      async setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        for (const { name, value, options } of cookiesToSet) {
          // Ignore `httpOnly` on the client – browsers won't set it via JS
          const { name: _ignored, httpOnly: _httpOnly, ...rest } = (options ?? {}) as any
          document.cookie = serialize(name, value ?? '', {
            path: '/',
            // Defaults from @supabase/ssr DEFAULT_COOKIE_OPTIONS
            sameSite: 'lax',
            secure: true,
            ...rest,
          })
        }
      },
    },
  })
}
