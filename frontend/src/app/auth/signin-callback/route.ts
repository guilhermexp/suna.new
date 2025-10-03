import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/dashboard';

  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // If not authenticated, redirect back to auth
    return NextResponse.redirect(new URL('/auth', requestUrl.origin));
  }

  // User is authenticated, redirect to intended destination
  return NextResponse.redirect(new URL(returnUrl, requestUrl.origin));
}