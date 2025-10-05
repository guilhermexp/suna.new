# Authentication Debug Report - Railway Production
**Date:** October 3, 2025
**Project:** Kortix Suna (frontend)
**Environment:** Production (Railway)
**Issue:** Authentication not persisting after successful login

## 🔴 THE PROBLEM IN ONE SENTENCE
Login works server-side but client-side Supabase can't read the authentication cookie, causing immediate redirect back to login page.

## 🎯 Quick Test Instructions
1. Go to: https://frontend-production-410a.up.railway.app/auth
2. Login with: `guilherme-varela@hotmail.com` / `adoado01`
3. Watch console: You'll see "AuthProvider: Session retrieved: {hasSession: false}"
4. Cookie EXISTS but client can't read it properly

## Quick Access Information

### 🔑 Test Credentials
```
Email: guilherme-varela@hotmail.com
Password: adoado01
```

### 🌐 URLs
- **Production App:** https://frontend-production-410a.up.railway.app
- **Login Page:** https://frontend-production-410a.up.railway.app/auth
- **GitHub Repo:** https://github.com/guilhermexp/suna.new
- **Supabase Project:** https://qupamuozvmiewijkvxws.supabase.co
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qupamuozvmiewijkvxws

### 🚂 Railway Details
```yaml
Project ID: ac7acd0f-9af5-4a0a-a7a3-093936e37e50
Service ID: a68ecad7-5f30-4f46-8b80-447d0903fd21
Environment ID: c7e389d9-2dfe-4670-b610-600cf7f1c672
Service Name: frontend
```

### 🔧 Complete Environment Variables (Railway)
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qupamuozvmiewijkvxws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cGFtdW96dm1pZXdpamt2eHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTM2MDAsImV4cCI6MjA3NDA4OTYwMH0.06-Ixix45QPrh3Uj_htCpEZ5vCqud2qWEUdnwfR0xso

# Application URLs
NEXT_PUBLIC_URL=https://frontend-production-410a.up.railway.app
NEXT_PUBLIC_BACKEND_URL=https://backend-production-bda1.up.railway.app/api
RAILWAY_PUBLIC_DOMAIN=frontend-production-410a.up.railway.app

# Railway Service Info
RAILWAY_PROJECT_ID=ac7acd0f-9af5-4a0a-a7a3-093936e37e50
RAILWAY_SERVICE_ID=a68ecad7-5f30-4f46-8b80-447d0903fd21
RAILWAY_ENVIRONMENT_ID=c7e389d9-2dfe-4670-b610-600cf7f1c672
RAILWAY_SERVICE_NAME=frontend
RAILWAY_PROJECT_NAME=suna-kortix

# Build Configuration
NEXT_OUTPUT=standalone
RAILWAY_DOCKERFILE_PATH=frontend/Dockerfile
NEXT_PUBLIC_ENV_MODE=PRODUCTION
```

### 📁 Key File Paths
```
/frontend/src/app/auth/page.tsx              # Login page component
/frontend/src/lib/supabase/client.ts         # Client-side Supabase config
/frontend/src/lib/supabase/server.ts         # Server-side Supabase config
/frontend/src/middleware.ts                  # Auth middleware
/frontend/src/components/AuthProvider.tsx    # Auth context provider
/frontend/src/components/ui/sidebar.tsx      # Sidebar with cookie management
/frontend/Dockerfile                          # Docker config for Railway
/frontend/package.json                       # Dependencies and scripts
```

### 🍪 Cookie Structure Found
```javascript
Cookie Name: sb-qupamuozvmiewijkvxws-auth-token
Cookie Format: base64-{JSON_PAYLOAD}
Cookie Content:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1759484246,
  "refresh_token": "ym5n7hed3l72",
  "user": {
    "id": "f74eb556-f48b-4a61-9db7-5d4486ac4a46",
    "email": "guilherme-varela@hotmail.com",
    // ... full user object
  }
}
```

### 🐳 Docker Testing (Working Locally)
```bash
# Build and run locally
cd suna.new/frontend
docker build -t kortix-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://qupamuozvmiewijkvxws.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cGFtdW96dm1pZXdpamt2eHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTM2MDAsImV4cCI6MjA3NDA4OTYwMH0.06-Ixix45QPrh3Uj_htCpEZ5vCqud2qWEUdnwfR0xso \
  kortix-frontend

