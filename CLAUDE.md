# tufan-auth

Shared Supabase auth package consumed by all Tufan family Next.js apps via `github:Tufan/tufan-auth`.

## Architecture

- **Single Supabase project** handles auth for all apps (admin, vault, meal planner, etc.)
- **Google Workspace SSO** restricted to `tufan.co.uk` domain via `hd` query param
- **`approved_users` table** in Supabase gates access — only listed emails can log in
- Compiled with **tsup** to ESM — consumers get pre-built JS from `dist/`

## Source files

- `src/client.ts` — browser Supabase client (`createBrowserClient`)
- `src/server.ts` — server Supabase client with cookie handling, `getSession()`, `requireSession()`
- `src/middleware.ts` — Next.js middleware that refreshes tokens and redirects unauthenticated users
- `src/guard.tsx` — `<AuthGuard>` React component with loading state and Google sign-in button
- `src/callback.ts` — `createCallbackHandler()` factory for the `/auth/callback` route

## Build

```bash
npm run build
```

This compiles `src/` → `dist/` using tsup. The `dist/` directory is committed to git because consumers install from GitHub without a build step.

**Always run `npm run build` and commit `dist/` after changing source files.**

## tsup config

- Client-side files (`client.ts`, `guard.tsx`) get `"use client"` banner
- Server-side files (`server.ts`, `middleware.ts`, `callback.ts`) have no banner
- All peer dependencies (`next`, `react`, `@supabase/*`) are externalized

## Key patterns

- Auth callback exchanges the Supabase code for a session, checks `approved_users`, and redirects
- Middleware uses `supabase.auth.getUser()` (not `getSession`) for secure server-side validation
- The `AuthGuard` component subscribes to `onAuthStateChange` for reactive session updates
- `requireSession()` throws a `Response` object — catch it in the route handler or let Next.js handle it

## Consuming apps

Each app needs:
1. `npm install github:Tufan/tufan-auth @supabase/ssr @supabase/supabase-js`
2. Two env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. An `/auth/callback` route using `createCallbackHandler()`
4. Middleware or `<AuthGuard>` (or both) for protection
