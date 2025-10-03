import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('returnUrl') || searchParams.get('redirect') || '/dashboard'

  // Use headers to determine the actual origin in production (fixes issue #873)
  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  const host = request.headers.get('host') ?? 'localhost:3000'
  const baseUrl = `${protocol}://${host}`

  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('❌ Auth callback error:', error, errorDescription)
    return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error)
        return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error.message)}`)
      }

      // URL to redirect to after sign in process completes
      return NextResponse.redirect(`${baseUrl}${next}`)
    } catch (error) {
      console.error('❌ Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${baseUrl}/auth?error=unexpected_error`)
    }
  }
  return NextResponse.redirect(`${baseUrl}/auth`)
}
