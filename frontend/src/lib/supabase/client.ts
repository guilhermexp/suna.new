import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie
          .split('; ')
          .filter(Boolean)
          .map((cookie) => {
            const [name, ...value] = cookie.split('=')
            return { name, value: value.join('=') }
          })
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=${options?.path || '/'}; ${
            options?.maxAge ? `max-age=${options.maxAge};` : ''
          } ${options?.sameSite ? `samesite=${options.sameSite};` : ''} ${
            options?.secure ? 'secure;' : ''
          }`
        })
      },
    },
  })
}
