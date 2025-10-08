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

        const cookies = source.split('; ').filter(Boolean).map((pair) => {
          const eq = pair.indexOf('=')
          const name = eq >= 0 ? pair.slice(0, eq) : pair
          const value = eq >= 0 ? pair.slice(eq + 1) : ''

          // Return cookies as-is - Supabase SSR handles all encoding/decoding internally
          // Do NOT use decodeURIComponent as it can corrupt base64-encoded values

          return { name, value }
        })

        // Debug log to see what cookies we're returning
        const authCookie = cookies.find(c => c.name.includes('auth-token'))
        if (authCookie) {
          console.log('Supabase client getAll: Returning cookies', {
            totalCount: cookies.length,
            authCookie: {
              name: authCookie.name,
              valueLength: authCookie.value.length,
              isBase64: authCookie.value.startsWith('base64-'),
              valuePreview: authCookie.value.substring(0, 50) + '...'
            },
            allCookies: cookies.map(c => ({ name: c.name, valueLength: c.value.length }))
          })
        } else {
          console.log('Supabase client getAll: No auth cookie found', {
            cookieCount: cookies.length,
            cookieNames: cookies.map(c => c.name)
          })
        }

        return cookies
      },
      async setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        for (const { name, value, options } of cookiesToSet) {
          // Ignore `httpOnly` on the client – browsers won't set it via JS
          const { name: _ignored, httpOnly: _httpOnly, ...rest } = (options ?? {}) as any

          // Pass the value as-is - Supabase SSR handles the encoding/decoding
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