# Application works perfectly at http://localhost:3000
# Login with: guilherme-varela@hotmail.com / adoado01
```

### 🚀 Railway Services in Project
```yaml
Frontend Service:
  URL: https://frontend-production-410a.up.railway.app
  Service ID: a68ecad7-5f30-4f46-8b80-447d0903fd21
  Status: Running with authentication issues

Backend Service:
  URL: https://backend-production-bda1.up.railway.app
  Service ID: b5d1542b-1b69-4862-b520-6a5de10480a1
  Status: Check Railway dashboard

Worker Service:
  Service ID: d4248bfe-8afc-469a-a509-6354fa537503
  Status: Check Railway dashboard

Redis Service:
  Service ID: e171052d-3fd0-41ec-bc5b-252a272daa5f
  Status: Check Railway dashboard
```

## 1. Initial Problem Description

### User Report
- **Problem:** Unable to exit login page on Railway-deployed production app
- **Test Credentials:** guilherme-varela@hotmail.com / adoado01
- **Working Status:** Application works perfectly locally with Docker
- **Deployment URL:** https://frontend-production-410a.up.railway.app

### Initial Symptoms
- Login form submission succeeds (server-side)
- User is redirected back to login page immediately
- Authentication cookie not persisting on client side
- Server logs show successful authentication but client doesn't recognize it

## 2. Environment Configuration

### Supabase Settings
- **Email Confirmation:** DISABLED (confirmed via screenshot)
- **Project URL:** qupamuozvmiewijkvxws.supabase.co
- **Authentication Method:** Email/Password

### Railway Configuration
- **Project ID:** ac7acd0f-9af5-4a0a-a7a3-093936e37e50
- **Service ID:** a68ecad7-5f30-4f46-8b80-447d0903fd21
- **Environment ID:** c7e389d9-2dfe-4670-b610-600cf7f1c672
- **Domain:** https://frontend-production-410a.up.railway.app
- **GitHub Integration:** Connected to guilhermexp/suna.new

### Technology Stack
- **Framework:** Next.js 15.3.3 with App Router
- **Authentication:** Supabase Auth with @supabase/ssr
- **Deployment:** Docker container with standalone output mode
- **Node Version:** 20.11.0-alpine

## 3. Debugging Journey

### Phase 1: Initial Discovery
**Finding:** Server-side authentication works, but client-side doesn't persist

**Evidence:**
```javascript
// Server logs showed:
"Sign in successful: {
  userId: 'f74eb556-f48b-4a61-9db7-5d4486ac4a46',
  email: 'guilherme-varela@hotmail.com',
  hasSession: true
}"

