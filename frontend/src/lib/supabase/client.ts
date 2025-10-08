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
          let value = decodeURIComponent(eq >= 0 ? pair.slice(eq + 1) : '')

          // Handle base64 encoded values (Supabase SSR format)
          if (value.startsWith('base64-')) {
            try {
              value = atob(value.replace('base64-', ''))
            } catch (e) {
              console.error('Failed to decode base64 cookie value:', e)
            }
          }

          return { name, value }
        })
      },
      async setAll(cookiesToSet) {
        if (typeof document === 'undefined') return
        for (const { name, value, options } of cookiesToSet) {
          // Ignore `httpOnly` on the client – browsers won't set it via JS
          const { name: _ignored, httpOnly: _httpOnly, ...rest } = (options ?? {}) as any

          // If the value is a JSON object, encode it as base64 (Supabase SSR format)
          let cookieValue = value ?? ''
          if (cookieValue && typeof cookieValue === 'string' && cookieValue.startsWith('{')) {
            try {
              // Validate it's JSON first
              JSON.parse(cookieValue)
              cookieValue = 'base64-' + btoa(cookieValue)
            } catch (e) {
              // Not JSON, use as is
            }
          }

          document.cookie = serialize(name, cookieValue, {
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
