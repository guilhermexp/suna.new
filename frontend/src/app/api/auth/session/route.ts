import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json({ session: null, user: null }, { status: 200 });
    }

    return NextResponse.json({
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      } : null,
      user: session?.user ?? null,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in session API:', error);
    return NextResponse.json({ session: null, user: null }, { status: 500 });
  }
}