// But client logs showed:
"AuthProvider: Session retrieved: {
  hasSession: false,
  userId: undefined,
  email: undefined
}"
```

### Phase 2: Router Navigation Issue
**Problem:** Using `router.push()` wasn't properly reloading the page

**Original Code (auth/page.tsx):**
```typescript
router.push(redirectUrl);
```

**Fix Applied:**
```typescript
window.location.replace(redirectUrl);
```

**Result:** Partial improvement, but still redirecting to auth page

### Phase 3: MFA/AAL Checker Issue
**Problem:** MFA/AAL checker causing redirect loops

**Original Code:**
```typescript
if (event === 'MFA_CHALLENGE_VERIFIED') {
  // Check AAL and redirect
}
```

**Fix Applied:** Temporarily disabled AAL checker

**Result:** No improvement, issue persisted

### Phase 4: Cookie HttpOnly Flag Issue
**Problem:** Cookies marked as httpOnly prevented client from reading them

**Original middleware.ts:**
```typescript
cookieStore.set(name, value, options);
```

**Fix Applied:**
```typescript
const modifiedOptions = {
  ...options,
  httpOnly: false,  // Allow client to read cookies
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production'
};
```

**Result:** Cookies now readable by client but still not recognized by Supabase

### Phase 5: SSR Errors with Document Object
**Problem:** Multiple "document is not defined" errors during build

**Error Locations:**
1. `/src/lib/supabase/client.ts` - Custom cookie management
2. `/src/components/ui/sidebar.tsx` - Sidebar state persistence

**Fix Applied to sidebar.tsx:**
```typescript
// Only set cookie in browser environment to avoid SSR errors
if (typeof window !== 'undefined') {
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
}
```

**Fix Applied to client.ts (Initial):**
```typescript
// Removed custom cookie config entirely
return createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)
```

**Result:** Build succeeded but authentication still failed

### Phase 6: Railway Deployment Issues
**Problem:** "Deployment does not have an associated build" error

**Actions Taken:**
1. Reconnected GitHub repository to Railway
2. Configured proper build settings
3. Updated package.json version to trigger deployment

**Result:** Deployment successful but authentication still broken

### Phase 7: Cookie Format Investigation
**Discovery:** Cookie is being set with `base64-` prefix but client not parsing correctly

**Cookie Structure Found:**
```
sb-qupamuozvmiewijkvxws-auth-token=base64-{JSON_PAYLOAD}
```

**Latest Fix Applied (client.ts):**
```typescript
return createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      getAll() {
        if (typeof window === 'undefined') return []

        const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
          const [name, value] = cookie.split('=')
          if (name && value) {
            acc.push({ name, value })
          }
          return acc
        }, [] as { name: string; value: string }[])

        return cookies
      },
      setAll(cookiesToSet) {
        if (typeof window === 'undefined') return

        cookiesToSet.forEach(({ name, value, options = {} }) => {
          const cookieStr = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 31536000}; SameSite=${options.sameSite || 'Lax'}`
          document.cookie = cookieStr
        })
      },
    },
  }
)
```

## 4. Current Status

### What's Working
- ✅ Server-side authentication successful
- ✅ Authentication token properly generated
- ✅ Cookie is being set with correct user data (with base64- prefix)
- ✅ Middleware correctly identifies authenticated user
- ✅ Railway deployment pipeline working
- ✅ GitHub integration auto-deploying on push
- ✅ Server logs confirm: "Sign in successful" with correct userId

### What's Not Working
- ❌ Client-side Supabase client not recognizing the authentication cookie
- ❌ AuthProvider's `getSession()` returns null despite valid cookie
- ❌ Immediate redirect back to auth page after successful login
- ❌ Cookie format mismatch: Server sets `base64-{json}` but client may expect different format

### Latest Deployment
- **Deployment ID:** c8a2681d-7a55-4877-92c7-8e5075e4df71
- **Status:** SUCCESS (deployed at 8:36:44 AM)
- **Commit:** "fix: add proper cookie handling for Supabase client to persist authentication"

### Cookie Evidence
```
Cookie Name: sb-qupamuozvmiewijkvxws-auth-token
Cookie Format: base64-{JSON_PAYLOAD}
Cookie Contains: Valid access_token, refresh_token, user object with correct ID
```

## 5. Files Modified During Debug Process

1. **`/frontend/src/app/auth/page.tsx`**
   - Changed navigation method from router.push to window.location.replace
   - Disabled AAL checker temporarily

2. **`/frontend/src/lib/supabase/client.ts`**
   - Multiple iterations of cookie handling
   - Currently using custom getAll/setAll with browser checks

3. **`/frontend/src/lib/supabase/server.ts`**
   - Modified cookie options to remove httpOnly flag
   - Added sameSite and secure settings

4. **`/frontend/src/middleware.ts`**
   - Modified cookie settings for client accessibility
   - Added debug logging for production

5. **`/frontend/src/components/ui/sidebar.tsx`**
   - Added typeof window check for SSR compatibility

6. **`/frontend/package.json`**
   - Version bump from 0.1.0 to 0.1.1

## 6. Key Learnings

1. **SSR Compatibility:** Any code accessing `document` or `window` must be wrapped in `typeof window !== 'undefined'` checks

2. **Cookie Management:** Supabase's cookie handling with Next.js requires careful configuration between server and client

3. **Railway Specifics:** Railway uses the PORT environment variable and requires proper Dockerfile configuration

4. **Debug Logging:** Production logs are crucial - added extensive logging to track authentication flow

## 7. Potential Root Causes

1. **Cookie Domain Mismatch:** Cookie might be set for wrong domain/path
2. **Supabase SSR Package Issue:** Potential incompatibility with production environment
3. **Cookie Parsing:** The `base64-` prefix might not be handled correctly by client
4. **Timing Issue:** Client might be checking session before cookies are properly set

## 8. Next Steps to Try

1. **Verify Cookie Domain:** Check if cookie is being set for correct domain in production
2. **Test Different Cookie Libraries:** Try using js-cookie or similar for more control
3. **Add Cookie Parser:** Explicitly handle the base64- prefix in cookie value
4. **Session Refresh:** Force a session refresh after login before redirect
5. **Supabase Version:** Check if using latest @supabase/ssr version

## 9. Commands for Quick Testing

```bash
# Check latest deployment status
mcp__railway-mcp__deployment_list

# View deployment logs
mcp__railway-mcp__deployment_logs --deploymentId={ID}

# Test authentication via browser
# Navigate to: https://frontend-production-410a.up.railway.app/auth
# Use credentials: guilherme-varela@hotmail.com / adoado01

# Check browser console for:
# - AuthProvider logs
# - Cookie values
# - Network requests
```

## 10. How to Debug (Step by Step)

### A. Check Railway Deployment Status
```bash
# Using Railway MCP
mcp__railway-mcp__deployment_list \
  --projectId="ac7acd0f-9af5-4a0a-a7a3-093936e37e50" \
  --serviceId="a68ecad7-5f30-4f46-8b80-447d0903fd21" \
  --environmentId="c7e389d9-2dfe-4670-b610-600cf7f1c672"

# Get deployment logs
mcp__railway-mcp__deployment_logs --deploymentId="{DEPLOYMENT_ID}"
```

### B. Test Authentication in Browser
1. Open Chrome DevTools (F12)
2. Navigate to: https://frontend-production-410a.up.railway.app/auth
3. Open Console tab
4. Try login with: guilherme-varela@hotmail.com / adoado01
5. Check Console for:
   - "AuthProvider: Session retrieved" messages
   - Any error messages
6. Check Application > Cookies for:
   - `sb-qupamuozvmiewijkvxws-auth-token` cookie

### C. Check Cookie in Console
```javascript
// Run in browser console:
document.cookie.split('; ').find(row => row.startsWith('sb-qupamuozvmiewijkvxws-auth-token'))

// Decode cookie value:
const cookieValue = document.cookie.split('; ').find(row => row.startsWith('sb-qupamuozvmiewijkvxws-auth-token='))?.split('=')[1];
if (cookieValue) {
  const decoded = atob(cookieValue.replace('base64-', ''));
  console.log(JSON.parse(decoded));
}
```

### D. Test with Playwright/Chrome DevTools MCP
```bash
# Using Playwright
mcp__playwright__browser_navigate --url="https://frontend-production-410a.up.railway.app/auth"

# Fill login form
mcp__playwright__browser_fill_form --fields='[
  {"name": "Email address", "type": "textbox", "value": "guilherme-varela@hotmail.com"},
  {"name": "Password", "type": "textbox", "value": "adoado01"}
]'

# Check cookies after login
mcp__playwright__browser_evaluate --function='() => document.cookie'
```

### E. Local Testing with Production Config
```bash
# Clone repo
git clone https://github.com/guilhermexp/suna.new.git
cd suna.new/frontend

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL=https://qupamuozvmiewijkvxws.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cGFtdW96dm1pZXdpamt2eHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTM2MDAsImV4cCI6MjA3NDA4OTYwMH0.06-Ixix45QPrh3Uj_htCpEZ5vCqud2qWEUdnwfR0xso

# Run locally
npm install
npm run dev

# Test at http://localhost:3000
# Login with: guilherme-varela@hotmail.com / adoado01
```

### F. Railway CLI Commands
```bash
# Link to project
railway link ac7acd0f-9af5-4a0a-a7a3-093936e37e50

# View logs
railway logs

# Deploy manually
railway up

# Check service info
railway status
```

## 11. Supabase Configuration

### Dashboard Access
1. Go to: https://supabase.com/dashboard/project/qupamuozvmiewijkvxws
2. Check Authentication > Settings
3. Verify:
   - Email confirmations: DISABLED
   - Site URL: https://frontend-production-410a.up.railway.app
   - Redirect URLs include: https://frontend-production-410a.up.railway.app/*

### Important Settings
```
Project URL: https://qupamuozvmiewijkvxws.supabase.co
API URL: https://qupamuozvmiewijkvxws.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1cGFtdW96dm1pZXdpamt2eHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MTM2MDAsImV4cCI6MjA3NDA4OTYwMH0.06-Ixix45QPrh3Uj_htCpEZ5vCqud2qWEUdnwfR0xso
Service Role Key: [Do not expose - check Supabase dashboard]
JWT Secret: [Do not expose - check Supabase dashboard]
```

## 12. Quick Fix Attempts

### Option 1: Force Cookie Refresh
```typescript
// In AuthProvider.tsx after login
await supabase.auth.refreshSession();
window.location.reload();
```

### Option 2: Manual Cookie Parse
```typescript
// In client.ts
getAll() {
  const cookies = document.cookie.split('; ').map(cookie => {
    const [name, value] = cookie.split('=');
    // Handle base64 prefix
    if (name && value && name.startsWith('sb-')) {
      const actualValue = value.startsWith('base64-')
        ? value.substring(7)
        : value;
      return { name, value: actualValue };
    }
    return { name, value };
  });
  return cookies;
}
```

### Option 3: Use Different Cookie Library
```bash
npm install js-cookie
```

```typescript
import Cookies from 'js-cookie';

// In client.ts
getAll() {
  return Object.entries(Cookies.get()).map(([name, value]) => ({
    name,
    value
  }));
}
```

## 13. Quick Deploy After Fix

### Deploy via Git Push (Automatic)
```bash
# Make your fix in the code
cd suna.new/frontend
git add .
git commit -m "fix: description of fix"
git push origin main

# Railway auto-deploys from GitHub
# Check deployment at: https://railway.app/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50
```

### Monitor Deployment
```bash
# Using Railway MCP to check status
mcp__railway-mcp__deployment_list \
  --projectId="ac7acd0f-9af5-4a0a-a7a3-093936e37e50" \
  --serviceId="a68ecad7-5f30-4f46-8b80-447d0903fd21" \
  --environmentId="c7e389d9-2dfe-4670-b610-600cf7f1c672" \
  --limit=1

# Get logs of latest deployment
mcp__railway-mcp__deployment_logs --deploymentId="{LATEST_DEPLOYMENT_ID}" --limit=50
```

### Test After Deploy
```bash
# Wait ~3 minutes for deployment
# Test at: https://frontend-production-410a.up.railway.app/auth
# Use Chrome DevTools Console to check:
document.cookie
localStorage.getItem('auth-tracking-storage')
```

## 14. Contact & Support

- **Railway Dashboard:** https://railway.app/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50
- **GitHub Repo Owner:** guilhermexp
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qupamuozvmiewijkvxws
- **Supabase Support:** support@supabase.com
- **Railway Support:** https://railway.app/help

---
**Document Created:** October 3, 2025
**Last Updated:** During active debug session
**Status:** Issue ongoing - authentication works server-side but fails client-side
**Latest Working Commit:** db0dfa52 (fix: add proper cookie handling for Supabase client)
**Latest Deployment:** c8a2681d-7a55-4877-92c7-8e5075e4df71 (SUCCESS)