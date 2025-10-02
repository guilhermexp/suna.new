import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_ENV_MODE: process.env.NEXT_PUBLIC_ENV_MODE,
    config_ENV_MODE: config.ENV_MODE,
    config_IS_LOCAL: config.IS_LOCAL,
    config_IS_STAGING: config.IS_STAGING,
    NODE_ENV: process.env.NODE_ENV,
    all_NEXT_PUBLIC: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {} as Record<string, string | undefined>)
  });
}
