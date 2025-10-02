import type { NextConfig } from 'next';

function applyEnvFallbacks() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_ANON_KEY
  ) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  }

  if (!process.env.NEXT_PUBLIC_BACKEND_URL && process.env.BACKEND_URL) {
    process.env.NEXT_PUBLIC_BACKEND_URL = process.env.BACKEND_URL;
  }

  if (!process.env.NEXT_PUBLIC_URL && process.env.APP_URL) {
    process.env.NEXT_PUBLIC_URL = process.env.APP_URL;
  }

  if (!process.env.NEXT_PUBLIC_ENV_MODE && process.env.ENV_MODE) {
    process.env.NEXT_PUBLIC_ENV_MODE = process.env.ENV_MODE.toUpperCase();
  }
}

applyEnvFallbacks();

const nextConfig = (): NextConfig => ({
  output: (process.env.NEXT_OUTPUT as 'standalone') || undefined,
  eslint: {
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://eu.i.posthog.com/flags',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
});

export default nextConfig;
