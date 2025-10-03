import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const supabase = await createClient();

    // Test sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        errorDetails: error
      }, { status: 400 });
    }

    // Test get user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      hasSession: !!data?.session,
      hasUser: !!userData?.user,
      userId: userData?.user?.id,
      userEmail: userData?.user?.email,
      sessionExpiry: data?.session?.expires_at,
      getUserError: userError?.message
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 });
  }
}